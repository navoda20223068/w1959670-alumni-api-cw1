'use strict';

const express = require('express');
const router = express.Router();
const { analyticsGet } = require('../services/apiClient');
const db = require('../db');

// Dashboard page
router.get('/dashboard', async (req, res) => {
    try {
        const [
            industryData,
            topEmployers,
            jobTitles,
            locations,
            graduationYears,
            programmes,
            certifications,
            skillsGap
        ] = await Promise.all([
            analyticsGet('/analytics/industry-distribution'),
            analyticsGet('/analytics/top-employers'),
            analyticsGet('/analytics/job-titles'),
            analyticsGet('/analytics/locations'),
            analyticsGet('/analytics/graduation-years'),
            analyticsGet('/analytics/programmes'),
            analyticsGet('/analytics/certification-trends'),
            analyticsGet('/analytics/skills-gap')
        ]);

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
        console.error('Dashboard error:', err);
        res.status(500).send('Error loading dashboard');
    }
});

router.get('/alumni', async (req, res) => {
    try {
        const { programme, graduationYear, industry } = req.query;

        const params = new URLSearchParams();
        if (programme) params.append('programme', programme);
        if (graduationYear) params.append('graduationYear', graduationYear);
        if (industry) params.append('industry', industry);

        const queryString = params.toString();
        const path = `/api/alumni${queryString ? '?' + queryString : ''}`;

        const result = await analyticsGet(path);
        const alumni = result.alumni ?? result;

        res.render('alumni', {
            alumni,
            filters: {
                programme: programme || '',
                graduationYear: graduationYear || '',
                industry: industry || ''
            }
        });

    } catch (err) {
        console.error('Alumni page error:', err);
        res.status(500).send('Error loading alumni page');
    }
});

module.exports = router;