var { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client');
var dialogueflow = require('./dialogueflow')

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token);
var web = new WebClient(token);

rtm.start();


dialogueflow.interpretUserMessage(message.text, message.user)
.then(function(res){
    if(web.result.actionIncomplete){
      web.chat.postMessage(message.channel, data.result.fulfillment.speech)
    } else {
      web.chat.postMessage(message.channel,
           `You asked me to remind you to ${} on ${}.`)
    }
})
.catch(function(err){
    console.log('Error sending message to slack', err)
})
web.chat.postMessage( message.channel, `You said: ${message.text}`)
//   rtm.sendMessage('hi', message.channel)



rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    if (! messsage.user){
        console.log('message sent by bot, ignoring')
    }
    web.chat.postMessage(message.channel, `Hello`)
  });

  // axios.get({
  //   url: 'https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + message.channel + '&text=Hello World!',
  //   method: 'get'
  // })
  // .then(function (response) {
  //   // console.log(response);
  // })
  // .catch(function (error) {
  //   // console.log(error);
  // });;

rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});
