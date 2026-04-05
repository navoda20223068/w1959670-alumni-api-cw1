'use strict';

const db = require('../../db');

exports.getAlumniOfTheDay = async function (req, res) {
    try {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;

        const [rows] = await db.query(
            `SELECT u.id AS user_id,
                    p.first_name,
                    p.last_name,
                    p.biography,
                    p.linkedin_url,
                    p.profile_image_path
             FROM appearance_history ah
             INNER JOIN users u ON ah.user_id = u.id
             INNER JOIN profiles p ON p.user_id = u.id
             WHERE ah.featured_date = ?
             LIMIT 1`,
            [today]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'No featured alumnus for today'
            });
        }

        return res.json({
            success: true,
            alumnus: rows[0]
        });
    } catch (err) {
        console.error('Get alumni of the day error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};