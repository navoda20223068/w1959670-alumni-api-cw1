'use strict';

const db = require('../../db');
const crypto = require('crypto');

exports.createClient = async function (req, res) {
    try {
        const userId = req.user.id;
        const { clientName } = req.body;

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
        console.error('Create client error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.listClients = async function (req, res) {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT id, client_name, status, created_at
             FROM api_clients
             WHERE user_id = ?`,
            [userId]
        );

        return res.json({
            success: true,
            clients: rows
        });

    } catch (err) {
        console.error('List clients error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createApiKey = async function (req, res) {
    try {
        const userId = req.user.id;
        const { clientId, scopes } = req.body;

        // Ownership check (business rule)
        const [clients] = await db.query(
            `SELECT id FROM api_clients WHERE id = ? AND user_id = ?`,
            [clientId, userId]
        );

        if (clients.length === 0) {
            return res.status(403).json({ error: 'Invalid client' });
        }

        // Generate secure API key
        const rawKey = crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        await db.query(
            `INSERT INTO api_keys (client_id, key_hash, scopes)
             VALUES (?, ?, ?)`,
            [clientId, keyHash, JSON.stringify(scopes || [])]
        );

        return res.status(201).json({
            success: true,
            apiKey: rawKey
        });

    } catch (err) {
        console.error('Create API key error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.listApiKeys = async function (req, res) {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT ak.id, ak.scopes, ak.expires_at, ak.revoked_at, ak.created_at
             FROM api_keys ak
             JOIN api_clients ac ON ak.client_id = ac.id
             WHERE ac.user_id = ?`,
            [userId]
        );

        return res.json({
            success: true,
            keys: rows
        });

    } catch (err) {
        console.error('List API keys error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.revokeApiKey = async function (req, res) {
    try {
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

        const [result] = await db.query(
            `UPDATE api_keys SET revoked_at = NOW() WHERE id = ?`,
            [keyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Key not found' });
        }

        return res.json({
            success: true,
            message: 'API key revoked'
        });

    } catch (err) {
        console.error('Revoke API key error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getKeyStats = async function (req, res) {
    try {
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