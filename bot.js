var { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client');
var dialogueflow = require('./dialogueflow');
var google = require('./google')

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token);
var web = new WebClient(token);

var {User, Reminder} = require('./models/models');
rtm.start();

function generateAttachments(){
  var attachments = [
     {
         "callback_id": "schedule_response",
         "attachment_type": "default",
         "fallback": "You have no friends",
         "actions": [
             {
                 "name": "confirm",
                 "text": "Yes",
                 "type": "button",
                 "value": "true",
                 "style": "default"
             },
             {
                 "name": "deny",
                 "text": "No",
                 "type": "button",
                 "value": "false",
                 "style": "danger"
             }
         ]
     }
  ]
  return attachments
}

var lastMessage = {};

function generateText(data){
  var text;
  var invites = '';
  var duration = '';
  console.log(data, 46);
  if(data.invitee){
    data.invitee.forEach(function(person, index){
      if(index === data.invitee.length - 1 && data.invitee.length > 1){
        invites = invites + ` and ${person}`
      } else {
        invites = invites + ` ${person},`
      }
    })
    if(data.duration){
      duration = `for ${data.duration.amount}${data.duration.unit}`;
    }
    text = `Would you like me to schedule a meeting with ${invites} on
    ${data.day} at ${data.time} ${duration}?`
  } else {
    text = `Would you like me to remind you to ${data.subject} on
    ${data.date}?`
  }
  return text;
}

// function generateText(data){
//   var text;
//   var invites = '';
//   var duration = '';
//   if(data.invitee){
//     data.invitee.forEach(function(person, index){
//       if(index === data.invitee.length - 1 && data.invitee.length > 1){
//         invites = invites + ` and ${person}`
//       } else {
//         invites = invites + ` ${person},`
//       }
//     })
//     if(data.duration){
//       duration = `for ${data.duration.amount}${data.duration.unit}`;
//     }
//     text = `Would you like me to schedule a meeting with ${invites} on
//     ${data.day} at ${data.time} ${duration}?`
//     //if yes or no
//     if (yes){
//         data.invitee.forEach(function(person, index){
//             User.find({slackId: data.slackId}, function(user) {
//                 if (user.channel){
//                     web.chat.postMessage(
//                         user.channel,
//                         `${inviter} invited you to a meeting on ${data.day} at ${data.time} for ${duration}. Are you able to make this?`,
//                         {attachments: generateAttachments()}
//                 } else {
//                     web.im.open(event.user)
//                         .then((res)=>{
//                             web.chat.postMessage(
//                                 res.channel.id,
//                                 `${inviter} invited you to a meeting on ${data.day} at ${data.time} for ${duration}. Are you able to make this?`,
//                                 {attachments: generateAttachments()})
//                         })
//
//                 }
//             )}
//         })
//         var meeting = new Meeting({
//             summary: 'subject',
//             description: 'description',
//             times: {
//               start: data.day + data.time,
//               end: data.day,
//               timeZone: 'America/Los_Angeles'
//             },
//             attendees: data.invitee,
//             pending: true
//         })
//         meeting.save();
//     } else { return; }
//   } else {
//     text = `Would you like me to remind you to ${data.subject} on
//     ${data.date}?`
//   }
//   return text;
// }

function handleDialogflowConvo(user, message) {
  console.log("USER PENDING", user.pending);
  if(user.pending){
    return web.im.open(user.slackId)
    .then((res)=>{
      return web.chat.postMessage(res.channel.id,
         "You first must repond to the most recent prompt:\n" + generateText(user.pending),
         {attachments: generateAttachments()},
       function(err, res){
         if( err ){
           console.log('error: ', err);
         } else {
           console.log('Reply sent ', res);
         }
       });
    })

  }
  web.users.list(message.team)
  .then(function(response){
    console.log(response);
    var { members } = response;
    var memberIdString = message.text.slice(message.text.indexOf('<'), message.text.indexOf('>') + 1);
    var memberId = memberIdString.slice(2, 11);
    members.forEach(function(member){
      if(member.id === memberId){
        message.text = message.text.replace(memberIdString, member.real_name.split(' ')[0]);
      }
    })
  })
  .then(function(){
    console.log(message.text);
    return dialogueflow.interpretUserMessage(message.text, message.user)
  })
  .then(function(res){
    var { data } = res;
      if(data.result.actionIncomplete){
        web.chat.postMessage(message.channel, data.result.fulfillment.speech)
      } else {
        user.pending = Object.assign({}, data.result.parameters);
        user.save()
        .then(function(){
          lastMessage.channel = message.channel;
          lastMessage.parameters = data.result.parameters,
          web.chat.postMessage(message.channel,
             generateText(data.result.parameters),
             {attachments: generateAttachments()},
           function(err, res){
             if( err ){
               console.log('error: ', err);
             } else {
               console.log('Reply sent ', res);
             }
           })


        })
        .catch(function(err){
          console.log('Error sending message to Dialogflow', err)
        })
      }
    })
}

rtm.on(RTM_EVENTS.PRESENCE_CHANGE, function(event){
  console.log(event);
  if(event.user !== 'U7PCCHUP3' && event.user !== 'U7QRBG10V' && event.user !== 'U7N5D1KPT'){
    var today = new Date();
    var todayFormatted = [today.getUTCDate(), today.getUTCMonth() + 1, today.getUTCFullYear()].join('-');
    var tomMillis = today.setDate(today.getDate() + 1);
    var tomorrow = new Date(tomMillis);
    var tomorrowFormatted = [tomorrow.getUTCDate(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCFullYear()].join('-');
    // reminders for today
    Reminder.find({date: tomorrowFormatted})
    .then((remindersTomorrow) => (Reminder.find({date: todayFormatted}, (err, remindersToday)=>{
      var tomorrowString = '\nReminders for tomorrow:\n'
      remindersTomorrow.map((activity)=>{
        tomorrowString += activity.subject + '\n'
      });
      var todayString = '\nReminders for today:\n'
      remindersToday.map((activity)=>{
        todayString += activity.subject + '\n'
      })
      web.im.open(event.user)
      .then((res)=>{
          web.chat.postMessage(res.channel.id, todayString + tomorrowString);
      })
    })))
  }
})

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    if (! message.user){
        console.log('message sent by bot, ignoring');
        return;
    }
    User.findOrCreate(message.user)
    .then(function(user){
      if (user.google.isSetupComplete) {
        google.recheckExpiration(user, user.google.tokens.expiry_date);
        handleDialogflowConvo(user, message);
      } else {
        web.chat.postMessage(message.channel, `Hello,
  I'm Scheduler Bot. Please give me access to your Google Calendar ${process.env.DOMAIN}/setup?slackId=${message.user}`)
      }
    });
  });
