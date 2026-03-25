'use strict';

exports.name = 'public';
exports.prefix = '/public';

exports.index = function (req, res) {
    res.json({
        module: 'public',
        message: 'Public API module ready'
    });
};