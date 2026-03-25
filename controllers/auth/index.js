'use strict';

exports.name = 'auth';
exports.prefix = '/auth';

exports.index = function (req, res) {
    res.json({
        module: 'auth',
        message: 'Auth module ready'
    });
};