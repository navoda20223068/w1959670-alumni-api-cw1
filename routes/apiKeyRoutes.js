'use strict';

const express = require('express');
const router = express.Router();
const apiKeyController = require('../manual_controllers/apiKey/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Developer API Management
 *   description: Manage API clients, API keys, scopes, revocation, and usage tracking
 *
 * components:
 *   schemas:
 *     CreateClientRequest:
 *       type: object
 *       required:
 *         - clientName
 *       properties:
 *         clientName:
 *           type: string
 *           example: "Mobile App Client"
 *
 *     CreateApiKeyRequest:
 *       type: object
 *       required:
 *         - clientId
 *       properties:
 *         clientId:
 *           type: integer
 *           example: 1
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["featured:read"]
 */

/**
 * @swagger
 * /developer/clients:
 *   post:
 *     summary: Create a new API client
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new API client associated with the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *     responses:
 *       201:
 *         description: API client created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/clients', authJwtMiddleware, apiKeyController.createClient);

/**
 * @swagger
 * /developer/clients:
 *   get:
 *     summary: List all API clients for the authenticated user
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API clients
 */
router.get('/clients', authJwtMiddleware, apiKeyController.listClients);

/**
 * @swagger
 * /developer/keys:
 *   post:
 *     summary: Generate a new API key
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 *     description: Generates a new API key for a client. The raw key is returned only once.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApiKeyRequest'
 *     responses:
 *       201:
 *         description: API key created successfully
 *       403:
 *         description: Invalid client or unauthorized access
 */
router.post('/keys', authJwtMiddleware, apiKeyController.createApiKey);

/**
 * @swagger
 * /developer/keys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys (without raw keys)
 */
router.get('/keys', authJwtMiddleware, apiKeyController.listApiKeys);

/**
 * @swagger
 * /developer/keys/{id}/revoke:
 *   post:
 *     summary: Revoke an API key
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *       404:
 *         description: API key not found
 */
router.post('/keys/:id/revoke', authJwtMiddleware, apiKeyController.revokeApiKey);

/**
 * @swagger
 * /developer/keys/{id}/stats:
 *   get:
 *     summary: Get usage statistics for an API key
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 *     description: Returns usage logs including endpoints accessed, HTTP method, IP address, and timestamp
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: API key usage statistics
 *       404:
 *         description: API key not found
 */
router.get('/keys/:id/stats', authJwtMiddleware, apiKeyController.getKeyStats);

module.exports = router;