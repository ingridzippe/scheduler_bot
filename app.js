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
  var code = req.query.code;
  var currentUser;
  // console.log(req.query.state);
  User.findOne({slackId: req.query.state})
  .then(function(user) {
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

  if(payload.actions[0].value === 'true'){
    User.findOne({slackId: payload.user.id})
    .then(function(user){
      return google.createCalendarEvent(user.google.tokens, user.pending.subject, user.pending.date);
    })
    .then(function(){
      res.send("Your reminder was confirmed :)")
    })

  } else {
    res.send("Your reminder was canceled")
  }




         //from Ingrid

         var d = new Date(user.pending.date);
         console.log('d', d);
         var dateFormatted = [d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear()].join('-');
         console.log('dateFormatted', dateFormatted)
         var reminder = new Reminder({
           subject: message.text,
           date: dateFormatted,
           userId: message.user
         })
         console.log('REMINDER', reminder)
         reminder.save(function(err, reminder) {
           if (err) { console.log('error') }
         })
         .then(function(){
           res.send("Your reminder was confirmed :)")
         })
         // console.log('req.body.payload', req.body.payload);
         var today = new Date();
         console.log('today', today);
         var todayFormatted = [today.getUTCDate(), today.getUTCMonth() + 1, today.getUTCFullYear()].join('-');
         console.log('todayFormatted', todayFormatted);
         var tomMillis = today.setDate(today.getDate() + 1);
         console.log('tomMillis', tomMillis)
         var tomorrow = new Date(tomMillis);
         console.log('tomorrow', tomorrow);
         var tomorrowFormatted = [tomorrow.getUTCDate(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCFullYear()].join('-');
         // reminders for today
         Reminder.find({date: tomorrowFormatted}, function(err, remindersTomorrow) {
           console.log('REMINDERS TOMORROW', remindersTomorrow);
         })
         // reminders for today
         Reminder.find({date: todayFormatted}, function(err, remindersToday) {
           console.log('REMINDERS TODAY', remindersToday);
         })

var port = process.env.PORT || 80;
app.listen(port);
console.log('Express started. Listening on port %s', port);

module.exports = app;
