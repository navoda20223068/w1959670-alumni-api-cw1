'use strict';

require('dotenv').config();

/**
 * Module dependencies.
 */

var express = require('express');
var logger = require('morgan');
var path = require('node:path');
var session = require('express-session');
var methodOverride = require('method-override');

var app = module.exports = express();

// define a custom res.message() method
// which stores messages in the session
app.response.message = function(msg){
  var sess = this.req.session;
  sess.messages = sess.messages || [];
  sess.messages.push(msg);
  return this;
};

// log
if (!module.parent) app.use(logger('dev'));

// serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// session support
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'some secret here'
}));

// parse request bodies (req.body)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// allow overriding methods in query (?_method=put)
app.use(methodOverride('_method'));

// expose the "messages" local variable when views are rendered
app.use(function(req, res, next){
  var msgs = (req.session && req.session.messages) ? req.session.messages : [];

  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;

  next();

  if (req.session) {
    req.session.messages = [];
  }
});

// load controllers
require('./lib/boot')(app, { verbose: !module.parent });

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'some secret here'
}));

// manual auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/profile', profileRoutes);

const biddingRoutes = require('./routes/biddingRoutes');
app.use('/bidding', biddingRoutes);

app.use(function(err, req, res, next){
  if (!module.parent) console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// assume 404 since no middleware responded
app.use(function(req, res, next){
  res.status(404).json({ error: 'Not found', url: req.originalUrl });
});

/* istanbul ignore next */
if (!module.parent) {
  console.log('DB_NAME:', process.env.DB_NAME); //log to check the .env file being read
  app.listen(process.env.PORT || 3000);
  console.log(`Express started on port ${process.env.PORT || 3000}`);
}