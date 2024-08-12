const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");
const assignmentMiddleware = require("../middlewares/assignment");

//과제 생성
router.post('/createAssignment', authenticateToken, adminMiddleware, assignmentController.createAssignment,assignmentMiddleware);

//모든 과제 조회
router.get('/assignments', authenticateToken, adminMiddleware, assignmentController.getAllAssignments);

//특정 과제 조회 + 해당 과제의 모든 채점 결과도 조회
router.get('/assignments/:assignmentId', authenticateToken, adminMiddleware, assignmentController.getAssignmentById);

//과제 삭제
router.delete('/deleteAssignment/:assignmentId', authenticateToken, adminMiddleware, assignmentController.deleteAssignment);

module.exports = router;

/**
 * @swagger
 * /api/assignment/createAssignment:
 *   post:
 *     summary: 과제 생성
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 과제의 이름
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 과제의 날짜
 *               xList:
 *                 type: string
 *                 description: 과제 안한사람 이름
 *               triList:
 *                 type: string
 *                 description: 과제 덜한사람 이름
 *     responses:
 *       201:
 *         description: 과제가 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 assignment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *       400:
 *         description: 과제 이름 또는 날짜가 누락됨
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/assignment/assignments:
 *   get:
 *     summary: 모든 과제 조회
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 모든 과제를 성공적으로 조회함
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/assignment/assignments/{assignmentId}:
 *   get:
 *     summary: 특정 과제 조회 및 채점 결과 조회
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           description: 과제 ID
 *     responses:
 *       200:
 *         description: 과제와 채점 결과를 성공적으로 조회함
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
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
 *         description: 과제를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/assignment/deleteAssignment/{assignmentId}:
 *   delete:
 *     summary: 특정 과제 삭제
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           description: 과제 ID
 *     responses:
 *       200:
 *         description: 과제가 성공적으로 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: 과제 ID가 제공되지 않음
 *       404:
 *         description: 과제를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */