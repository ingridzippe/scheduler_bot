var express = require('express');
var session = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes/routes');
var app = express();
var axios = require('axios')
var google = require('./google');
var dialogueflow = require('./dialogueflow');

var User = require('./models/models')

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
  google.getToken(code)
  .then((response) => {
    // dialogueflow.interpretUserMessage()
    console.log(req);
    // User.findOne({slackId: req.})
    res.send("WE MADE IT!")
  })
  .catch((error)=>console.log("Error: ", error))

  // google.getToken()
})

app.post('/slack/interactive', function(req, res){
  var parsedPayload = JSON.parse(req.body.payload);
  console.log("\n*********************************\n", parsedPayload, "\n");
  res.send("Your reminder was confirmed :)")
})

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express started. Listening on port %s', port);

module.exports = app;
