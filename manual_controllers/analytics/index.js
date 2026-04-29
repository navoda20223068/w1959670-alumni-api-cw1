'use strict';

const db = require('../../db');

exports.getIndustryDistribution = async function (req, res) {
    try {
        const { programme, graduationYear } = req.query;
        const params = [];

        let sql = `
            SELECT eh.industry_sector, COUNT(*) AS count
            FROM employment_history eh
            JOIN users u ON eh.user_id = u.id
        `;

        if (programme || graduationYear) {
            sql += ` JOIN degrees d ON d.user_id = u.id`;
        }

        sql += ` WHERE eh.industry_sector IS NOT NULL`;

        if (programme) {
            sql += ` AND d.degree_name LIKE ?`;
            params.push(`%${programme}%`);
        }

        if (graduationYear) {
            sql += ` AND YEAR(d.completion_date) = ?`;
            params.push(graduationYear);
        }

        sql += ` GROUP BY eh.industry_sector ORDER BY count DESC`;

        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });

    } catch (err) {
        console.error('Industry distribution error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTopEmployers = async function (req, res) {
    try {
        const { programme, graduationYear } = req.query;
        const params = [];

        let sql = `
            SELECT eh.company_name, COUNT(*) AS count
            FROM employment_history eh
            JOIN users u ON eh.user_id = u.id
        `;

        if (programme || graduationYear) {
            sql += ` JOIN degrees d ON d.user_id = u.id`;
        }

        sql += ` WHERE eh.company_name IS NOT NULL`;

        if (programme) {
            sql += ` AND d.degree_name LIKE ?`;
            params.push(`%${programme}%`);
        }

        if (graduationYear) {
            sql += ` AND YEAR(d.completion_date) = ?`;
            params.push(graduationYear);
        }

        sql += ` GROUP BY eh.company_name ORDER BY count DESC`;

        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getJobTitles = async function (req, res) {
    try {
        const { programme, graduationYear } = req.query;
        const params = [];

        let sql = `
            SELECT eh.job_title, COUNT(*) AS count
            FROM employment_history eh
            JOIN users u ON eh.user_id = u.id
        `;

        if (programme || graduationYear) {
            sql += ` JOIN degrees d ON d.user_id = u.id`;
        }

        sql += ` WHERE eh.job_title IS NOT NULL`;

        if (programme) {
            sql += ` AND d.degree_name LIKE ?`;
            params.push(`%${programme}%`);
        }

        if (graduationYear) {
            sql += ` AND YEAR(d.completion_date) = ?`;
            params.push(graduationYear);
        }

        sql += ` GROUP BY eh.job_title ORDER BY count DESC`;

        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLocationDistribution = async function (req, res) {
    try {
        const { programme, graduationYear } = req.query;
        const params = [];

        let sql = `
            SELECT eh.location, COUNT(*) AS count
            FROM employment_history eh
            JOIN users u ON eh.user_id = u.id
        `;

        if (programme || graduationYear) {
            sql += ` JOIN degrees d ON d.user_id = u.id`;
        }

        sql += ` WHERE eh.location IS NOT NULL`;

        if (programme) {
            sql += ` AND d.degree_name LIKE ?`;
            params.push(`%${programme}%`);
        }

        if (graduationYear) {
            sql += ` AND YEAR(d.completion_date) = ?`;
            params.push(graduationYear);
        }

        sql += ` GROUP BY eh.location ORDER BY count DESC`;

        const [rows] = await db.query(sql, params);
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
            ORDER BY year ASC
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
        const { programme, graduationYear } = req.query;
        const params = [];

        let sql = `
            SELECT c.certification_name, COUNT(*) AS count
            FROM certifications c
            JOIN users u ON c.user_id = u.id
        `;

        if (programme || graduationYear) {
            sql += ` JOIN degrees d ON d.user_id = u.id`;
        }

        sql += ` WHERE c.certification_name IS NOT NULL`;

        if (programme) {
            sql += ` AND d.degree_name LIKE ?`;
            params.push(`%${programme}%`);
        }

        if (graduationYear) {
            sql += ` AND YEAR(d.completion_date) = ?`;
            params.push(graduationYear);
        }

        sql += ` GROUP BY c.certification_name ORDER BY count DESC`;

        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSkillsGap = async function (req, res) {
    try {
        const { programme, graduationYear } = req.query;
        const params = [];

        const buildFilter = (table, alias, joinAlias = 'd') => {
            let sql = `SELECT COUNT(*) AS count FROM ${table} ${alias} JOIN users u ON ${alias}.user_id = u.id`;

            if (programme || graduationYear) {
                sql += ` JOIN degrees ${joinAlias} ON ${joinAlias}.user_id = u.id`;
            }

            sql += ` WHERE 1=1`;

            if (programme) {
                sql += ` AND ${joinAlias}.degree_name LIKE ?`;
                params.push(`%${programme}%`);
            }

            if (graduationYear) {
                sql += ` AND YEAR(${joinAlias}.completion_date) = ?`;
                params.push(graduationYear);
            }

            return sql;
        };

        const [certs] = await db.query(buildFilter('certifications', 'c'), params.splice(0));
        const [courses] = await db.query(buildFilter('professional_courses', 'pc'), params.splice(0));
        const [licences] = await db.query(buildFilter('licences', 'l'), params.splice(0));
        const [degrees] = await db.query(buildFilter('degrees', 'deg', 'deg'), params.splice(0));

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