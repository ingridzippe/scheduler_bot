var mongoose = require('mongoose');

// Step 0: Remember to add your MongoDB information in one of the following ways!
var connect = process.env.MONGODB_URI;
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

var User = mongoose.model('User', UserSchema);

module.exports = User;
