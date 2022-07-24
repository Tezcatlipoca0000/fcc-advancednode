'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js'); // 12
const auth = require('./auth.js'); // 12
const app = express();
const http = require('http').createServer(app); // 16
const io = require('socket.io')(http); // 16
const passportSocketIo = require('passport.socketio'); // 19
const MongoStore = require('connect-mongo')(session); // 19
const cookieParser = require('cookie-parser'); // 19
const URI = process.env.MONGO_URI; // 19
const store = new MongoStore({url: URI}); // 19

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(session({
  key: 'express.sid', // 19
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store, // 19
  cookie: {secure: false}
}));
app.use(passport.initialize());
app.use(passport.session());

// 19
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

// 19
function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  auth(app, myDataBase); // 12
  routes(app, myDataBase); // 12

  // 17
  let currentUsers = 0;

  // 19
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  }));

  // 16
  io.on('connection', socket => {
    console.log('A user has connected');
    console.log(`user ${socket.request.user.name} connected`); // 19

    // 17
    ++currentUsers; 
    //io.emit('user count', currentUsers);

    // 20
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true,
    });

    // 18
    socket.on('disconnect', () => {
      console.log('user disconnected');
      --currentUsers;
      //io.emit('user count', currentUsers);
      // 20
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: false,
      });
    });

  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug/index', {title: e, message: 'Unable to login'});
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
