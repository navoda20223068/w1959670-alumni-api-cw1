'use strict';

const db = require('../db');
const crypto = require('crypto');

module.exports = async function (req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Bearer token is required'
            });
        }

        const apiKey = authHeader.split(' ')[1];

        if (!apiKey) {
            return res.status(401).json({
                error: 'API key is missing'
            });
        }

        const keyHash = crypto
            .createHash('sha256')
            .update(apiKey)
            .digest('hex');

        const [rows] = await db.query(
            `SELECT ak.id,
                    ak.client_id,
                    ak.scopes,
                    ak.revoked_at,
                    ak.expires_at,
                    ac.status AS client_status
             FROM api_keys ak
             INNER JOIN api_clients ac ON ak.client_id = ac.id
             WHERE ak.key_hash = ?
             LIMIT 1`,
            [keyHash]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid API key'
            });
        }

        const key = rows[0];

        if (key.client_status !== 'active') {
            return res.status(403).json({
                error: 'API client is inactive'
            });
        }

        if (key.revoked_at) {
            return res.status(403).json({
                error: 'API key has been revoked'
            });
        }

        if (key.expires_at && new Date() > new Date(key.expires_at)) {
            return res.status(403).json({
                error: 'API key has expired'
            });
        }

        // Attach to request
        req.apiKey = {
            id: key.id,
            clientId: key.client_id,
            scopes: key.scopes ? JSON.parse(key.scopes) : []
        };

        // Log usage
        await db.query(
            `INSERT INTO api_usage_logs (api_key_id, endpoint, method, ip_address)
             VALUES (?, ?, ?, ?)`,
            [
                key.id,
                req.originalUrl,
                req.method,
                req.ip
            ]
        );

        next();

    } catch (err) {
        console.error('API key middleware error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};