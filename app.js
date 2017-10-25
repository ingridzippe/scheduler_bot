var express = require('express');
var session = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes/routes');
var app = express();
var axios = require('axios')

require('./bot')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);

app.get('/setup', function (req, res){
  var url = google.generateAuthUrl(req.query.slackId);
  res.redirect(url)
})

app.get('/google/callback', function(req, res){
  var user;
  var tokens;
  User.findOne({ slackId: req.query.state})
  .then(function(u){
    user = u;
    google.getToken(req.body.code);
  })
  .then(function(t){
    tokens = t;
    user.google.tokens = tokens;
    user.google.isSetupComplete = true;
    return user.save()
    // return google.createCalendarEvent(tokens, 'Test Event', '2017-10-29');
  })
  .then(function(){
    res.send('You are now authenticated with google. Thanks');
  })
  .catch(function(err){
    console.log('Error retrieving token', err)
    res.status(500).send('Sorry that did not work')
  })
})

/**
 * Example for creating and working with the Slack RTM API.
 */

/* eslint no-console:0 */


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// // production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express started. Listening on port %s', port);

module.exports = app;
