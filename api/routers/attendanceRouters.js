const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");

/**
 * @swagger
 * tags:
 *   - name: Attendance
 *     description: 출석 관련 작업
 */

// 출석 체크 시작 (어드민 인증 필요)
router.post('/startAttendCheck/:id', authenticateToken, adminMiddleware, attendanceController.startAttendCheckBySession);
/**
 * @swagger
 * /api/session/startAttendCheck/{id}:
 *   post:
 *     summary: 세션의 출석 체크 시작
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: 세션 ID
 *     responses:
 *       201:
 *         description: 출석 체크가 성공적으로 시작됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                 attendIdx:
 *                   type: integer
 *       400:
 *         description: 출석 체크 시작 실패 또는 최대 체크 도달
 *       500:
 *         description: 서버 오류
 */

// 출석 체크 재시작
router.post('/restartAttendCheck/:sessionId/:attendIdx', authenticateToken, adminMiddleware, attendanceController.restartAttendCheckBySession);
/**
 * @swagger
 * /api/session/restartAttendCheck/{sessionId}/{attendIdx}:
 *   post:
 *     summary: 특정 인덱스에 대한 출석 체크 재시작
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           description: 세션 ID
 *       - in: path
 *         name: attendIdx
 *         required: true
 *         schema:
 *           type: integer
 *           description: 출석 체크 인덱스
 *     responses:
 *       201:
 *         description: 출석 체크가 재시작됨
 *       400:
 *         description: 출석 체크 재시작 실패
 *       500:
 *         description: 서버 오류
 */

// 출석체크 진행여부(polling)
router.get('/isCheck', attendanceController.isCheck);
/**
 * @swagger
 * /api/session/isCheck:
 *   get:
 *     summary: 출석 체크 진행 여부 확인
 *     tags: [Attendance]
 *     responses:
 *       200:
 *         description: 출석 체크가 진행 중임
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "출석 체크가 진행 중입니다."
 *       404:
 *         description: 출석 체크가 진행 중이 아님
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "출석 체크가 진행 중이 아닙니다."
 */

// 출석체크 진행여부(sse)
router.get('/isCheckAttend', authenticateToken, attendanceController.isCheckAttendSSE);
/**
 * @swagger
 * /api/session/isCheckAttend:
 *   get:
 *     summary: 출석 체크 진행 여부 확인 (SSE)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - text/event-stream
 *     responses:
 *       200:
 *         description: 출석 체크 중일 경우 메세지 전송 후 연결 종료. 진행 중이 아닐 경우 기다렸다가 시작시 이벤트 메세지 전송
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 data: {"message":"출석 체크 진행중","token":{"attendIdx":123,"someOtherData":"example"},"isChecked":false}
 *       404:
 *         description: 출석 체크가 진행 중이 아님
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "출석 체크가 진행 중이 아닙니다."
 *       500:
 *         description: 서버 오류
 */

// 출석 체크
router.post('/checkAttend/:userId', authenticateToken, attendanceController.checkAttend);
/**
 * @swagger
 * /api/session/checkAttend/{userId}:
 *   post:
 *     summary: 사용자 출석 체크
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: 출석 확인됨
 *       400:
 *         description: 잘못된 코드
 *       404:
 *         description: 출석 체크를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 출석 체크 조기 종료
router.delete('/endAttendCheck', authenticateToken, adminMiddleware, attendanceController.endAttendCheck);
/**
 * @swagger
 * /api/session/endAttendCheck:
 *   delete:
 *     summary: 출석 체크 조기 종료
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 출석 체크가 성공적으로 종료됨
 *       400:
 *         description: 출석 체크 종료 실패
 *       500:
 *         description: 서버 오류
 */

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 세션의 고유 식별자
 *         name:
 *           type: string
 *           description: 세션의 이름
 *         date:
 *           type: string
 *           format: date-time
 *           description: 세션의 날짜 및 시간
 *     Attend:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 출석 기록의 고유 식별자
 *         user:
 *           type: string
 *           description: 사용자 ID 참조
 *         userName:
 *           type: string
 *           description: 사용자 이름
 *         session:
 *           type: string
 *           description: 세션 ID 참조
 *         sessionName:
 *           type: string
 *           description: 세션 이름
 *         sessionDate:
 *           type: date
 *           description: 세션 날짜
 *         attendList:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               attendIdx:
 *                 type: integer
 *                 description: 세션 내의 출석 체크 인덱스
 *               status:
 *                 type: boolean
 *                 description: 출석 상태 (참석한 경우 true)
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
