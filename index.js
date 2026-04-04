'use strict';

require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const path = require('node:path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { startBiddingScheduler } = require('./scheduler/biddingScheduler');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const biddingRoutes = require('./routes/biddingRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const publicApiRoutes = require('./routes/publicApiRoutes');

const app = module.exports = express();
const PORT = process.env.PORT || 3000;

/* -------------------- APP SETTINGS -------------------- */

app.set('trust proxy', 1);

/* -------------------- SECURITY MIDDLEWARE -------------------- */

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const biddingWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

/* -------------------- SWAGGER SETUP -------------------- */

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alumni Influencer Platform API',
      version: '1.0.0',
      description:
          'Coursework API for alumni registration, profile management, blind bidding, developer API keys, and public featured alumni access.'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
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

/* -------------------- BASIC MIDDLEWARE -------------------- */

if (!module.parent) {
  app.use(logger('dev'));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* -------------------- ROUTE RATE LIMITERS -------------------- */

app.use('/api', publicApiLimiter);
app.use('/auth', authLimiter);

/* -------------------- ROUTES -------------------- */

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/bidding', biddingWriteLimiter, biddingRoutes);
app.use('/developer', apiKeyRoutes);
app.use('/api', publicApiRoutes);

/* -------------------- ERROR HANDLING -------------------- */

app.use(function (req, res) {
  return res.status(404).json({
    error: 'Not found',
    url: req.originalUrl
  });
});

app.use(function (err, req, res, next) {
  if (!module.parent) {
    console.error(err.stack);
  }

  return res.status(500).json({
    error: 'Internal server error'
  });
});

/* -------------------- STARTUP -------------------- */

if (process.env.RUN_SCHEDULER === 'true') {
  startBiddingScheduler();
}

if (!module.parent) {
  app.listen(PORT, () => {
    console.log(`Express started on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    console.log(`Scheduler enabled: ${process.env.RUN_SCHEDULER === 'true'}`);
  });
}