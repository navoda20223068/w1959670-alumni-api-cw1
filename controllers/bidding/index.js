'use strict';

exports.name = 'bidding';
exports.prefix = '/bidding';

exports.index = function (req, res) {
    res.json({
        module: 'bidding',
        message: 'Legacy bidding controller placeholder'
    });
};