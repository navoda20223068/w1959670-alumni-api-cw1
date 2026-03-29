'use strict';

const db = require('../../db');

async function finalizeWinnerForDate(bidDate) {
    const [alreadyFinalized] = await db.query(
        `SELECT id
         FROM appearance_history
         WHERE featured_date = ?
         LIMIT 1`,
        [bidDate]
    );

    if (alreadyFinalized.length > 0) {
        throw new Error('Winner already finalized for this date');
    }

    const [topBidRows] = await db.query(
        `SELECT id, user_id, amount
         FROM bids
         WHERE bid_date = ?
           AND status != 'cancelled'
         ORDER BY amount DESC, created_at ASC
         LIMIT 1`,
        [bidDate]
    );

    if (topBidRows.length === 0) {
        throw new Error('No bids found for this date');
    }

    const winningBid = topBidRows[0];

    const [winCountRows] = await db.query(
        `SELECT COUNT(*) AS winCount
         FROM appearance_history
         WHERE user_id = ?
           AND MONTH(featured_date) = MONTH(?)
           AND YEAR(featured_date) = YEAR(?)`,
        [winningBid.user_id, bidDate, bidDate]
    );

    const currentWinCount = Number(winCountRows[0].winCount);
    let eventBonusUsed = 0;

    if (currentWinCount >= 3) {
        const [bonusRows] = await db.query(
            `SELECT id
             FROM alumni_event_bonus
             WHERE user_id = ?
               AND event_month = MONTH(?)
               AND event_year = YEAR(?)
               AND bonus_granted = 1
               AND bonus_used = 0
             LIMIT 1`,
            [winningBid.user_id, bidDate, bidDate]
        );

        if (bonusRows.length === 0) {
            throw new Error('Winner exceeds monthly limit and has no event bonus');
        }

        eventBonusUsed = 1;

        await db.query(
            `UPDATE alumni_event_bonus
             SET bonus_used = 1
             WHERE id = ?`,
            [bonusRows[0].id]
        );
    }

    await db.query(
        `UPDATE bids
         SET status = 'won'
         WHERE id = ?`,
        [winningBid.id]
    );

    await db.query(
        `UPDATE bids
         SET status = 'lost'
         WHERE bid_date = ?
           AND id != ?
           AND status != 'cancelled'`,
        [bidDate, winningBid.id]
    );

    await db.query(
        `INSERT INTO appearance_history (user_id, featured_date, won_by_bid_id, event_bonus_used)
         VALUES (?, ?, ?, ?)`,
        [winningBid.user_id, bidDate, winningBid.id, eventBonusUsed]
    );

    return winningBid;
}

