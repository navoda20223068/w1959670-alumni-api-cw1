'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

// Dashboard page
router.get('/dashboard', async (req, res) => {
    try {
        const [industryData] = await db.query(`
            SELECT industry_sector, COUNT(*) AS count
            FROM employment_history
            WHERE industry_sector IS NOT NULL
            GROUP BY industry_sector
            ORDER BY count DESC
        `);

        const [topEmployers] = await db.query(`
            SELECT company_name, COUNT(*) AS count
            FROM employment_history
            WHERE company_name IS NOT NULL
            GROUP BY company_name
            ORDER BY count DESC
        `);

        const [jobTitles] = await db.query(`
            SELECT job_title, COUNT(*) AS count
            FROM employment_history
            WHERE job_title IS NOT NULL
            GROUP BY job_title
            ORDER BY count DESC
        `);

        const [locations] = await db.query(`
            SELECT location, COUNT(*) AS count
            FROM employment_history
            WHERE location IS NOT NULL
            GROUP BY location
            ORDER BY count DESC
        `);

        const [graduationYears] = await db.query(`
            SELECT YEAR(completion_date) AS year, COUNT(*) AS count
            FROM degrees
            WHERE completion_date IS NOT NULL
            GROUP BY year
            ORDER BY year ASC
        `);

        const [programmes] = await db.query(`
            SELECT degree_name AS programme, COUNT(*) AS count
            FROM degrees
            WHERE degree_name IS NOT NULL
            GROUP BY degree_name
            ORDER BY count DESC
        `);

        const [certifications] = await db.query(`
            SELECT certification_name, COUNT(*) AS count
            FROM certifications
            WHERE certification_name IS NOT NULL
            GROUP BY certification_name
            ORDER BY count DESC
        `);

        const [skillsGap] = await db.query(`
            SELECT 'Certifications' AS skill, COUNT(*) AS count FROM certifications
            UNION ALL
            SELECT 'Courses' AS skill, COUNT(*) AS count FROM professional_courses
            UNION ALL
            SELECT 'Licences' AS skill, COUNT(*) AS count FROM licences
            UNION ALL
            SELECT 'Degrees' AS skill, COUNT(*) AS count FROM degrees
        `);

        res.render('dashboard', {
            industryData,
            topEmployers,
            jobTitles,
            locations,
            graduationYears,
            programmes,
            certifications,
            skillsGap
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading dashboard');
    }
});

router.get('/alumni', async (req, res) => {
    try {
        const { programme, graduationYear, industry } = req.query;

        let sql = `
            SELECT 
                u.id AS user_id,
                p.first_name,
                p.last_name,
                p.linkedin_url,
                d.degree_name AS programme,
                YEAR(d.completion_date) AS graduation_year,
                eh.job_title,
                eh.company_name,
                eh.industry_sector
            FROM users u
            INNER JOIN profiles p ON p.user_id = u.id
            LEFT JOIN degrees d ON d.user_id = u.id
            LEFT JOIN employment_history eh ON eh.user_id = u.id
            WHERE u.role = 'alumnus'
        `;

        const params = [];

        if (programme) {
            sql += ` AND d.degree_name LIKE ?`;
            params.push(`%${programme}%`);
        }

        if (graduationYear) {
            sql += ` AND YEAR(d.completion_date) = ?`;
            params.push(graduationYear);
        }

        if (industry) {
            sql += ` AND eh.industry_sector = ?`;
            params.push(industry);
        }

        sql += ` ORDER BY p.last_name ASC`;

        const [alumni] = await db.query(sql, params);

        res.render('alumni', {
            alumni,
            filters: {
                programme: programme || '',
                graduationYear: graduationYear || '',
                industry: industry || ''
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading alumni page');
    }
});

module.exports = router;