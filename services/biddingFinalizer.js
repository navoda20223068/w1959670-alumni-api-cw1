'use strict';

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

module.exports = {
    finalizeWinnerForDate
};