exports.placeBid = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const inputDate = new Date(bidDate);

        if (isNaN(inputDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid bidDate format'
            });
        }

        if (inputDate < today) {
            return res.status(400).json({
                error: 'Cannot bid for past dates'
            });
        }

        const [profiles] = await db.query(
            `SELECT completion_status
             FROM profiles
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (profiles.length === 0) {
            return res.status(400).json({
                error: 'Create your profile before bidding'
            });
        }

        if (!profiles[0].completion_status) {
            return res.status(400).json({
                error: 'Complete your profile before bidding'
            });
        }

        const [winCountRows] = await db.query(
            `SELECT COUNT(*) AS winCount
             FROM appearance_history
             WHERE user_id = ?
               AND MONTH(featured_date) = MONTH(?)
               AND YEAR(featured_date) = YEAR(?)`,
            [userId, bidDate, bidDate]
        );

        const winCount = Number(winCountRows[0].winCount);

        if (winCount >= 4) {
            return res.status(403).json({
                error: 'Monthly win limit reached (max 4)'
            });
        }

        if (winCount === 3) {
            const [bonusRows] = await db.query(
                `SELECT id
                 FROM alumni_event_bonus
                 WHERE user_id = ?
                   AND event_month = MONTH(?)
                   AND event_year = YEAR(?)
                   AND bonus_granted = 1
                   AND bonus_used = 0
                 LIMIT 1`,
                [userId, bidDate, bidDate]
            );

            if (bonusRows.length === 0) {
                return res.status(403).json({
                    error: 'Monthly limit reached (no event bonus available)'
                });
            }
        }

        const [existingBid] = await db.query(
            `SELECT id
             FROM bids
             WHERE user_id = ? AND bid_date = ?
             LIMIT 1`,
            [userId, bidDate]
        );

        if (existingBid.length > 0) {
            return res.status(409).json({
                error: 'You already have a bid for this date. Use increase endpoint.'
            });
        }

        const [result] = await db.query(
            `INSERT INTO bids (user_id, bid_date, amount, status)
             VALUES (?, ?, ?, 'losing')`,
            [userId, bidDate, numericAmount]
        );

        const bidId = result.insertId;

        await db.query(
            `UPDATE bids
             SET status = 'losing'
             WHERE bid_date = ?
               AND status != 'cancelled'
               AND status NOT IN ('won', 'lost')`,
            [bidDate]
        );

        const [topBidRows] = await db.query(
            `SELECT id
             FROM bids
             WHERE bid_date = ?
               AND status != 'cancelled'
               AND status NOT IN ('won', 'lost')
             ORDER BY amount DESC, created_at ASC
             LIMIT 1`,
            [bidDate]
        );

        let myStatus = 'losing';

        if (topBidRows.length > 0) {
            await db.query(
                `UPDATE bids
                 SET status = 'winning'
                 WHERE id = ?`,
                [topBidRows[0].id]
            );

            if (Number(topBidRows[0].id) === Number(bidId)) {
                myStatus = 'winning';
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Bid placed successfully',
            bidId,
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
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const bidId = req.params.id;
        const { amount } = req.body;

        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        const [rows] = await db.query(
            `SELECT id, user_id, bid_date, amount, status
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

        if (bid.status === 'cancelled' || bid.status === 'won' || bid.status === 'lost') {
            return res.status(400).json({
                error: 'This bid cannot be increased'
            });
        }

        if (numericAmount <= Number(bid.amount)) {
            return res.status(400).json({
                error: 'New amount must be greater than your current bid'
            });
        }

        await db.query(
            `UPDATE bids
             SET amount = ?
             WHERE id = ?`,
            [numericAmount, bidId]
        );

        await db.query(
            `UPDATE bids
             SET status = 'losing'
             WHERE bid_date = ?
               AND status != 'cancelled'
               AND status NOT IN ('won', 'lost')`,
            [bid.bid_date]
        );

        const [topBidRows] = await db.query(
            `SELECT id
             FROM bids
             WHERE bid_date = ?
               AND status != 'cancelled'
               AND status NOT IN ('won', 'lost')
             ORDER BY amount DESC, created_at ASC
             LIMIT 1`,
            [bid.bid_date]
        );

        let myStatus = 'losing';

        if (topBidRows.length > 0) {
            await db.query(
                `UPDATE bids
                 SET status = 'winning'
                 WHERE id = ?`,
                [topBidRows[0].id]
            );

            if (Number(topBidRows[0].id) === Number(bidId)) {
                myStatus = 'winning';
            }
        }

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
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;

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
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const bidDate = req.params.date;

        const [rows] = await db.query(
            `SELECT id, bid_date, status
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

exports.finalizeWinner = async function (req, res) {
    try {
        const bidDate = req.params.date;

        const winningBid = await finalizeWinnerForDate(bidDate);

        return res.json({
            success: true,
            message: 'Winner finalized',
            winningBid: winningBid
        });

    } catch (err) {
        console.error('Finalize winner error:', err);

        if (err.message === 'No bids found for this date') {
            return res.status(404).json({ error: err.message });
        }

        if (err.message === 'Winner already finalized for this date') {
            return res.status(409).json({ error: err.message });
        }

        if (err.message === 'Winner exceeds monthly limit and has no event bonus') {
            return res.status(403).json({ error: err.message });
        }

        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.cancelBid = async function (req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const bidId = req.params.id;

        const [rows] = await db.query(
            `SELECT id, user_id, bid_date, status
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

        if (bid.status === 'won' || bid.status === 'lost') {
            return res.status(400).json({
                error: 'Finalized bids cannot be cancelled'
            });
        }

        if (bid.status === 'cancelled') {
            return res.status(400).json({
                error: 'Bid is already cancelled'
            });
        }

        await db.query(
            `UPDATE bids
             SET status = 'cancelled'
             WHERE id = ?`,
            [bidId]
        );

        await db.query(
            `UPDATE bids
             SET status = 'losing'
             WHERE bid_date = ?
               AND status NOT IN ('won', 'lost', 'cancelled')`,
            [bid.bid_date]
        );

        const [topBidRows] = await db.query(
            `SELECT id
             FROM bids
             WHERE bid_date = ?
               AND status NOT IN ('won', 'lost', 'cancelled')
             ORDER BY amount DESC, created_at ASC
             LIMIT 1`,
            [bid.bid_date]
        );

        if (topBidRows.length > 0) {
            await db.query(
                `UPDATE bids
                 SET status = 'winning'
                 WHERE id = ?`,
                [topBidRows[0].id]
            );
        }

        return res.json({
            success: true,
            message: 'Bid cancelled successfully',
            bidId: Number(bidId)
        });

    } catch (err) {
        console.error('Cancel bid error:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};