'use strict';

const express = require('express');
const router = express.Router();
const biddingController = require('../manual_controllers/bidding/index');

router.post('/place', biddingController.placeBid);
router.put('/increase/:id', biddingController.increaseBid);
router.get('/my-bids', biddingController.getMyBids);
router.get('/status/:date', biddingController.getMyBidStatusForDate);
router.post('/cancel/:id', biddingController.cancelBid);

module.exports = router;