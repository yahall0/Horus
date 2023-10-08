require("dotenv").config
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require("../models/user")
const passport = require("passport")
require('https').globalAgent.options.rejectUnauthorized = false;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
},
  async function (request, accessToken, refreshToken, profile, done) {
    /*User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });*/
    const user = await User.find({googleID: profile.id})
    if(user.length === 0)
    {
      const newUser = new User({
        username: profile.displayName,
        googleID: profile.id,
        email: profile.emails[0].value,
        picture: profile._json.picture
      })
      console.log("New user")
      await newUser.save()
    }
    else{
      console.log("existing user")
    }
    return done(null, profile)
  }
));