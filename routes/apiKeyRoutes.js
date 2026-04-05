'use strict';

const express = require('express');
const router = express.Router();

const apiKeyController = require('../manual_controllers/apiKey/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');
const validate = require('../middleware/validate');

const {
    createClientSchema,
    createApiKeySchema,
    idParamSchema
} = require('../validators/apiKeyValidators');

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
 */
router.post(
    '/clients',
    authJwtMiddleware,
    validate(createClientSchema),
    apiKeyController.createClient
);

/**
 * @swagger
 * /developer/clients:
 *   get:
 *     summary: List all API clients for the authenticated user
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
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
 */
router.post(
    '/keys',
    authJwtMiddleware,
    validate(createApiKeySchema),
    apiKeyController.createApiKey
);

/**
 * @swagger
 * /developer/keys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
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
 */
router.post(
    '/keys/:id/revoke',
    authJwtMiddleware,
    validate(idParamSchema, 'params'),
    apiKeyController.revokeApiKey
);

/**
 * @swagger
 * /developer/keys/{id}/stats:
 *   get:
 *     summary: Get usage statistics for an API key
 *     tags: [Developer API Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/keys/:id/stats',
    authJwtMiddleware,
    validate(idParamSchema, 'params'),
    apiKeyController.getKeyStats
);

module.exports = router;