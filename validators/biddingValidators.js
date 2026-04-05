'use strict';

const Joi = require('joi');

module.exports = {
    placeBidSchema: Joi.object({
        bidDate: Joi.date().iso().required(),
        amount: Joi.number().positive().precision(2).required()
    }),

    increaseBidSchema: Joi.object({
        amount: Joi.number().positive().precision(2).required()
    }),

    bidIdParamSchema: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    bidDateParamSchema: Joi.object({
        date: Joi.date().iso().required()
    })
};