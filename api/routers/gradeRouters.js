const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");

//특정 유저의 과제 점수 수정
router.put('/updateScore/:assignmentId/:userId', authenticateToken, adminMiddleware, gradeController.updateScore);

//특정 유저의 모든 채점 결과 조회
router.get('/getScore/:userId', authenticateToken, gradeController.getScore);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Grade
 *   description: 과제 채점, 관리
 */

/**
 * @swagger
 * /api/assignment/updateScore/{assignmentId}/{userId}:
 *   put:
 *     summary: 특정 유저의 과제 점수 수정
 *     tags: [Grade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           description: 과제 ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           description: 유저 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 description: 새로운 점수
 *     responses:
 *       200:
 *         description: 점수가 성공적으로 업데이트됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 score:
 *                   type: number
 *                 userId:
 *                   type: string
 *                 assignmentId:
 *                   type: string
 *       404:
 *         description: 점수를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/assignment/getScore/{userId}:
 *   get:
 *     summary: 특정 유저의 모든 채점 결과 조회
 *     tags: [Grade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           description: 유저 ID
 *     responses:
 *       200:
 *         description: 채점 결과를 성공적으로 조회함
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 grades:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       assignment:
 *                         type: string
 *                       assignmentName:
 *                         type: string
 *                       assignmentDate:
 *                         type: string
 *                         format: date
 *                       deduction:
 *                         type: number
 *       404:
 *         description: 채점 결과를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */