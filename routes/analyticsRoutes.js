'use strict';

const express = require('express');
const router = express.Router();

const analyticsController = require('../manual_controllers/analytics/index');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics endpoints for dashboard charts and alumni trend analysis
 */

/**
 * @swagger
 * /analytics/industry-distribution:
 *   get:
 *     summary: Get alumni distribution by industry sector
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 */
router.get(
    '/industry-distribution',
    apiKeyMiddleware('read:analytics'),
    analyticsController.getIndustryDistribution
);

/**
 * @swagger
 * /analytics/top-employers:
 *   get:
 *     summary: Get top employers by alumni count
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Employer distribution returned successfully
 */
router.get('/top-employers', apiKeyMiddleware('read:analytics'), analyticsController.getTopEmployers);

/**
 * @swagger
 * /analytics/job-titles:
 *   get:
 *     summary: Get most common alumni job titles
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Job title distribution returned successfully
 */
router.get('/job-titles', apiKeyMiddleware('read:analytics'), analyticsController.getJobTitles);

/**
 * @swagger
 * /analytics/locations:
 *   get:
 *     summary: Get alumni geographic distribution
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Location distribution returned successfully
 */
router.get('/locations', apiKeyMiddleware('read:analytics'), analyticsController.getLocationDistribution);

/**
 * @swagger
 * /analytics/graduation-years:
 *   get:
 *     summary: Get alumni distribution by graduation year
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Graduation year distribution returned successfully
 */
router.get('/graduation-years', apiKeyMiddleware('read:analytics'), analyticsController.getGraduationYears);

/**
 * @swagger
 * /analytics/programmes:
 *   get:
 *     summary: Get alumni distribution by programme (degree)
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Programme distribution returned successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - programme: "BSc Computer Science"
 *                   count: 3
 *                 - programme: "BEng Civil Engineering"
 *                   count: 2
 */
router.get('/programmes', apiKeyMiddleware('read:analytics'), analyticsController.getProgrammeDistribution);

/**
 * @swagger
 * /analytics/certification-trends:
 *   get:
 *     summary: Get certification trends among alumni
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Certification trends returned successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - certification_name: "AWS Certified Developer"
 *                   count: 4
 *                 - certification_name: "Azure Fundamentals"
 *                   count: 2
 */
router.get('/certification-trends', apiKeyMiddleware('read:analytics'), analyticsController.getCertificationTrends);

/**
 * @swagger
 * /analytics/skills-gap:
 *   get:
 *     summary: Get overall skills distribution for skills gap analysis
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Skills gap data returned successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - skill: "Certifications"
 *                   count: 10
 *                 - skill: "Courses"
 *                   count: 8
 *                 - skill: "Licences"
 *                   count: 5
 *                 - skill: "Degrees"
 *                   count: 6
 */
router.get('/skills-gap', apiKeyMiddleware('read:analytics'), analyticsController.getSkillsGap);

module.exports = router;