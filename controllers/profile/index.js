'use strict';

exports.name = 'profile';
exports.prefix = '/profile';

exports.index = function (req, res) {
    res.json({
        module: 'profile',
        message: 'Legacy profile controller placeholder'
    });
};