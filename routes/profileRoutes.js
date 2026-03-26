'use strict';

const express = require('express');
const router = express.Router();
const profileController = require('../manual_controllers/profile/index');
const upload = require('../middleware/uploadMiddleware');

router.get('/me', profileController.getMyProfile);
router.post('/me', profileController.createMyProfile);
router.put('/me', profileController.updateMyProfile);

router.post('/degrees', profileController.addDegree);
router.get('/degrees', profileController.getDegrees);
router.put('/degrees/:id', profileController.updateDegree);
router.delete('/degrees/:id', profileController.deleteDegree);

router.post('/certifications', profileController.addCertification);
router.get('/certifications', profileController.getCertifications);
router.put('/certifications/:id', profileController.updateCertification);
router.delete('/certifications/:id', profileController.deleteCertification);

router.post('/licences', profileController.addLicence);
router.get('/licences', profileController.getLicences);
router.put('/licences/:id', profileController.updateLicence);
router.delete('/licences/:id', profileController.deleteLicence);

router.post('/courses', profileController.addCourse);
router.get('/courses', profileController.getCourses);
router.put('/courses/:id', profileController.updateCourse);
router.delete('/courses/:id', profileController.deleteCourse);

router.post('/employment', profileController.addEmployment);
router.get('/employment', profileController.getEmployment);
router.put('/employment/:id', profileController.updateEmployment);
router.delete('/employment/:id', profileController.deleteEmployment);

router.post('/upload-image', upload.single('profileImage'), profileController.uploadProfileImage);

module.exports = router;