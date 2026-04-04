'use strict';

require('dotenv').config();

/**
 * Module dependencies.
 */

const express = require('express');
const logger = require('morgan');
const path = require('node:path');
const session = require('express-session');
const methodOverride = require('method-override');

// 🔐 Security
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 📘 Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { startBiddingScheduler } = require('./scheduler/biddingScheduler');

const app = module.exports = express();

/* -------------------- SECURITY MIDDLEWARE -------------------- */

// Helmet (security headers)
app.use(helmet());

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (only public API)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', apiLimiter);

/* -------------------- SWAGGER SETUP -------------------- */

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alumni Influencer Platform API',
      version: '1.0.0',
      description: 'Coursework API for alumni registration, profile management, blind bidding, developer API keys, and public featured alumni access.'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Internal server error'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* -------------------- BASIC MIDDLEWARE -------------------- */

// log
if (!module.parent) app.use(logger('dev'));

// static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// session (⚠️ keep only if still needed anywhere)
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'some secret here'
}));

// body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// method override
app.use(methodOverride('_method'));

// flash messages (legacy)
app.use(function(req, res, next){
  const msgs = (req.session && req.session.messages) ? req.session.messages : [];

  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;

  next();

  if (req.session) {
    req.session.messages = [];
  }
});

/* -------------------- ROUTES -------------------- */

// auth
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// profile
const profileRoutes = require('./routes/profileRoutes');
app.use('/profile', profileRoutes);

// bidding
const biddingRoutes = require('./routes/biddingRoutes');
app.use('/bidding', biddingRoutes);

// developer API
const apiKeyRoutes = require('./routes/apiKeyRoutes');
app.use('/developer', apiKeyRoutes);

// public API
const publicApiRoutes = require('./routes/publicApiRoutes');
app.use('/api', publicApiRoutes);

/* -------------------- ERROR HANDLING -------------------- */

// 404
app.use(function(req, res, next){
  res.status(404).json({ error: 'Not found', url: req.originalUrl });
});

// 500
app.use(function(err, req, res, next){
  if (!module.parent) console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

/* -------------------- STARTUP -------------------- */

startBiddingScheduler();

if (!module.parent) {
  console.log('DB_NAME:', process.env.DB_NAME);
  app.listen(process.env.PORT || 3000);
  console.log(`Express started on port ${process.env.PORT || 3000}`);
}