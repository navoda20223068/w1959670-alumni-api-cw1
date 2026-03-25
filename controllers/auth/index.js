'use strict';

const db = require('../../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.name = 'auth';
exports.prefix = '/auth';

// POST /auth/auth
exports.create = async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPassword = String(password);

        if (
            !cleanEmail.endsWith('@iit.ac.lk') &&
            !cleanEmail.endsWith('@westminster.ac.uk')
        ) {
            return res.status(400).json({
                error: 'Must use a university email address'
            });
        }

        if (cleanPassword.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE university_email = ?',
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'User already exists'
            });
        }

        const passwordHash = await bcrypt.hash(cleanPassword, 10);

        const [result] = await db.query(
            `INSERT INTO users (university_email, password_hash, email_verified, role)
       VALUES (?, ?, 0, 'alumnus')`,
            [cleanEmail, passwordHash]
        );

        const userId = result.insertId;

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.query(
            `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, used_at)
       VALUES (?, ?, ?, NULL)`,
            [userId, tokenHash, expiresAt]
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully. Verify the email using the returned token.',
            userId: userId,
            verificationToken: rawToken
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// GET /auth/:auth_id
exports.show = async function (req, res) {
    try {
        const rawToken = req.params.auth_id;

        if (!rawToken) {
            return res.status(400).json({
                error: 'Verification token is required'
            });
        }

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const [rows] = await db.query(
            `SELECT id, user_id, expires_at, used_at
       FROM email_verification_tokens
       WHERE token_hash = ?
       LIMIT 1`,
            [tokenHash]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                error: 'Invalid verification token'
            });
        }

        const tokenRecord = rows[0];

        if (tokenRecord.used_at) {
            return res.status(400).json({
                error: 'Verification token has already been used'
            });
        }

        const now = new Date();
        const expiresAt = new Date(tokenRecord.expires_at);

        if (now > expiresAt) {
            return res.status(400).json({
                error: 'Verification token has expired'
            });
        }

        await db.query(
            'UPDATE users SET email_verified = 1 WHERE id = ?',
            [tokenRecord.user_id]
        );

        await db.query(
            'UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?',
            [tokenRecord.id]
        );

        return res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (err) {
        console.error('Email verification error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};