'use strict';

const db = require('../../db');

async function updateProfileCompletionStatus(userId) {
    const [profiles] = await db.query(
        `SELECT first_name, last_name, biography, linkedin_url, profile_image_path
     FROM profiles
     WHERE user_id = ?
     LIMIT 1`,
        [userId]
    );

    if (profiles.length === 0) {
        return 0;
    }

    const profile = profiles[0];

    const hasCoreFields =
        !!profile.first_name &&
        !!profile.last_name &&
        !!profile.biography &&
        !!profile.linkedin_url &&
        !!profile.profile_image_path;

    const [degreeRows] = await db.query(
        `SELECT COUNT(*) AS count FROM degrees WHERE user_id = ?`,
        [userId]
    );

    const [certRows] = await db.query(
        `SELECT COUNT(*) AS count FROM certifications WHERE user_id = ?`,
        [userId]
    );

    const [licenceRows] = await db.query(
        `SELECT COUNT(*) AS count FROM licences WHERE user_id = ?`,
        [userId]
    );

    const [courseRows] = await db.query(
        `SELECT COUNT(*) AS count FROM professional_courses WHERE user_id = ?`,
        [userId]
    );

    const [employmentRows] = await db.query(
        `SELECT COUNT(*) AS count FROM employment_history WHERE user_id = ?`,
        [userId]
    );

    const hasAtLeastOneProfessionalEntry =
        degreeRows[0].count > 0 ||
        certRows[0].count > 0 ||
        licenceRows[0].count > 0 ||
        courseRows[0].count > 0 ||
        employmentRows[0].count > 0;

    const completionStatus = hasCoreFields && hasAtLeastOneProfessionalEntry ? 1 : 0;

    await db.query(
        `UPDATE profiles
     SET completion_status = ?
     WHERE user_id = ?`,
        [completionStatus, userId]
    );

    return completionStatus;
}

module.exports = {
    updateProfileCompletionStatus
};