'use strict'

var google2= require('googleapis');
var calendar = google2.calendar('v3');
var OAuth2 = google2.auth.OAuth2;
var {User, Reminder} = require('./models/models')

var scope = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar'
  ];


function getAuthClient(){
    return new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_SECRET,
        `${process.env.DOMAIN}/google/callback`
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
      },

      recheckExpiration(originalUser, expToken) {
        var today = new Date().valueOf()
        var tokens = originalUser.google.tokens;
        if (today > expToken){
        var authClient = getAuthClient()
        authClient.setCredentials({
                access_token: originalUser.google.tokens.access_token,
                refresh_token: originalUser.google.tokens.refresh_token,
                expiry_date: (new Date()).getTime() + (1000 * 60 * 60 * 24 * 7)
              })
        authClient.refreshAccessToken(function(err, tokens){
            console.log(tokens)
            if (err){
                console.log('there was an error: ', err)
            }
            User.update({slackId: originalUser.slackId}, {
                google: {
                    tokens: tokens
            }}).exec(function(err, raw){
                if (err){
                    console.log(`there was an error`)
                } else {
                    return console.log('Your user has been saved with the new tokens')
                }
              }
            )
          })
        }
      }
}
