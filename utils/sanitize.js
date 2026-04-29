'use strict';

const xss = require('xss');

function sanitiseString(value) {
    if (typeof value !== 'string') {
        return value;
    }

    // Strip HTML tags and script injection, then trim and collapse whitespace
    return xss(value.trim().replace(/\s+/g, ' '));
}

function sanitiseObject(input) {
    if (Array.isArray(input)) {
        return input.map(sanitiseObject);
    }

    if (input && typeof input === 'object') {
        const output = {};

        for (const key of Object.keys(input)) {
            output[key] = sanitiseObject(input[key]);
        }

        return output;
    }

    return sanitiseString(input);
}

module.exports = {
    sanitiseString,
    sanitiseObject
};