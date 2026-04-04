'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../manual_controllers/auth/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Alumni registration, email verification, login, logout, authentication checks, and password reset
 *
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: student@iit.ac.lk
 *         password:
 *           type: string
 *           example: StrongPass123!
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: student@westminster.ac.uk
 *         password:
 *           type: string
 *           example: StrongPass123!
 *
 *     RequestResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           example: student@iit.ac.lk
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           example: 7b4c2d1f9a8e6c5b4d3a2f1e0c9b8a7d
 *         newPassword:
 *           type: string
 *           example: NewStrongPass123!
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new alumnus account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/verify/{token}:
 *   get:
 *     summary: Verify a user's email address using the verification token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         example: 7b4c2d1f9a8e6c5b4d3a2f1e0c9b8a7d
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid, expired, or already used verification token
 *       500:
 *         description: Internal server error
 */
router.get('/verify/:token', authController.verifyEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Internal server error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: Check whether the current JWT is valid and return the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user returned
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get('/check', authJwtMiddleware, authController.checkAuth);

/**
 * @swagger
 * /auth/request-reset:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestResetRequest'
 *     responses:
 *       200:
 *         description: Password reset token generated if account exists
 *       400:
 *         description: Email is required
 *       500:
 *         description: Internal server error
 */
router.post('/request-reset', authController.requestPasswordReset);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a valid reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid request data, invalid token, expired token, or used token
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;