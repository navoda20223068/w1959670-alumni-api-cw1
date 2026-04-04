'use strict';

const express = require('express');
const router = express.Router();
const biddingController = require('../manual_controllers/bidding/index');
const authJwtMiddleware = require('../middleware/authJwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bidding
 *   description: Blind bidding system for selecting the Alumni of the Day
 *
 * components:
 *   schemas:
 *     PlaceBidRequest:
 *       type: object
 *       required:
 *         - bidDate
 *         - amount
 *       properties:
 *         bidDate:
 *           type: string
 *           format: date
 *           example: 2026-04-05
 *         amount:
 *           type: number
 *           example: 250
 *
 *     IncreaseBidRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           example: 300
 */

/**
 * @swagger
 * /bidding/place:
 *   post:
 *     summary: Place a blind bid for a specific date
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     description: Allows an alumnus to place a bid without seeing other bids. Only valid if profile is complete and monthly limits are not exceeded.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaceBidRequest'
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *       400:
 *         description: Invalid input or incomplete profile
 *       403:
 *         description: Monthly limit reached or no event bonus available
 *       409:
 *         description: Existing bid already exists for that date
 */
router.post('/place', authJwtMiddleware, biddingController.placeBid);

/**
 * @swagger
 * /bidding/increase/{id}:
 *   put:
 *     summary: Increase an existing bid
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     description: Allows a user to increase their bid amount. New amount must be greater than the existing bid.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncreaseBidRequest'
 *     responses:
 *       200:
 *         description: Bid increased successfully
 *       400:
 *         description: Invalid amount or bid cannot be modified
 *       404:
 *         description: Bid not found
 */
router.put('/increase/:id', authJwtMiddleware, biddingController.increaseBid);

/**
 * @swagger
 * /bidding/my-bids:
 *   get:
 *     summary: Get all bids of the logged-in user
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bids
 *       401:
 *         description: Authentication required
 */
router.get('/my-bids', authJwtMiddleware, biddingController.getMyBids);

/**
 * @swagger
 * /bidding/status/{date}:
 *   get:
 *     summary: Get the user's bid status for a specific date
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-04-05
 *     responses:
 *       200:
 *         description: Bid status returned
 *       404:
 *         description: No bid found for that date
 */
router.get('/status/:date', authJwtMiddleware, biddingController.getMyBidStatusForDate);

/**
 * @swagger
 * /bidding/cancel/{id}:
 *   post:
 *     summary: Cancel an existing bid
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 15
 *     responses:
 *       200:
 *         description: Bid cancelled successfully
 *       400:
 *         description: Cannot cancel finalized or already cancelled bid
 *       404:
 *         description: Bid not found
 */
router.post('/cancel/:id', authJwtMiddleware, biddingController.cancelBid);

/**
 * @swagger
 * /bidding/finalize/{date}:
 *   post:
 *     summary: Finalize the winning bid for a specific date (Admin only)
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     description: Only accessible to admin users. Applies monthly limits and event bonus rules before selecting the winner.
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-04-05
 *     responses:
 *       200:
 *         description: Winner finalized successfully
 *       403:
 *         description: Admin access required or business rule violation
 *       404:
 *         description: No bids found for this date
 *       409:
 *         description: Winner already finalized
 */
router.post('/finalize/:date', authJwtMiddleware, biddingController.finalizeWinner);

module.exports = router;