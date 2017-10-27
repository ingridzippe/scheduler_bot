var express = require('express');
var session = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes/routes');
var app = express();
var axios = require('axios')
var google = require('./google');
var dialogueflow = require('./dialogueflow');

var { User, Reminder } = require('./models/models')

require('./bot')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);

app.get('/setup', function (req, res){
  var url = google.generateAuthUrl(req.query.slackId);
  res.redirect(url)
})

app.get('/google/callback', function(req, res){
  console.log(req.query);
  var code = req.query.code;
  var currentUser;
  console.log(req.query.state);
  User.findOne({slackId: req.query.state})
  .then(function(user) {
    console.log(user);
    currentUser = user;
    return google.getToken(code)
  })
  .then((tokens) => {
    // dialogueflow.interpretUserMessage()
    currentUser.google.tokens = tokens;
    currentUser.google.isSetupComplete = true;
    return currentUser.save();
    //return google.createCalendarEvent(tokens, 'Test Event', '2017-10-25')
  })
  .then(function(){
    res.send('You are now authenticated with google')
  })
  .catch((error)=>console.log("Error: ", error))
})

app.post('/slack/interactive', function(req, res){
  console.log("In callback");
  var payload = JSON.parse(req.body.payload);
  console.log(payload, 52);
  User.findOne({slackId: payload.user.id})
  .then(function(user){
    if(payload.actions[0].value === 'true'){
      (user.pending.day ?
      google.createCalendarEvent(user.google.tokens, 'meeting with' + user.pending.invitee[0], user.pending.day, user.pending.time, user.pending.invitee, user.pending.duration) :
      google.createCalendarEvent(user.google.tokens, user.pending.subject, user.pending.date))
      .then(function(){
        user.pending = null;
        return user.save()
      })
      .then(()=>{
        res.send("Your reminder has been saved")
      })
     } else {
       user.pending = null;
       return user.save()
       .then(()=>res.send("Your reminder was canceled"))
     }
  })

 })

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express started. Listening on port %s', port);

module.exports = app;
