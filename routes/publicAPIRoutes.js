'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../manual_controllers/public/index');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const alumniController = require('../manual_controllers/public/alumniController');

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

/** @swagger
* /api/alumni:
    *   get:
    *     summary: Get alumni list with optional filters
*     description: Returns alumni profile, programme, graduation year, employment, industry sector, and location data. Requires an API key with the read:alumni scope.
*     tags: [Public API]
*     security:
*       - apiKeyAuth: []
*     parameters:
*       - in: query
*         name: programme
*         required: false
*         schema:
*           type: string
*         example: Computer
*         description: Filter alumni by degree or programme name.
*       - in: query
*         name: graduationYear
*         required: false
*         schema:
*           type: integer
*         example: 2022
*         description: Filter alumni by graduation year.
*       - in: query
*         name: industry
*         required: false
*         schema:
*           type: string
*         example: Technology
*         description: Filter alumni by current employment industry sector.
*     responses:
*       200:
*         description: Alumni list returned successfully
*         content:
*           application/json:
*             example:
    *               success: true
*               filters:
*                 programme: Computer
*                 graduationYear: 2022
*                 industry: Technology
*               alumni:
*                 - user_id: 10
*                   first_name: John
*                   last_name: Doe
*                   biography: Software Engineer
*                   linkedin_url: https://linkedin.com/john
    *                   profile_image_path: null
*                   programme: BSc Computer Science
*                   graduation_year: 2022
*                   company_name: Google
*                   job_title: Software Engineer
*                   industry_sector: Technology
*                   location: London
*       401:
*         description: Missing or invalid API key
*       403:
*         description: Insufficient scope, revoked key, expired key, or inactive client
*       500:
*         description: Internal server error
*/

router.get(
    '/alumni',
    apiKeyMiddleware('read:alumni'),
    alumniController.getAlumni
);

module.exports = router;