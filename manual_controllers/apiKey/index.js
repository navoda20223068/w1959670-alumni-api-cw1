'use strict';

const db = require('../../db');
const crypto = require('crypto');


exports.createClient = async function (req, res) {
    try {
        const userId = req.user.id;
        const { clientName } = req.body;

        if (!clientName) {
            return res.status(400).json({ error: 'clientName is required' });
        }

        const [result] = await db.query(
            `INSERT INTO api_clients (user_id, client_name, status)
             VALUES (?, ?, 'active')`,
            [userId, clientName]
        );

        return res.status(201).json({
            success: true,
            clientId: result.insertId
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.listClients = async function (req, res) {
    const userId = req.user.id;

    const [rows] = await db.query(
        `SELECT id, client_name, status, created_at
         FROM api_clients
         WHERE user_id = ?`,
        [userId]
    );

    res.json({ success: true, clients: rows });
};

exports.createApiKey = async function (req, res) {
    try {
        const userId = req.user.id;
        const { clientId, scopes } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'clientId required' });
        }

        // Check ownership
        const [clients] = await db.query(
            `SELECT id FROM api_clients WHERE id = ? AND user_id = ?`,
            [clientId, userId]
        );

        if (clients.length === 0) {
            return res.status(403).json({ error: 'Invalid client' });
        }

        // Generate key
        const rawKey = crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        await db.query(
            `INSERT INTO api_keys (client_id, key_hash, scopes)
             VALUES (?, ?, ?)`,
            [clientId, keyHash, JSON.stringify(scopes || [])]
        );

        return res.status(201).json({
            success: true,
            apiKey: rawKey // ONLY RETURN ONCE
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.listApiKeys = async function (req, res) {
    const userId = req.user.id;

    const [rows] = await db.query(
        `SELECT ak.id, ak.scopes, ak.expires_at, ak.revoked_at, ak.created_at
         FROM api_keys ak
         JOIN api_clients ac ON ak.client_id = ac.id
         WHERE ac.user_id = ?`,
        [userId]
    );

    res.json({ success: true, keys: rows });
};

exports.revokeApiKey = async function (req, res) {
    const userId = req.user.id;
    const keyId = req.params.id;

    const [rows] = await db.query(
        `SELECT ak.id
         FROM api_keys ak
         JOIN api_clients ac ON ak.client_id = ac.id
         WHERE ak.id = ? AND ac.user_id = ?`,
        [keyId, userId]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Key not found' });
    }

    await db.query(
        `UPDATE api_keys SET revoked_at = NOW() WHERE id = ?`,
        [keyId]
    );

    res.json({ success: true, message: 'API key revoked' });
};

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