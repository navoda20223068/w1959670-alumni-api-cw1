'use strict';

const db = require('../../db');

exports.getMyProfile = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;

        const [rows] = await db.query(
            `SELECT id, user_id, first_name, last_name, biography, linkedin_url, profile_image_path, completion_status, created_at, updated_at
       FROM profiles
       WHERE user_id = ?
       LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }

        return res.json({
            success: true,
            profile: rows[0]
        });
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.createMyProfile = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;
        const { firstName, lastName, biography, linkedinUrl } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({
                error: 'firstName and lastName are required'
            });
        }

        if (linkedinUrl && !/^https?:\/\/.+/i.test(linkedinUrl)) {
            return res.status(400).json({
                error: 'LinkedIn URL must be a valid URL'
            });
        }

        const [existing] = await db.query(
            'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Profile already exists'
            });
        }

        const completionStatus = biography && linkedinUrl ? 1 : 0;

        const [result] = await db.query(
            `INSERT INTO profiles (user_id, first_name, last_name, biography, linkedin_url, completion_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                String(firstName).trim(),
                String(lastName).trim(),
                biography ? String(biography).trim() : null,
                linkedinUrl ? String(linkedinUrl).trim() : null,
                completionStatus
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Profile created successfully',
            profileId: result.insertId
        });
    } catch (err) {
        console.error('Create profile error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.updateMyProfile = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;
        const { firstName, lastName, biography, linkedinUrl } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }

        if (linkedinUrl && !/^https?:\/\/.+/i.test(linkedinUrl)) {
            return res.status(400).json({
                error: 'LinkedIn URL must be a valid URL'
            });
        }

        const completionStatus = biography && linkedinUrl ? 1 : 0;

        await db.query(
            `UPDATE profiles
       SET first_name = ?, last_name = ?, biography = ?, linkedin_url = ?, completion_status = ?
       WHERE user_id = ?`,
            [
                firstName ? String(firstName).trim() : null,
                lastName ? String(lastName).trim() : null,
                biography ? String(biography).trim() : null,
                linkedinUrl ? String(linkedinUrl).trim() : null,
                completionStatus,
                userId
            ]
        );

        return res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.addDegree = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const { degreeName, institutionName, officialUrl, completionDate } = req.body;

        if (!degreeName || !institutionName) {
            return res.status(400).json({
                error: 'degreeName and institutionName are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO degrees (user_id, degree_name, institution_name, official_url, completion_date)
       VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                degreeName,
                institutionName,
                officialUrl || null,
                completionDate || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Degree added successfully',
            degreeId: result.insertId
        });

    } catch (err) {
        console.error('Add degree error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addDegree = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const { degreeName, institutionName, officialUrl, completionDate } = req.body;

        if (!degreeName || !institutionName) {
            return res.status(400).json({
                error: 'degreeName and institutionName are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO degrees (user_id, degree_name, institution_name, official_url, completion_date)
       VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                degreeName,
                institutionName,
                officialUrl || null,
                completionDate || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Degree added successfully',
            degreeId: result.insertId
        });

    } catch (err) {
        console.error('Add degree error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDegrees = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;

        const [rows] = await db.query(
            `SELECT * FROM degrees WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            degrees: rows
        });

    } catch (err) {
        console.error('Get degrees error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateDegree = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const degreeId = req.params.id;
        const { degreeName, institutionName, officialUrl, completionDate } = req.body;

        await db.query(
            `UPDATE degrees
       SET degree_name = ?, institution_name = ?, official_url = ?, completion_date = ?
       WHERE id = ? AND user_id = ?`,
            [
                degreeName,
                institutionName,
                officialUrl || null,
                completionDate || null,
                degreeId,
                userId
            ]
        );

        res.json({
            success: true,
            message: 'Degree updated successfully'
        });

    } catch (err) {
        console.error('Update degree error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteDegree = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const degreeId = req.params.id;

        await db.query(
            `DELETE FROM degrees WHERE id = ? AND user_id = ?`,
            [degreeId, userId]
        );

        res.json({
            success: true,
            message: 'Degree deleted successfully'
        });

    } catch (err) {
        console.error('Delete degree error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addCertification = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const { certificationName, providerName, officialUrl, completionDate } = req.body;

        if (!certificationName || !providerName) {
            return res.status(400).json({
                error: 'certificationName and providerName are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO certifications (user_id, certification_name, provider_name, official_url, completion_date)
       VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                certificationName,
                providerName,
                officialUrl || null,
                completionDate || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Certification added successfully',
            certificationId: result.insertId
        });

    } catch (err) {
        console.error('Add certification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCertifications = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;

        const [rows] = await db.query(
            `SELECT * FROM certifications WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            certifications: rows
        });

    } catch (err) {
        console.error('Get certifications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCertification = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const id = req.params.id;
        const { certificationName, providerName, officialUrl, completionDate } = req.body;

        await db.query(
            `UPDATE certifications
       SET certification_name = ?, provider_name = ?, official_url = ?, completion_date = ?
       WHERE id = ? AND user_id = ?`,
            [
                certificationName,
                providerName,
                officialUrl || null,
                completionDate || null,
                id,
                userId
            ]
        );

        res.json({
            success: true,
            message: 'Certification updated successfully'
        });

    } catch (err) {
        console.error('Update certification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCertification = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.session.user.id;
        const id = req.params.id;

        await db.query(
            `DELETE FROM certifications WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        res.json({
            success: true,
            message: 'Certification deleted successfully'
        });

    } catch (err) {
        console.error('Delete certification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

