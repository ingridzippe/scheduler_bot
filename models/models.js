import mongoose from 'mongoose';

// Step 0: Remember to add your MongoDB information in one of the following ways!
var connect = process.env.MONGODB_URI || require('./connect');
mongoose.connect(connect);

var Schema = mongoose.Schema

var UserSchema = new Schema({
    SlackID: String,
    Channel: String,
    Consent: String,
    Tokens: {
        access_token: String,
        refresh_token: String,
        refresh_token: String,
        expiry_date: String
    }
})

UserSchema.statics.findOrCreate = function(slackId){
    return User.findOne({slackId})
    .then(function(user)) {
        if (user){
            return user
        } else {
            return new User({ slackId}).save()
        }
    }
}

var User = mongoose.model('User', UserSchema);

export default {
    User: User
}