'use strict';

const express = require('express');
const router = express.Router();
const profileController = require('../manual_controllers/profile/index');

router.get('/me', profileController.getMyProfile);
router.post('/me', profileController.createMyProfile);
router.put('/me', profileController.updateMyProfile);
router.post('/degrees', profileController.addDegree);
router.get('/degrees', profileController.getDegrees);
router.put('/degrees/:id', profileController.updateDegree);
router.delete('/degrees/:id', profileController.deleteDegree);
module.exports = router;