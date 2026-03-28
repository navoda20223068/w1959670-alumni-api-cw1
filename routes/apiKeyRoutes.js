'use strict';

const express = require('express');
const router = express.Router();
const apiKeyController = require('../manual_controllers/apiKey/index');

router.post('/clients', apiKeyController.createClient);
router.get('/clients', apiKeyController.listClients);

router.post('/keys', apiKeyController.createApiKey);
router.get('/keys', apiKeyController.listApiKeys);
router.post('/keys/:id/revoke', apiKeyController.revokeApiKey);

module.exports = router;