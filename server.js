'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
//const pug = require('pug');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js'); // 12
const auth = require('./auth.js'); // 12

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

  auth(app, myDataBase); // 12
  routes(app, myDataBase); // 12

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug/index', {title: e, message: 'Unable to login'});
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
