var { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client');
var dialogueflow = require('./dialogueflow')

var google = require('./google')

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token);
var web = new WebClient(token);

var User = require('./models/models');
rtm.start();

function handleDialogflowConvo(user, message) {
dialogueflow.interpretUserMessage(message.text, message.user)
.then(function(res){
  var { data } = res;
    if(data.result.actionIncomplete){
      web.chat.postMessage(message.channel, data.result.fulfillment.speech)
    } else {
      user.pending.subject = data.result.parameters.subject;
      user.pending.date = data.result.parameters.date;
      return user.save()
      .then(function(){
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
      web.chat.postMessage(message.channel,
           `Would you like me to remind you to ${data.result.parameters.subject} on ${data.result.parameters.date}?`,
           {attachments: attachments},
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
>>>>>>> master
    }
    text = `Would you like me to schedule a meeting with ${invites} on
    ${data.day} at ${data.time} ${duration}?`
  } else {
    text = `Would you like me to remind you to ${data.subject} on
    ${data.date}?`
  }
  return text;
}

function handleDialogflowConvo(user, message) {
  if(user.pending.date){
    return web.chat.postMessage(lastMessage.channel,
       "You first must repond to the most recent prompt:\n" + generateText(lastMessage.parameters),
       {attachments: generateAttachments()},
     function(err, res){
       if( err ){
         console.log('error: ', err);
       } else {
         console.log('Reply sent ', res);
       }
     })
  }
  web.users.list(message.team)
  .then(function(response){
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
        "I should not be here"
        user.pending = Object.assign({}, data.parameters);
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
