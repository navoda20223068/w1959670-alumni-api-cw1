'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../manual_controllers/public/index');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');

/**
 * @swagger
 * tags:
 *   name: Public API
 *   description: Public developer-facing endpoints protected by API keys and scopes
 */

/**
 * @swagger
 * /api/alumni-of-the-day:
 *   get:
 *     summary: Get today's featured alumnus
 *     description: Returns the alumnus selected as "Alumni of the Day". Requires a valid API key with the correct scope.
 *     tags: [Public API]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Featured alumnus returned successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               alumnus:
 *                 user_id: 1
 *                 first_name: "John"
 *                 last_name: "Doe"
 *                 biography: "Software Engineer at Google"
 *                 linkedin_url: "https://linkedin.com/in/johndoe"
 *                 profile_image_path: "/uploads/profile-123.jpg"
 *       401:
 *         description: Missing or invalid API key
 *       403:
 *         description: Insufficient scope, revoked key, expired key, or inactive client
 *       404:
 *         description: No featured alumnus for today
 *       500:
 *         description: Internal server error
 */
router.get(
    '/alumni-of-the-day',
    apiKeyMiddleware('featured:read'),
    publicController.getAlumniOfTheDay
);

module.exports = router;