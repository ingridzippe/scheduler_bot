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

function createSimpleEvent(client, tokens, title, date){
  console.log(title, 'line 23');
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

function createMeeting(client, tokens, title, date, time, attendees, duration, location){
  console.log(duration, 50);
  var startDateTime = new Date (date + 'T' + time);
  var endDateTime = new Date(startDateTime);
  var durHours = 0;
  var durMin = 30;
  if(duration){
    durHours = duration.unit === 'h'? duration.amount : 0;
    durMin = duration.unit === 'm'? duration.amount : 0;
  }
  endDateTime.setHours(endDateTime.getHours() + parseInt(durHours));
  endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(durMin));
  return new Promise(function(resolve, reject) {
      calendar.events.insert({
          auth: client,
          calendarId: 'primary',
          resource: {
              summary: title,
              start: {
                  dateTime: startDateTime,
                  'timeZone': 'America/Los_Angeles'
              },
              end: {
                  dateTime: endDateTime,
                  'timeZone': 'America/Los_Angeles'
              },
              'attendees': attendees
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

    createCalendarEvent(tokens, title, date, time, attendees, duration, location){
      console.log(title);
        var client = getAuthClient()
        client.setCredentials(tokens);
        if(attendees){
          return createMeeting(client, tokens, title, date, time, attendees, duration);
        } else {
          return createSimpleEvent(client, tokens, title, date);
        }
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
