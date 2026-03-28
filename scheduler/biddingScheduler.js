'use strict';

const cron = require('node-cron');
const db = require('../db');

async function finalizeWinnerForDate(bidDate) {
    const [alreadyFinalized] = await db.query(
        `SELECT id
         FROM appearance_history
         WHERE featured_date = ?
         LIMIT 1`,
        [bidDate]
    );

    if (alreadyFinalized.length > 0) {
        return;
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
        return;
    }

    const winningBid = topBidRows[0];

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
         VALUES (?, ?, ?, 0)`,
        [winningBid.user_id, bidDate, winningBid.id]
    );

    console.log(`Winner finalized automatically for ${bidDate}`);
}

function startBiddingScheduler() {
    // Every day at 00:05
    cron.schedule('5 0 * * *', async () => {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const bidDate = `${yyyy}-${mm}-${dd}`;

            await finalizeWinnerForDate(bidDate);
        } catch (err) {
            console.error('Bidding scheduler error:', err);
        }
    });
}

module.exports = {
    startBiddingScheduler
};