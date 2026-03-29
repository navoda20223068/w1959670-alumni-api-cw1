'use strict';

const express = require('express');
const router = express.Router();
const biddingController = require('../manual_controllers/bidding/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

router.post('/place', authJwtMiddleware, biddingController.placeBid);
router.put('/increase/:id', authJwtMiddleware, biddingController.increaseBid);
router.get('/my-bids', authJwtMiddleware, biddingController.getMyBids);
router.get('/status/:date', authJwtMiddleware, biddingController.getMyBidStatusForDate);
router.post('/cancel/:id', authJwtMiddleware, biddingController.cancelBid);

module.exports = router;