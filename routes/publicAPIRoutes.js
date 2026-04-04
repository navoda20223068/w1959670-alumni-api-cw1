'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../manual_controllers/public/index');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');

router.get(
    '/alumni-of-the-day',
    apiKeyMiddleware('featured:read'),
    publicController.getAlumniOfTheDay
);

module.exports = router;