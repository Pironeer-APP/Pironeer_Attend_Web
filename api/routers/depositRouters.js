const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require('../middlewares/admin');
const depositController = require('../controllers/depositController');

//보증금 페이지 접속
router.get('/:userId', authenticateToken, depositController.checkDeposit);

//보증금 내역 수정
router.put('/:userId/update/:deductionIdx', authenticateToken, adminMiddleware, depositController.updateDeposit);

//보증금 방어권 사용
router.post('/:userId/defend/use', authenticateToken, depositController.useDefend);


//보증금 방어권 삭제
router.post('/:userId/defend/delete', authenticateToken,adminMiddleware, depositController.dependDelete);

//보증금 방어권 추가
router.post('/:userId/defend/add', authenticateToken,adminMiddleware, depositController.dependAdd);

//보증금 새로고침 (모든 유저)
// router.post('/:userId/reload/all', authenticateToken,adminMiddleware, depositController.depositReloadAll);

//과제 정보 입력
//router.post('/assignment/insert', authenticateToken,adminMiddleware, depositController.AssignmentInsert);

// 과제 정보 수정(과제 리스트 수정)
//router.post('/:userId/assignment/update', authenticateToken,adminMiddleware, depositController.AssignmentUpdate);


// 보증금 재계산 (모든 유저)
router.post('/recalculate', authenticateToken, adminMiddleware, depositController.recalculateDeposits);
module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Deposits
 *     description: 보증금 관련 작업
 */

/**
 * @swagger
 * /api/deposit/recalculate:
 *   post:
 *     summary: Recalculate deposits for all users
 *     tags: [Deposits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposits successfully recalculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "모든 유저의 보증금이 성공적으로 재계산되었습니다."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "보증금을 재계산하는 도중 오류가 발생했습니다."
 *                 error:
 *                   type: object
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
 * /api/deposit/{userId}/update/{deductionIdx}:
 *   put:
 *     summary: Update deposit deduction details
 *     tags: [Deposits]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: path
 *         name: deductionIdx
 *         required: true
 *         schema:
 *           type: integer
 *         description: The deduction index
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Deduction details to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deductedAmount:
 *                 type: number
 *                 example: -10000
 *               deductionDetail:
 *                 type: string
 *                 example: Updated deduction detail
 *             required:
 *               - deductedAmount
 *               - deductionDetail
 *     responses:
 *       200:
 *         description: Deduction successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "차감 내역이 성공적으로 수정되었습니다"
 *                 deductionList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deductionIdx:
 *                         type: integer
 *                       deductionDate:
 *                         type: string
 *                         format: date-time
 *                       deductedAmount:
 *                         type: number
 *                       deductionDetail:
 *                         type: string
 *       400:
 *         description: Invalid request or resource not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "존재하지 않는 사용자입니다."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "차감 내역을 수정하는 도중 오류가 발생했습니다."
 *                 error:
 *                   type: object
 *
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
 *     security:
 *       - bearerAuth: []
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
 */
