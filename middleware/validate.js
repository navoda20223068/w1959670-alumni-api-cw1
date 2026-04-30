'use strict';

const { sanitiseObject } = require('../utils/sanitize');

function validate(schema, target = 'body') {
    return function (req, res, next) {
        const input = req[target] || {};
        const sanitisedInput = sanitiseObject(input);

        const { error, value } = schema.validate(sanitisedInput, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map((item) => item.message)
            });
        }

        req[target] = value;
        next();
    };
}

module.exports = validate;