const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require('../middlewares/admin');
const depositController = require('../controllers/depositController');

//보증금 페이지 접속
router.get('/:userId', authenticateToken, depositController.checkDeposit);

//보증금 방어권 사용
router.post('/:userId/defend/use', authenticateToken, depositController.useDefend);

//보증금 새로고침
router.post('/:userId/reload', authenticateToken, depositController.depositReload);

module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Deposits
 *     description: 보증금 관련 작업
 */

/**
 * @swagger
 * /api/deposit/{userId}:
 *   get:
 *     summary: Get deposit information
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The deposit information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deposit:
 *                   type: number
 *                   description: The deposit amount

 * /api/deposit/{userId}/defend/use:
 *   post:
 *     summary: 보증금 방어권을 사용합니다.
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Defend used successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message

 * /api/deposit/{userId}/reload:
 *   post:
 *     summary: 보증금 내역을 reload 합니다.
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Deposit reloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 */