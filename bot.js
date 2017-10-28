var { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client');
var dialogueflow = require('./dialogueflow');
var google = require('./google')

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token);
var web = new WebClient(token);

var {User, Reminder, Meeting} = require('./models/models');
rtm.start();

//attachments for confirmation
function generateAttachments(attendees){
  console.log(attendees, 'INSIDE GENERATE ATTACHMENTS');
  value = attendees[0].email ? attendees : "true";
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
                 "value": JSON.stringify(attendees),
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

//Generate text for confirmation
function generateText(data){
  var text;
  var invites = '';
  var duration = '';

  //Modifies string for grammatical accuracy
  if(data.invitee){
    data.invitee.forEach(function(person, index){
      if(index === data.invitee.length - 1 && data.invitee.length > 1){
        invites = invites + ` and ${person}`
      } else if (index === data.invitee.length - 2 && data.invitee.length > 1) {
        invites += ` ${person}`
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

//remind user of pending confirmations
function confirmationAlert(user){
  return web.im.open(user.slackId)
  .then((res)=>{
    return web.chat.postMessage(res.channel.id,
       "You first must repond to the most recent prompt:\n" + generateText(user.pending),
       {attachments: generateAttachments(user.pending.attendees)},
     function(err, res){
       if( err ){
         console.log('error: ', err);
       } else {
         console.log('Reply sent ', res);
       }
     });
  })

}

//function that fills array of attendees with name and email
function createAttendeeArray(response, message, attendees){
  console.log(attendees, "Inside createAttendeeArray");
  attendees = attendees.slice();

  //looks for team members slackIds in the message and returns an array full of them
  function recurse(string, array){
    if(string.indexOf('>') === -1){
      return array;
    } else {
      array = array.slice();
      var memberIdString = string.slice(string.indexOf('<'), string.indexOf('>') + 1);
      string = string.slice(string.indexOf('>') + 1);
      var memberId = memberIdString.slice(2, 11);
      array.push(memberId);
      return recurse(string, array)
    }
  }

  //extract the array of members from the users info
  var { members } = response;

  //find slackIds
  var memberIds = recurse(message.text, []);

  async function addToArray() {
    for(var memberId of memberIds){
      for(var member of members){
        if(member.id === memberId){
          message.text = message.text.replace('<@' + memberId + '>', member.real_name.split(' ')[0]);
          var account = await web.users.info(memberId);
          console.log(account.user.profile, 155);
          attendees.push({name:  account.user.profile.real_name, email: account.user.profile.email, slackId: memberId})
          console.log(attendees, "Directly under push");
          }
      }
    }

    return attendees
  }

  return addToArray()
  .then((attendees)=>( { attendees, text: message.text }))

  console.log("\n\n\n\n", attendees, "At 126", "\n\n\n\n");

}

//Handles all text entries by the client
function handleDialogflowConvo(user, message) {

  //check for outstanding confirmations
  if(user.pending){
    console.log(user.pending);
    return confirmationAlert(user)
  }

  console.log("\n\n", message, "\n\n");

  //find email for current user and push them to attendees
  var attendees = [];
  var text = '';
  web.users.info(user.slackId)
  .then((account) => attendees.push({name: account.user.profile.real_name, email: account.user.profile.email, slackId: user.slackId}))
  .then(()=>{
    //then find all the users information within this slack team
    web.users.list(message.team)
    .then((response) => {
      return createAttendeeArray(response, message, attendees)
    })
    .then((obj)=>{
      attendees = obj.attendees.slice();
      text = obj.text
      return dialogueflow.interpretUserMessage(text, message.user)
    })
    .then(function(res){
      var { data } = res;
        if(data.result.actionIncomplete){
          web.chat.postMessage(message.channel, data.result.fulfillment.speech)
        } else {
          user.pending = Object.assign({}, data.result.parameters, {invitee: attendees.map((person)=>person.name)}, {attendees: attendees});
          user.save()
          .then(function(){
            web.chat.postMessage(message.channel,
               generateText(data.result.parameters),
               {attachments: generateAttachments(attendees)},
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
    .then((user)=>{
        user.save()
        .then(function(){
          if (user.google.isSetupComplete) {
            google.recheckExpiration(user, user.google.tokens.expiry_date);
            handleDialogflowConvo(user, message);
          } else {
            web.chat.postMessage(message.channel, `Hello,
      I'm Scheduler Bot. Please give me access to your Google Calendar ${process.env.DOMAIN}/setup?slackId=${message.user}`)
          }
        })
      })
  });
