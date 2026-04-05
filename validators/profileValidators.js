'use strict';

const Joi = require('joi');

const urlField = Joi.string().uri({ scheme: ['http', 'https'] }).max(500);
const dateField = Joi.date().iso();

module.exports = {
    profileSchema: Joi.object({
        firstName: Joi.string().min(1).max(100).required(),
        lastName: Joi.string().min(1).max(100).required(),
        biography: Joi.string().min(10).max(2000).allow('', null),
        linkedinUrl: urlField.allow('', null)
    }),

    degreeSchema: Joi.object({
        degreeName: Joi.string().min(2).max(200).required(),
        institutionName: Joi.string().min(2).max(200).required(),
        officialUrl: urlField.allow('', null),
        completionDate: dateField.allow(null)
    }),

    certificationSchema: Joi.object({
        certificationName: Joi.string().min(2).max(200).required(),
        providerName: Joi.string().min(2).max(200).required(),
        officialUrl: urlField.allow('', null),
        completionDate: dateField.allow(null)
    }),

    licenceSchema: Joi.object({
        licenceName: Joi.string().min(2).max(200).required(),
        awardingBody: Joi.string().min(2).max(200).required(),
        officialUrl: urlField.allow('', null),
        completionDate: dateField.allow(null)
    }),

    courseSchema: Joi.object({
        courseName: Joi.string().min(2).max(200).required(),
        providerName: Joi.string().min(2).max(200).required(),
        officialUrl: urlField.allow('', null),
        completionDate: dateField.allow(null)
    }),

    employmentSchema: Joi.object({
        companyName: Joi.string().min(2).max(200).required(),
        jobTitle: Joi.string().min(2).max(200).required(),
        startDate: dateField.allow(null),
        endDate: dateField.allow(null),
        isCurrent: Joi.boolean().required()
    }).custom((value, helpers) => {
        if (value.isCurrent && value.endDate) {
            return helpers.error('any.invalid');
        }

        if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
            return helpers.error('any.invalid');
        }

        return value;
    }, 'employment validation').messages({
        'any.invalid': 'Employment dates are invalid'
    }),

    idParamSchema: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};