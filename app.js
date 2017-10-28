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
    if(payload.actions[0].value !== 'false'){
      if(payload.actions[0].value[0]){
        console.log("In conditional");
        var attendees = JSON.parse(payload.actions[0].value);

        async function createCalendarArray(){
          var calendars = []
          for(var attendee of attendees){
            calendars.push(await google.getCalendars(user.google.tokens, attendee))
          }
          return calendars;
        }
        createCalendarArray()
        .then((calendars)=>{
          console.log(calendars[0], "LINE 68");
          user.pending = null;
          return user.save()})
          .then(()=>{
            res.send('Success')
          })
      }
    //   if ( user.pending.day ){
    //     var meeting = user.pending;
    //     var startDateTime = new Date (meeting.day + 'T' + meeting.time);
    //     var endDateTime = new Date(startDateTime);
    //     var durHours = 0;
    //     var durMin = 30;
    //     if(meeting.duration){
    //       durHours = meeting.duration.unit === 'h'? meeting.duration.amount : 0;
    //       durMin = meeting.duration.unit === 'm'? meeting.duration.amount : 0;
    //     }
    //     endDateTime.setHours(endDateTime.getHours() + parseInt(durHours));
    //     endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(durMin));
    //
    //     var summary = 'Meeting with ';
    //     meeting.invitee.forEach(function(person, index){
    //       if(index === meeting.invitee.length - 1 && meeting.invitee.length > 1){
    //         summary = summary + ` and ${person.name}`
    //       } else {
    //         summary = summary + ` ${person.name},`
    //       }
    //     })
    //     console.log(meeting.invitee, 77);
    //     var newMeeting = new Meeting({
    //         summary: summary,
    //         description: meeting.topic,
    //         times: {
    //           start: startDateTime,
    //           end: endDateTime,
    //           timeZone: 'America/Los_Angeles'
    //         },
    //         attendees: meeting.invitee,
    //         pending: true,
    //         duration: meeting.duration ? meeting.duration : {unit: 'm', amount: 30}
    //     })
    //     newMeeting.save()
    //     .then(()=>google.createMeeting(user.google.tokens, newMeeting))
    //     .then(function(){
    //       user.pending = null;
    //       return user.save()
    //     })
    //     .then(()=>{
    //       res.send("Your reminder has been saved")
    //     })
    //   } else {
    //     google.createCalendarEvent(user.google.tokens, user.pending.subject, user.pending.date)
    //     .then(function(){
    //       user.pending = null;
    //       return user.save()
    //     })
    //     .then(()=>{
    //       res.send("Your reminder has been saved")
    //     })
    //   }
    //  } else {
    //    user.pending = null;
    //    return user.save()
    //    .then(()=>res.send("Your reminder was canceled"))
      } else {
         user.pending = null;
         return user.save()
         .then(()=>res.send("Your reminder was canceled"))
      }
    })

 })


 function conflictManager(calendars, duration){

   var dur = duration.unit === 'h' ? decision.amount * 60 * 60 * 1000 : decision.amount * 60 * 1000;

    var window = {start: 9, end: 17}
    var dates = datesArr

    function compare(array){
        return array.sort(function(a,b){
            return a[0]-b[0]
        })
    }

    function gaps(array){
        var test = array.slice();
        for (var k = 0; k < test.length; k++){
            if (test[k].end >= test[k+1].start){
                test[k].end = test[k+1].end;
                test.splice(k+1, 1);
                k--;
            }
        }
        return test;
    }

    function getMorning(date){
      var morning = date;
      morning.setHours(window.start);
      morning.setMinutes(0);
      return morning;
    }

    function getTodayEnd(date){
      var evening = date;
      evening.setHours(window.end);
      evening.setMinutes(0);
      return evening;
    }

    function free(array){
        var freeTimes = [];
        for (var i = 0; i < array.length; i++){
            freeTimes.push({start: array[i].end, end: arr[i+1].start})
        }

        meetingTimes = []

        for(var j = 0; (j < freeTimes.length) && (meetingTimes.length < 10); j++){
            if(freeTimes[j].start - getMorning(freeTimes[j].start) > dur){
              meetingTimes.push({start: getMorning(freeTimes[j].start), end:freeTimes[j].start})
            }
            var daysElapsed = parseInt((((freeTimes[j].end - freeTimes[j].start) / 60 * 60 * 1000)-16)/24)
            for(var k = 0; k<daysElapsed; k++){
              var dayMorning = getMorning(freeTimes[j].start);
              dayMorning.setDate(dayMorning.getDate() + k + 1);
              var dayEvening = getEvening(freeTimes[j].start);
              dayEvening.setDate(dayEvening.getDate() + k + 1);
              meetingTimes.push({start:freeTimes[j].start, end:getEvening(freeTimes[j].end)})
            }
            if(freeTimes[j].end - getEvening(freeTimes[j].end) > dur){
              meetingTimes.push({start:freeTimes[j].start, end:getEvening(freeTimes[j].end)})
            }


        }
        return freeTimes;


    }

    //sort by date
    var eventArr = [];

    calendars.forEach( function(calendar){
      for (var i = 0; i < calendar.length; i++){
          var event = {start: new Date(calendar[i].start.dateTime), end: new Date(calendar[i].end.dateTime)}
          eventArr.push(event)
      }
    })

    // debugger;

    eventArr = eventArr.filter((x)=>{
      return x.end.getHours() > window.start && x.start.getHours() < window.end
    })

    eventArr = eventArr.sort(function(a, b){
      return a.start - b.start;
    })

    var freeTime = {};
    var freeTimes = [];

    Object.keys(nonConflicts).forEach(function(x){
        nonConflicts[x].forEach(function(y){
            freeTimes.push(`${y} works on ${x}`)
        })
    })

    console.log(freeTimes)
    console.log(freeTimes.slice(0, 10))
}

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express started. Listening on port %s', port);

module.exports = app;
