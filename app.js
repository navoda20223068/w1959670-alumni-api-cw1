'use strict';

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { startBiddingScheduler } = require('./scheduler/biddingScheduler');
const { verifyEmailTransport } = require('./services/emailService');

// Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const biddingRoutes = require('./routes/biddingRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const publicApiRoutes = require('./routes/publicApiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const pageRoutes = require('./routes/pageRoutes');
const app = express();
module.exports = app;

const PORT = Number(process.env.PORT || 3000);
const IS_DIRECT_RUN = !module.parent;

/* =========================================================
   APP CONFIGURATION
========================================================= */

// Required for correct IP handling behind Nginx
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* =========================================================
   SECURITY MIDDLEWARE
========================================================= */

app.use(
    helmet({
      contentSecurityPolicy: false
    })
);

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* =========================================================
   LOGGING
========================================================= */

if (IS_DIRECT_RUN) {
  app.use(morgan('dev'));
}

/* =========================================================
   RATE LIMITING
========================================================= */

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

const biddingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

/* =========================================================
   SWAGGER CONFIG
========================================================= */

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alumni Influencer Platform API',
      version: '1.0.0',
      description: 'Backend API for Alumni Influencer Platform'
    },
    servers: [
      {
        url: process.env.APP_BASE_URL || `http://localhost:${PORT}`
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
      }
    }
  },
  apis: ['./routes/*.js']
});

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   STATIC FILES
========================================================= */

// Important for load-balanced setup
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================================================
   HEALTH CHECK (for Load Balancer)
========================================================= */

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    instance: {
      port: PORT,
      pid: process.pid
    },
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   DEBUG ENDPOINT (for testing load balancing)
========================================================= */

app.get('/instance', (req, res) => {
  res.json({
    port: PORT,
    pid: process.pid
  });
});

/* =========================================================
   SWAGGER ROUTE
========================================================= */

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* =========================================================
   RATE-LIMITED ROUTES
========================================================= */

app.use('/api', publicApiLimiter);
app.use('/auth', authLimiter);
app.use('/bidding', biddingLimiter);

/* =========================================================
   APPLICATION ROUTES
========================================================= */

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/bidding', biddingRoutes);
app.use('/developer', apiKeyRoutes);
app.use('/api', publicApiRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/', pageRoutes);
/* =========================================================
   ERROR HANDLING
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: 'Internal server error'
  });
});

/* =========================================================
   APPLICATION BOOTSTRAP
========================================================= */

async function bootstrap() {
  try {
    // Verify email service
    // await verifyEmailTransport();
    // console.log('Email service ready');

    // Scheduler control (IMPORTANT for load balancing)
    if (process.env.ENABLE_SCHEDULER === 'true') {
      startBiddingScheduler();
      console.log('Scheduler ENABLED');
    } else {
      console.log('Scheduler DISABLED');
    }

    // Start server only if not imported
    if (IS_DIRECT_RUN) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
      });
    }

  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

if (IS_DIRECT_RUN) {
  bootstrap();
}