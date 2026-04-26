'use strict';

const db = require('../../db');

exports.getIndustryDistribution = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT 
                industry_sector,
                COUNT(*) AS count
            FROM employment_history
            WHERE industry_sector IS NOT NULL
            GROUP BY industry_sector
            ORDER BY count DESC
        `);

        return res.json({
            success: true,
            data: rows
        });

    } catch (err) {
        console.error('Industry distribution error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getTopEmployers = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT company_name, COUNT(*) AS count
            FROM employment_history
            WHERE company_name IS NOT NULL
            GROUP BY company_name
            ORDER BY count DESC
        `);

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getJobTitles = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT job_title, COUNT(*) AS count
            FROM employment_history
            WHERE job_title IS NOT NULL
            GROUP BY job_title
            ORDER BY count DESC
        `);

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLocationDistribution = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT location, COUNT(*) AS count
            FROM employment_history
            WHERE location IS NOT NULL
            GROUP BY location
            ORDER BY count DESC
        `);

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getGraduationYears = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT YEAR(completion_date) AS year, COUNT(*) AS count
            FROM degrees
            WHERE completion_date IS NOT NULL
            GROUP BY year
            ORDER BY year DESC
        `);

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getProgrammeDistribution = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT degree_name AS programme, COUNT(*) AS count
            FROM degrees
            WHERE degree_name IS NOT NULL
            GROUP BY degree_name
            ORDER BY count DESC
        `);

        res.json({ success: true, data: rows });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCertificationTrends = async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT certification_name, COUNT(*) AS count
            FROM certifications
            WHERE certification_name IS NOT NULL
            GROUP BY certification_name
            ORDER BY count DESC
        `);

        res.json({ success: true, data: rows });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSkillsGap = async function (req, res) {
    try {
        const [certs] = await db.query(`SELECT COUNT(*) AS count FROM certifications`);
        const [courses] = await db.query(`SELECT COUNT(*) AS count FROM professional_courses`);
        const [licences] = await db.query(`SELECT COUNT(*) AS count FROM licences`);
        const [degrees] = await db.query(`SELECT COUNT(*) AS count FROM degrees`);

        const data = [
            { skill: 'Certifications', count: certs[0].count },
            { skill: 'Courses', count: courses[0].count },
            { skill: 'Licences', count: licences[0].count },
            { skill: 'Degrees', count: degrees[0].count }
        ];

        res.json({ success: true, data });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};