var { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client');
var dialogueflow = require('./dialogueflow')

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
        console.log("In print attachments");
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
           `Would you like me to remind you to ${data.result.parameters.subject} on
           ${data.result.parameters.date}?`,
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
        handleDialogflowConvo(user, message);
      } else {
        web.chat.postMessage(message.channel, `Hello,
  I'm Scheduler Bot. Please give me access to your Google Calendar https://98bfa26b.ngrok.io/setup?slackId=${message.user}`)
      }
    });
  });
