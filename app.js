var express = require('express');
var session = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes/routes');
var app = express();
var axios = require('axios')
var google = require('./google');
var dialogueflow = require('./dialogueflow');

var { User, Reminder, Meeting } = require('./models/models')

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
      if ( user.pending.day ){
        var meeting = user.pending;
        var startDateTime = new Date (meeting.day + 'T' + meeting.time);
        var endDateTime = new Date(startDateTime);
        var durHours = 0;
        var durMin = 30;
        if(meeting.duration){
          durHours = meeting.duration.unit === 'h'? meeting.duration.amount : 0;
          durMin = meeting.duration.unit === 'm'? meeting.duration.amount : 0;
        }
        endDateTime.setHours(endDateTime.getHours() + parseInt(durHours));
        endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(durMin));

        var summary = 'Meeting with ';
        meeting.invitee.forEach(function(person, index){
          if(index === meeting.invitee.length - 1 && meeting.invitee.length > 1){
            summary = summary + ` and ${person.name}`
          } else {
            summary = summary + ` ${person.name},`
          }
        })
        console.log(meeting.invitee, 77);
        var newMeeting = new Meeting({
            summary: summary,
            description: meeting.topic,
            times: {
              start: startDateTime,
              end: endDateTime,
              timeZone: 'America/Los_Angeles'
            },
            attendees: meeting.invitee,
            pending: true,
            duration: meeting.duration ? meeting.duration : {unit: 'm', amount: 30}
        })
        newMeeting.save()
        .then(()=>google.createMeeting(user.google.tokens, newMeeting))
        .then(function(){
          user.pending = null;
          return user.save()
        })
        .then(()=>{
          res.send("Your reminder has been saved")
        })
      } else {
        google.createCalendarEvent(user.google.tokens, user.pending.subject, user.pending.date)
        .then(function(){
          user.pending = null;
          return user.save()
        })
        .then(()=>{
          res.send("Your reminder has been saved")
        })
      }
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
