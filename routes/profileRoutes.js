'use strict';

const express = require('express');
const router = express.Router();
const profileController = require('../manual_controllers/profile/index');
const upload = require('../middleware/uploadMiddleware');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Alumni profile management including personal details, education, certifications, licences, courses, employment history, and profile image upload
 *
 * components:
 *   schemas:
 *     ProfileRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         biography:
 *           type: string
 *           example: Software Engineer with 5 years of industry experience
 *         linkedinUrl:
 *           type: string
 *           example: https://linkedin.com/in/johndoe
 *
 *     DegreeRequest:
 *       type: object
 *       required:
 *         - degreeName
 *         - institutionName
 *       properties:
 *         degreeName:
 *           type: string
 *           example: BSc Computer Science
 *         institutionName:
 *           type: string
 *           example: University of Westminster
 *         officialUrl:
 *           type: string
 *           example: https://westminster.ac.uk/computer-science
 *         completionDate:
 *           type: string
 *           format: date
 *           example: 2023-06-01
 *
 *     CertificationRequest:
 *       type: object
 *       required:
 *         - certificationName
 *         - providerName
 *       properties:
 *         certificationName:
 *           type: string
 *           example: AWS Certified Developer
 *         providerName:
 *           type: string
 *           example: Amazon Web Services
 *         officialUrl:
 *           type: string
 *           example: https://aws.amazon.com/certification/
 *         completionDate:
 *           type: string
 *           format: date
 *           example: 2024-01-15
 *
 *     LicenceRequest:
 *       type: object
 *       required:
 *         - licenceName
 *         - awardingBody
 *       properties:
 *         licenceName:
 *           type: string
 *           example: Professional Engineering Licence
 *         awardingBody:
 *           type: string
 *           example: Engineering Council
 *         officialUrl:
 *           type: string
 *           example: https://example.org/licence
 *         completionDate:
 *           type: string
 *           format: date
 *           example: 2024-03-10
 *
 *     CourseRequest:
 *       type: object
 *       required:
 *         - courseName
 *         - providerName
 *       properties:
 *         courseName:
 *           type: string
 *           example: Advanced Project Management
 *         providerName:
 *           type: string
 *           example: Coursera
 *         officialUrl:
 *           type: string
 *           example: https://coursera.org/example-course
 *         completionDate:
 *           type: string
 *           format: date
 *           example: 2024-02-20
 *
 *     EmploymentRequest:
 *       type: object
 *       required:
 *         - companyName
 *         - jobTitle
 *       properties:
 *         companyName:
 *           type: string
 *           example: TNE Civil
 *         jobTitle:
 *           type: string
 *           example: Project Engineer
 *         startDate:
 *           type: string
 *           format: date
 *           example: 2022-01-10
 *         endDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: 2024-05-30
 *         isCurrent:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/me', authJwtMiddleware, profileController.getMyProfile);

/**
 * @swagger
 * /profile/me:
 *   post:
 *     summary: Create the current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileRequest'
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Profile already exists
 *       500:
 *         description: Internal server error
 */
router.post('/me', authJwtMiddleware, profileController.createMyProfile);

