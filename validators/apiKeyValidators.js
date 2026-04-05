'use strict';

const Joi = require('joi');

module.exports = {
    createClientSchema: Joi.object({
        clientName: Joi.string().min(2).max(200).required()
    }),

    createApiKeySchema: Joi.object({
        clientId: Joi.number().integer().positive().required(),
        scopes: Joi.array()
            .items(Joi.string().max(100))
            .default([])
    }),

    idParamSchema: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};