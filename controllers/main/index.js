'use strict';

const db = require('../../db');

exports.index = async function (req, res) {
  try {
    const [rows] = await db.query('SELECT 1 AS test');

    res.json({
      success: true,
      message: 'API + DB working',
      db: rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};