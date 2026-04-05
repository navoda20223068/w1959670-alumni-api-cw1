'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE) === 'true',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function sendMail({ to, subject, text, html }) {
    if (!to) {
        throw new Error('Recipient email is required');
    }

    return transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text,
        html
    });
}

async function sendVerificationEmail(to, token) {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify/${token}`;

    const subject = 'Verify your email address';
    const text =
        `Welcome to the Alumni Influencer Platform.\n\n` +
        `Please verify your email by visiting this link:\n${verifyUrl}\n\n` +
        `This link will expire in 24 hours.`;

    const html = `
        <h2>Verify your email address</h2>
        <p>Welcome to the Alumni Influencer Platform.</p>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
    `;

    return sendMail({ to, subject, text, html });
}

async function sendPasswordResetEmail(to, token) {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const subject = 'Reset your password';
    const text =
        `A password reset was requested for your account.\n\n` +
        `Use this link to reset your password:\n${resetUrl}\n\n` +
        `This link will expire in 1 hour.\n` +
        `If you did not request this, you can ignore this email.`;

    const html = `
        <h2>Reset your password</h2>
        <p>A password reset was requested for your account.</p>
        <p>Use the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
    `;

    return sendMail({ to, subject, text, html });
}

async function verifyEmailTransport() {
    return transporter.verify();
}

module.exports = {
    sendMail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    verifyEmailTransport
};