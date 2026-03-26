'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../manual_controllers/auth/index');

router.post('/register', authController.register);
router.get('/verify/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/check', authController.checkAuth);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;