'use strict';

const express = require('express');
const router = express.Router();
const apiKeyController = require('../manual_controllers/apiKey/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

router.post('/clients', authJwtMiddleware, apiKeyController.createClient);
router.get('/clients', authJwtMiddleware, apiKeyController.listClients);
router.post('/keys', authJwtMiddleware, apiKeyController.createApiKey);
router.get('/keys', authJwtMiddleware, apiKeyController.listApiKeys);
router.post('/keys/:id/revoke', authJwtMiddleware, apiKeyController.revokeApiKey);

module.exports = router;