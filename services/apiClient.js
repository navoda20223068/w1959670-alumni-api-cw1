'use strict';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.DASHBOARD_API_KEY;

async function analyticsGet(path) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
            Authorization: `Bearer ${API_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${path} — ${response.status}`);
    }

    const json = await response.json();
    return json.data ?? json;
}

module.exports = { analyticsGet };