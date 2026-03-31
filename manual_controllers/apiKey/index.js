'use strict';

const db = require('../../db');
const crypto = require('crypto');

exports.getKeyStats = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const apiKeyId = req.params.id;

        const [ownedKeys] = await db.query(
            `SELECT ak.id
             FROM api_keys ak
             INNER JOIN api_clients ac ON ak.client_id = ac.id
             WHERE ak.id = ?
               AND ac.user_id = ?
             LIMIT 1`,
            [apiKeyId, userId]
        );

        if (ownedKeys.length === 0) {
            return res.status(404).json({
                error: 'API key not found'
            });
        }

        const [rows] = await db.query(
            `SELECT endpoint, method, ip_address, used_at
             FROM api_usage_logs
             WHERE api_key_id = ?
             ORDER BY used_at DESC`,
            [apiKeyId]
        );

        return res.json({
            success: true,
            apiKeyId: Number(apiKeyId),
            usage: rows
        });

    } catch (err) {
        console.error('Get key stats error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};