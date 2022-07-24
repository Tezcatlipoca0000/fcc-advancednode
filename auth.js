require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt'); // 11
const GitHubStrategy = require('passport-github').Strategy; //14

module.exports = function (app, myDataBase) {

	passport.use(new LocalStrategy(
    	function(username, password, done) {
      	myDataBase.findOne({username: username}, function(err, user){
        	console.log('User ' + username + ' attempted to log in.');
        	if (err) { return done(err); }
        	if (!user) { return done(null, false); }
        	if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
        	return done(null, user);
      	});
    	}
  	));

  	passport.serializeUser((user, done) => {
    	done(null, user._id);
  	});

  	passport.deserializeUser((id, done) => {
    	myDataBase.findOne({_id: new ObjectID(id)}, (err, doc) => { //mydb.findOne
      	done(null, doc);
    	});
  	});

  	// 14
  	passport.use(new GitHubStrategy({
  			clientID: process.env.GITHUB_CLIENT_ID,
  			clientSecret: process.env.GITHUB_CLIENT_SECRET,
  			callbackURL: 'http://localhost:8080/auth/github/callback'
  		}, 
  		function(accessToken, refreshToken, profile, cb) {
  			console.log(profile);
  			myDataBase.findOneAndUpdate(
  				{ id: profile.id },
  				{ 
  					$setOnInsert: {
  						id: profile.id,
  						name: profile.displayName || 'Jhon Doe',
  						photo: profile.photos[0].value || '',
  						email: Array.isArray(profile.emails) 
  							? profile.emails[0].value
  							: 'No public email',
  						created_on: new Date(),
  						provider: profile.provider || ''  
  					}, 
  					$set: {
  						last_login: new Date()
  					},
  					$inc: {
  						login_count: 1
  					},
  				},
  				{ upsert: true, new: true },
  				(err, doc) => {
  					return cb(null, doc.value);
  				}
  			);
  		} 
  	));
}