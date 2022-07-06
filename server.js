'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
//const pug = require('pug');
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false}
}));
app.use(passport.initialize());
app.use(passport.session());

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({username: username}, function(err, user){
        console.log('User ' + username + ' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug/index', { title: 'Connected to Database', message: 'Please Login', showLogin: true, showRegistration: true });
  });

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    mydb.findOne({_id: new ObjectID(id)}, (err, doc) => {
      done(null, doc);
    });
  });

  // 6
  app.route('/login')
  .post(passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
    res.redirect('/profile');
  });

  // 7
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  };

  // 6 & 7 & 8
  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render(__dirname + '/views/pug/profile', {username: req.user.username});
      // the user object is saved in req.user
    });

  // 9
  app.route('/logout')
    .get((req, res, next) => {
      req.logout(function(err) {
        if (err) { return next(err); } 
        res.redirect('/');
      });
    });

  // 10
  app.route('/register')
    .post((req, res,next) => {
      myDataBase.findOne({username:req.body.username}, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          myDataBase.insertOne({ 
            username: req.body.username, password: req.body.password  
          }, (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          });
        }
      });
    }, 
      passport.authenticate('local', {failureRedirect: '/'}), 
      (req, res, next) => {
        res.redirect('/profile');
      }
    );

  // 9
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug/index', {title: e, message: 'Unable to login'});
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
