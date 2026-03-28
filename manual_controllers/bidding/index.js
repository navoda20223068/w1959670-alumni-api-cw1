'use strict';

const db = require('../../db');

exports.placeBid = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;
        const { bidDate, amount } = req.body;

        if (!bidDate || amount === undefined || amount === null) {
            return res.status(400).json({
                error: 'bidDate and amount are required'
            });
        }

        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        // Make sure user has a profile first
        const [profiles] = await db.query(
            'SELECT id, completion_status FROM profiles WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (profiles.length === 0) {
            return res.status(400).json({
                error: 'Create your profile before bidding'
            });
        }

        // require completed profile before bidding
        if (!profiles[0].completion_status) {
            return res.status(400).json({
                error: 'Complete your profile before bidding'
            });
        }

        // One bid per user per date
        const [existingBid] = await db.query(
            'SELECT id FROM bids WHERE user_id = ? AND bid_date = ? LIMIT 1',
            [userId, bidDate]
        );

        if (existingBid.length > 0) {
            return res.status(409).json({
                error: 'You already have a bid for this date. Use the increase bid endpoint instead.'
            });
        }

        // Insert the bid first
        const [result] = await db.query(
            `INSERT INTO bids (user_id, bid_date, amount, status)
             VALUES (?, ?, ?, 'losing')`,
            [userId, bidDate, numericAmount]
        );

        const bidId = result.insertId;

        // Work out whether this new bid is currently winning
        const [topBidRows] = await db.query(
            `SELECT id, user_id, amount
             FROM bids
             WHERE bid_date = ?
             ORDER BY amount DESC, created_at ASC
             LIMIT 1`,
            [bidDate]
        );

        let myStatus = 'losing';

        if (topBidRows.length > 0 && topBidRows[0].id === bidId) {
            myStatus = 'winning';
        }

        await db.query(
            'UPDATE bids SET status = ? WHERE id = ?',
            [myStatus, bidId]
        );

        return res.status(201).json({
            success: true,
            message: 'Bid placed successfully',
            bidId: bidId,
            status: myStatus
        });

    } catch (err) {
        console.error('Place bid error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.increaseBid = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;
        const bidId = req.params.id;
        const { amount } = req.body;

        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        const [rows] = await db.query(
            `SELECT id, user_id, bid_date, amount
             FROM bids
             WHERE id = ? AND user_id = ?
             LIMIT 1`,
            [bidId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Bid not found'
            });
        }

        const bid = rows[0];

        if (numericAmount <= Number(bid.amount)) {
            return res.status(400).json({
                error: 'New amount must be greater than your current bid'
            });
        }

        await db.query(
            'UPDATE bids SET amount = ? WHERE id = ?',
            [numericAmount, bidId]
        );

        // Recalculate current top bid for that date
        const [topBidRows] = await db.query(
            `SELECT id
             FROM bids
             WHERE bid_date = ?
             ORDER BY amount DESC, created_at ASC
             LIMIT 1`,
            [bid.bid_date]
        );

        const myStatus =
            topBidRows.length > 0 && Number(topBidRows[0].id) === Number(bidId)
                ? 'winning'
                : 'losing';

        await db.query(
            'UPDATE bids SET status = ? WHERE id = ?',
            [myStatus, bidId]
        );

        return res.json({
            success: true,
            message: 'Bid increased successfully',
            bidId: Number(bidId),
            status: myStatus
        });

    } catch (err) {
        console.error('Increase bid error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getMyBids = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;

        const [rows] = await db.query(
            `SELECT id, bid_date, amount, status, created_at, updated_at
             FROM bids
             WHERE user_id = ?
             ORDER BY bid_date DESC, created_at DESC`,
            [userId]
        );

        return res.json({
            success: true,
            bids: rows
        });

    } catch (err) {
        console.error('Get my bids error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getMyBidStatusForDate = async function (req, res) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.session.user.id;
        const bidDate = req.params.date;

        const [rows] = await db.query(
            `SELECT id, bid_date, amount, status
             FROM bids
             WHERE user_id = ? AND bid_date = ?
             LIMIT 1`,
            [userId, bidDate]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'No bid found for that date'
            });
        }

        return res.json({
            success: true,
            bid: rows[0]
        });

    } catch (err) {
        console.error('Get bid status error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};