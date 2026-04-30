'use strict';

const jwt = require('jsonwebtoken');

module.exports = function authPageMiddleware(req, res, next) {
    const token = req.cookies.authToken;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (err) {
        res.clearCookie('authToken');
        return res.redirect('/login');
    }
};