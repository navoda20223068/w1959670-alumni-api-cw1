'use strict';

const cron = require('node-cron');
const { finalizeWinnerForDate } = require('../services/biddingFinalizer');

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
            console.log(`Winner finalized automatically for ${bidDate}`);
        } catch (err) {
            if (
                err.message === 'Winner already finalized for this date' ||
                err.message === 'No bids found for this date'
            ) {
                console.log(`Scheduler skipped for ${new Date().toISOString().split('T')[0]}: ${err.message}`);
                return;
            }

            console.error('Bidding scheduler error:', err);
        }
    });
}

module.exports = {
    startBiddingScheduler
};