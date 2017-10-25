'use strict'

var google = require('googleapis');
var calendar = google.calendar('v3');
var OAuth2 = google.auth.OAuth2;

var scope = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar'
  ];


function getAuthClient(){
    return new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_SECRET,
        'http://98bfa26b.ngrok.io/google/callback'
      );
}

module.exports = {
    generateAuthUrl(slackId) {
        return getAuthClient().generateAuthUrl({
          access_type: 'offline',
          prompt: 'consent',
          scope,
          state: slackId
          })
        },


    getToken(code) {
    var client = getAuthClient();
    return new Promise(function(resolve, reject) {
      client.getToken(code, function (err, tokens) {
        if (err)  {
          reject(err);
        } else {
          resolve(tokens);
        }
      });
    });
  },

    createCalendarEvent(tokens, title, date){
        var client = getAuthClient()
        client.setCredentials(tokens);
        return new Promise(function(resolve, reject) {
            calendar.events.insert({
                auth: client,
                calendarId: 'primary',
                resource: {
                    summary: title,
                    start: {
                        date,
                        'timeZone': 'America/Los_Angeles'
                    },
                    end: {
                        date,
                        'timeZone': 'America/Los_Angeles'
                    }
                }
            }, function(err, res){
                if (err){
                    reject(err)
                } else {
                    resolve(tokens)
                }
            });
        });
}
}
