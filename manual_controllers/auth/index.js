'use strict';

const db = require('../../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// POST /auth_manual/register
exports.register = async function (req, res) {
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

// GET /auth_manual/verify/:token
exports.verifyEmail = async function (req, res) {
    try {
        const rawToken = req.params.token;

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

// POST /auth_manual/login
// POST /auth/login
exports.login = async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        const [rows] = await db.query(
            `SELECT id, university_email, password_hash, email_verified, role
             FROM users
             WHERE university_email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const user = rows[0];

        if (!user.email_verified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in'
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                sub: user.id,
                email: user.university_email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                algorithm: 'HS256',
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        return res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.university_email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// POST /auth/logout
exports.logout = async function (req, res) {
    try {
        return res.json({
            success: true,
            message: 'Logout successful. Remove the token on the client side.'
        });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// GET /auth/check
exports.checkAuth = async function (req, res) {
    try {
        return res.json({
            authenticated: true,
            user: req.user
        });
    } catch (err) {
        console.error('Check auth error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.requestPasswordReset = async function (req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        const [rows] = await db.query(
            `SELECT id
             FROM users
             WHERE university_email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        // Always return the same response to prevent email enumeration
        if (rows.length === 0) {
            return res.json({
                success: true,
                message: 'If that email exists, a reset token has been generated'
            });
        }

        const user = rows[0];

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.query(
            `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at)
             VALUES (?, ?, ?, NULL)`,
            [user.id, tokenHash, expiresAt]
        );

        return res.json({
            success: true,
            message: 'If that email exists, a reset token has been generated',
            resetToken: rawToken
        });

    } catch (err) {
        console.error('Request reset error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.resetPassword = async function (req, res) {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                error: 'Token and newPassword are required'
            });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters long'
            });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const [rows] = await db.query(
            `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = ?
       LIMIT 1`,
            [tokenHash]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                error: 'Invalid reset token'
            });
        }

        const tokenRecord = rows[0];

        if (tokenRecord.used_at) {
            return res.status(400).json({
                error: 'Reset token has already been used'
            });
        }

        const now = new Date();
        const expiresAt = new Date(tokenRecord.expires_at);

        if (now > expiresAt) {
            return res.status(400).json({
                error: 'Reset token has expired'
            });
        }

        const passwordHash = await bcrypt.hash(String(newPassword), 10);

        await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, tokenRecord.user_id]
        );

        await db.query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
            [tokenRecord.id]
        );

        return res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};