var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
// Step 0: Remember to add your MongoDB information in one of the following ways!
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);

var Schema = mongoose.Schema

var UserSchema = new mongoose.Schema({
    slackId: {
      type: String,
      required: true
    },
    google: {
      tokens: Object,
      isSetupComplete: Boolean,
      default: false
    },
    pending: Object
    // Channel: String,
    // Consent: String,
    // Tokens: {
    //     access_token: String,
    //     refresh_token: String,
    //     refresh_token: String,
    //     expiry_date: String
    // }
})

var ReminderSchema = new mongoose.Schema({
    subject: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: false
    },
    userId: {
      type: String,
      required: true
    }
})

UserSchema.statics.findOrCreate = function(slackId) {
  return User.findOne({slackId})
  .then(function(user){
    if(user) return user; //You have to return this, otherwise you would not me able to call .then()
    else return new User({slackId}).save()
  })
}
var User = mongoose.model('User', UserSchema);
var Reminder = mongoose.model('Reminder', ReminderSchema);

module.exports = {
  User,
  Reminder
};
