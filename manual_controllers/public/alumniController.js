'use strict';

const db = require('../../db');

exports.getAlumni = async function (req, res) {
    try {
        const { programme, graduationYear, industry } = req.query;

        let sql = `
            SELECT 
                u.id AS user_id,
                p.first_name,
                p.last_name,
                p.biography,
                p.linkedin_url,
                p.profile_image_path,
                d.degree_name AS programme,
                YEAR(d.completion_date) AS graduation_year,
                eh.company_name,
                eh.job_title,
                eh.industry_sector,
                eh.location
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

        sql += ` ORDER BY p.last_name ASC, p.first_name ASC`;

        const [rows] = await db.query(sql, params);

        return res.json({
            success: true,
            filters: {
                programme: programme || null,
                graduationYear: graduationYear || null,
                industry: industry || null
            },
            alumni: rows
        });
    } catch (err) {
        console.error('Get alumni error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};