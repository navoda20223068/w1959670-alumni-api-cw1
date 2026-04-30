'use strict';

const Joi = require('joi');

const universityEmail = Joi.string()
    .email()
    .lowercase()
    .pattern(/@(iit\.ac\.lk|westminster\.ac\.uk)$/)
    .required()
    .messages({
        'string.pattern.base': 'Email must be a valid university email address'
    });

const strongPassword = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
        'string.pattern.base':
            'Password must include at least one uppercase letter, one lowercase letter, and one number'
    });

const tokenSchema = Joi.string().hex().length(64).required();

module.exports = {
    registerSchema: Joi.object({
        email: universityEmail,
        password: strongPassword
    }),

    loginSchema: Joi.object({
        email: universityEmail,
        password: Joi.string().required()
    }),

    resendVerificationSchema: Joi.object({
        email: universityEmail
    }),

    requestResetSchema: Joi.object({
        email: universityEmail
    }),

    resetPasswordSchema: Joi.object({
        token: tokenSchema,
        newPassword: strongPassword
    }),

    verifyEmailParamsSchema: Joi.object({
        token: tokenSchema
    })
};