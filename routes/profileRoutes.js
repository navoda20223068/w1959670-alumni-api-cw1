'use strict';

const express = require('express');
const router = express.Router();
const profileController = require('../manual_controllers/profile/index');
const upload = require('../middleware/uploadMiddleware');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

router.get('/me', authJwtMiddleware, profileController.getMyProfile);
router.post('/me', authJwtMiddleware, profileController.createMyProfile);
router.put('/me', authJwtMiddleware, profileController.updateMyProfile);

router.post('/degrees', authJwtMiddleware, profileController.addDegree);
router.get('/degrees', authJwtMiddleware, profileController.getDegrees);
router.put('/degrees/:id', authJwtMiddleware, profileController.updateDegree);
router.delete('/degrees/:id', authJwtMiddleware, profileController.deleteDegree);

router.post('/certifications', authJwtMiddleware, profileController.addCertification);
router.get('/certifications', authJwtMiddleware, profileController.getCertifications);
router.put('/certifications/:id', authJwtMiddleware, profileController.updateCertification);
router.delete('/certifications/:id', authJwtMiddleware, profileController.deleteCertification);

router.post('/licences', authJwtMiddleware, profileController.addLicence);
router.get('/licences', authJwtMiddleware, profileController.getLicences);
router.put('/licences/:id', authJwtMiddleware, profileController.updateLicence);
router.delete('/licences/:id', authJwtMiddleware, profileController.deleteLicence);

router.post('/courses', authJwtMiddleware, profileController.addCourse);
router.get('/courses', authJwtMiddleware, profileController.getCourses);
router.put('/courses/:id', authJwtMiddleware, profileController.updateCourse);
router.delete('/courses/:id', authJwtMiddleware, profileController.deleteCourse);

router.post('/employment', authJwtMiddleware, profileController.addEmployment);
router.get('/employment', authJwtMiddleware, profileController.getEmployment);
router.put('/employment/:id', authJwtMiddleware, profileController.updateEmployment);
router.delete('/employment/:id', authJwtMiddleware, profileController.deleteEmployment);

router.post('/upload-image', authJwtMiddleware, upload.single('profileImage'), profileController.uploadProfileImage);

module.exports = router;