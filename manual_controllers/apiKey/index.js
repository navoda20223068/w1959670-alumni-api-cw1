'use strict';

const db = require('../../db');
const crypto = require('crypto');

exports.createClient = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const { clientName } = req.body;

        if (!clientName || !String(clientName).trim()) {
            return res.status(400).json({
                error: 'clientName is required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO api_clients (user_id, client_name, status)
             VALUES (?, ?, 'active')`,
            [userId, String(clientName).trim()]
        );

        return res.status(201).json({
            success: true,
            message: 'API client created successfully',
            clientId: result.insertId
        });

    } catch (err) {
        console.error('Create client error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.listClients = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT id, client_name, status, created_at
             FROM api_clients
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.json({
            success: true,
            clients: rows
        });

    } catch (err) {
        console.error('List clients error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.createApiKey = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const { clientId, scopes, expiresAt } = req.body;

        if (!clientId) {
            return res.status(400).json({
                error: 'clientId is required'
            });
        }

        const [clients] = await db.query(
            `SELECT id
             FROM api_clients
             WHERE id = ? AND user_id = ? AND status = 'active'
             LIMIT 1`,
            [clientId, userId]
        );

        if (clients.length === 0) {
            return res.status(404).json({
                error: 'Active API client not found'
            });
        }

        const rawKey = crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const [result] = await db.query(
            `INSERT INTO api_keys (client_id, key_hash, scopes, expires_at, revoked_at)
             VALUES (?, ?, ?, ?, NULL)`,
            [
                clientId,
                keyHash,
                scopes ? JSON.stringify(scopes) : null,
                expiresAt || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'API key created successfully',
            apiKeyId: result.insertId,
            apiKey: rawKey
        });

    } catch (err) {
        console.error('Create API key error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.listApiKeys = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT ak.id, ak.client_id, ac.client_name, ak.scopes, ak.expires_at, ak.revoked_at, ak.created_at
             FROM api_keys ak
             INNER JOIN api_clients ac ON ak.client_id = ac.id
             WHERE ac.user_id = ?
             ORDER BY ak.created_at DESC`,
            [userId]
        );

        return res.json({
            success: true,
            apiKeys: rows
        });

    } catch (err) {
        console.error('List API keys error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.revokeApiKey = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const apiKeyId = req.params.id;

        const [rows] = await db.query(
            `SELECT ak.id
             FROM api_keys ak
             INNER JOIN api_clients ac ON ak.client_id = ac.id
             WHERE ak.id = ?
               AND ac.user_id = ?
               AND ak.revoked_at IS NULL
             LIMIT 1`,
            [apiKeyId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Active API key not found'
            });
        }

        await db.query(
            `UPDATE api_keys
             SET revoked_at = NOW()
             WHERE id = ?`,
            [apiKeyId]
        );

        return res.json({
            success: true,
            message: 'API key revoked successfully'
        });

    } catch (err) {
        console.error('Revoke API key error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};