/**
 * @swagger
 * /profile/me:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.put('/me', authJwtMiddleware, profileController.updateMyProfile);

/**
 * @swagger
 * /profile/degrees:
 *   post:
 *     summary: Add a degree
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DegreeRequest'
 *     responses:
 *       201:
 *         description: Degree added successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/degrees', authJwtMiddleware, profileController.addDegree);

/**
 * @swagger
 * /profile/degrees:
 *   get:
 *     summary: Get all degrees for the current user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Degrees returned successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/degrees', authJwtMiddleware, profileController.getDegrees);

/**
 * @swagger
 * /profile/degrees/{id}:
 *   put:
 *     summary: Update a degree
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DegreeRequest'
 *     responses:
 *       200:
 *         description: Degree updated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/degrees/:id', authJwtMiddleware, profileController.updateDegree);

/**
 * @swagger
 * /profile/degrees/{id}:
 *   delete:
 *     summary: Delete a degree
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Degree deleted successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.delete('/degrees/:id', authJwtMiddleware, profileController.deleteDegree);

/**
 * @swagger
 * /profile/certifications:
 *   post:
 *     summary: Add a certification
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CertificationRequest'
 *     responses:
 *       201:
 *         description: Certification added successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/certifications', authJwtMiddleware, profileController.addCertification);

/**
 * @swagger
 * /profile/certifications:
 *   get:
 *     summary: Get all certifications for the current user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certifications returned successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/certifications', authJwtMiddleware, profileController.getCertifications);

/**
 * @swagger
 * /profile/certifications/{id}:
 *   put:
 *     summary: Update a certification
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CertificationRequest'
 *     responses:
 *       200:
 *         description: Certification updated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/certifications/:id', authJwtMiddleware, profileController.updateCertification);

/**
 * @swagger
 * /profile/certifications/{id}:
 *   delete:
 *     summary: Delete a certification
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Certification deleted successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.delete('/certifications/:id', authJwtMiddleware, profileController.deleteCertification);

/**
 * @swagger
 * /profile/licences:
 *   post:
 *     summary: Add a licence
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LicenceRequest'
 *     responses:
 *       201:
 *         description: Licence added successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/licences', authJwtMiddleware, profileController.addLicence);

/**
 * @swagger
 * /profile/licences:
 *   get:
 *     summary: Get all licences for the current user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Licences returned successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/licences', authJwtMiddleware, profileController.getLicences);

/**
 * @swagger
 * /profile/licences/{id}:
 *   put:
 *     summary: Update a licence
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LicenceRequest'
 *     responses:
 *       200:
 *         description: Licence updated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/licences/:id', authJwtMiddleware, profileController.updateLicence);

/**
 * @swagger
 * /profile/licences/{id}:
 *   delete:
 *     summary: Delete a licence
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Licence deleted successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.delete('/licences/:id', authJwtMiddleware, profileController.deleteLicence);

/**
 * @swagger
 * /profile/courses:
 *   post:
 *     summary: Add a professional course
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseRequest'
 *     responses:
 *       201:
 *         description: Course added successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/courses', authJwtMiddleware, profileController.addCourse);

/**
 * @swagger
 * /profile/courses:
 *   get:
 *     summary: Get all professional courses for the current user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses returned successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/courses', authJwtMiddleware, profileController.getCourses);

/**
 * @swagger
 * /profile/courses/{id}:
 *   put:
 *     summary: Update a professional course
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseRequest'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/courses/:id', authJwtMiddleware, profileController.updateCourse);

/**
 * @swagger
 * /profile/courses/{id}:
 *   delete:
 *     summary: Delete a professional course
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.delete('/courses/:id', authJwtMiddleware, profileController.deleteCourse);

/**
 * @swagger
 * /profile/employment:
 *   post:
 *     summary: Add employment history
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmploymentRequest'
 *     responses:
 *       201:
 *         description: Employment history added successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/employment', authJwtMiddleware, profileController.addEmployment);

/**
 * @swagger
 * /profile/employment:
 *   get:
 *     summary: Get all employment history records for the current user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employment history returned successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/employment', authJwtMiddleware, profileController.getEmployment);

/**
 * @swagger
 * /profile/employment/{id}:
 *   put:
 *     summary: Update employment history
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmploymentRequest'
 *     responses:
 *       200:
 *         description: Employment history updated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/employment/:id', authJwtMiddleware, profileController.updateEmployment);

/**
 * @swagger
 * /profile/employment/{id}:
 *   delete:
 *     summary: Delete employment history
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Employment history deleted successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.delete('/employment/:id', authJwtMiddleware, profileController.deleteEmployment);

/**
 * @swagger
 * /profile/upload-image:
 *   post:
 *     summary: Upload a profile image
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No image uploaded
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.post('/upload-image', authJwtMiddleware, upload.single('profileImage'), profileController.uploadProfileImage);

module.exports = router;