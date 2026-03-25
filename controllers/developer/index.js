'use strict';

exports.name = 'developer';
exports.prefix = '/developer';

exports.index = function (req, res) {
    res.json({
        module: 'developer',
        message: 'Developer module ready'
    });
};