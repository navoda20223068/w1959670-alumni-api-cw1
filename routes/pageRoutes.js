'use strict';

const express = require('express');
const router = express.Router();
const { analyticsGet } = require('../services/apiClient');
const db = require('../db');

// Dashboard page
router.get('/dashboard', async (req, res) => {
    try {
        const { programme, graduationYear } = req.query;
        const filters = { programme, graduationYear };

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
            analyticsGet('/analytics/industry-distribution', filters),
            analyticsGet('/analytics/top-employers', filters),
            analyticsGet('/analytics/job-titles', filters),
            analyticsGet('/analytics/locations', filters),
            analyticsGet('/analytics/graduation-years'),
            analyticsGet('/analytics/programmes'),
            analyticsGet('/analytics/certification-trends', filters),
            analyticsGet('/analytics/skills-gap', filters)
        ]);

        res.render('dashboard', {
            industryData,
            topEmployers,
            jobTitles,
            locations,
            graduationYears,
            programmes,
            certifications,
            skillsGap,
            filters: {
                programme: programme || '',
                graduationYear: graduationYear || ''
            }
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