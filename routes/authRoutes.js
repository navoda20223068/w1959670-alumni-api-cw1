'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../manual_controllers/auth/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');
const validate = require('../middleware/validate');

const {
    registerSchema,
    loginSchema,
    resendVerificationSchema,
    requestResetSchema,
    resetPasswordSchema,
    verifyEmailParamsSchema
} = require('../validators/authValidators');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Alumni registration, email verification, login, logout, authentication checks, resend verification email, and password reset
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
 *     ResendVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           example: student@iit.ac.lk
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
 *           example: 7b4c2d1f9a8e6c5b4d3a2f1e0c9b8a7d7b4c2d1f9a8e6c5b4d3a2f1e0c9b8a7d
 *         newPassword:
 *           type: string
 *           example: NewStrongPass123!
 *
 *     SuccessMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Verification email sent successfully
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new alumnus account
 *     tags: [Authentication]
 *     description: Registers a new alumnus account, creates a verification token, and sends a verification email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully and verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/verify/{token}:
 *   get:
 *     summary: Verify a user's email address using the verification token
 *     tags: [Authentication]
 *     description: Verifies the user account if the token is valid, not expired, and has not already been used.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         example: 7b4c2d1f9a8e6c5b4d3a2f1e0c9b8a7d7b4c2d1f9a8e6c5b4d3a2f1e0c9b8a7d
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         description: Invalid, expired, or already used verification token
 *       500:
 *         description: Internal server error
 */
router.get(
    '/verify/:token',
    validate(verifyEmailParamsSchema, 'params'),
    authController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend a verification email
 *     tags: [Authentication]
 *     description: Generates a fresh verification token and sends a new verification email if the account exists and is still unverified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationRequest'
 *     responses:
 *       200:
 *         description: Verification email sent successfully, or generic success response for an unknown email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         description: Invalid email or already verified
 *       500:
 *         description: Internal server error
 */
router.post(
    '/resend-verification',
    validate(resendVerificationSchema),
    authController.resendVerificationEmail
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT token
 *     tags: [Authentication]
 *     description: Logs in a verified user and returns a signed JWT token.
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
 *         description: Invalid request data
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Internal server error
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     description: For JWT-based authentication, logout is handled client-side by removing the token.
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
 *     summary: Request a password reset email
 *     tags: [Authentication]
 *     description: Generates a password reset token and sends a reset email if the account exists.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestResetRequest'
 *     responses:
 *       200:
 *         description: Generic success response to avoid account enumeration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post(
    '/request-reset',
    validate(requestResetSchema),
    authController.requestPasswordReset
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a valid reset token
 *     tags: [Authentication]
 *     description: Resets the password if the reset token is valid, unexpired, and unused.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         description: Invalid request data, invalid token, expired token, or used token
 *       500:
 *         description: Internal server error
 */
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    authController.resetPassword
);

module.exports = router;