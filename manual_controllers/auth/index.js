'use strict';

const db = require('../../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
    sendVerificationEmail,
    sendPasswordResetEmail
} = require('../../services/emailService');

exports.register = async function (req, res) {
    try {
        const { email, password } = req.body;
        const cleanEmail = String(email).toLowerCase();

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE university_email = ?',
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'User already exists'
            });
        }

        const passwordHash = await bcrypt.hash(String(password), 10);

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

        await sendVerificationEmail(cleanEmail, rawToken);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully. A verification email has been sent.'
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.verifyEmail = async function (req, res) {
    try {
        const rawToken = req.params.token;
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

        if (new Date() > new Date(tokenRecord.expires_at)) {
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

exports.login = async function (req, res) {
    try {
        const { email, password } = req.body;
        const cleanEmail = String(email).toLowerCase();

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

        const passwordMatches = await bcrypt.compare(String(password), user.password_hash);

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

        // Set httpOnly cookie for browser-based page access (dashboard, alumni)
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour, matches JWT expiry
        });

        return res.json({
            success: true,
            message: 'Login successful',
            token,
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

exports.logout = async function (req, res) {
    try {
        res.clearCookie('authToken');

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

exports.checkAuth = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                authenticated: false
            });
        }

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
        const cleanEmail = String(email).toLowerCase();

        const [rows] = await db.query(
            `SELECT id
             FROM users
             WHERE university_email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.json({
                success: true,
                message: 'If that email exists, a password reset email has been sent'
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

        await sendPasswordResetEmail(cleanEmail, rawToken);

        return res.json({
            success: true,
            message: 'If that email exists, a password reset email has been sent'
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

        if (new Date() > new Date(tokenRecord.expires_at)) {
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

exports.resendVerificationEmail = async function (req, res) {
    try {
        const { email } = req.body;
        const cleanEmail = String(email).toLowerCase();

        const [rows] = await db.query(
            `SELECT id, email_verified
             FROM users
             WHERE university_email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.json({
                success: true,
                message: 'If that email exists, a verification email has been sent'
            });
        }

        const user = rows[0];

        if (user.email_verified) {
            return res.status(400).json({
                error: 'Email is already verified'
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.query(
            `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, used_at)
             VALUES (?, ?, ?, NULL)`,
            [user.id, tokenHash, expiresAt]
        );

        await sendVerificationEmail(cleanEmail, rawToken);

        return res.json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (err) {
        console.error('Resend verification error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};