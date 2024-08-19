const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");
const sessionDepositMiddleware = require("../middlewares/sessionDeposit");
/**
 * @swagger
 * tags:
 *   - name: Sessions
 *     description: 세션 관련 작업
 */

// 세션 생성
router.post('/createSession', authenticateToken, adminMiddleware, sessionController.createSession);
/**
 * @swagger
 * /api/session/createSession:
 *   post:
 *     summary: 새로운 세션 생성
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 세션이 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */

// 모든 세션 조회 (유저 인증 필요)
router.get('/sessions', authenticateToken, sessionController.getAllSessions);
/**
 * @swagger
 * /api/session/sessions:
 *   get:
 *     summary: 모든 세션 조회
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 모든 세션 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       500:
 *         description: 세션 조회 중 오류 발생
 */

// 특정 세션 조회 (모든 유저의 출석 포함, 어드민 인증 필요)
router.get('/sessions/:id', authenticateToken, adminMiddleware, sessionController.getSessionById);
/**
 * @swagger
 * /api/session/sessions/{id}:
 *   get:
 *     summary: 특정 세션 조회 (모든 유저의 출석 포함)
 *     tags: [Sessions]
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
 *       200:
 *         description: 세션에 대한 자세한 정보와 출석 기록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *                 attends:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attend'
 *       404:
 *         description: 세션을 찾을 수 없음
 *       500:
 *         description: 세션 조회 중 오류 발생
 */

// 세션 삭제 (어드민 인증 필요)
router.delete('/deleteSession/:sessionId', authenticateToken, adminMiddleware, sessionController.deleteSession);
/**
 * @swagger
 * /api/session/deleteSession/{sessionId}:
 *   delete:
 *     summary: 세션 삭제
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           description: 세션 ID
 *     responses:
 *       200:
 *         description: 세션이 성공적으로 삭제됨
 *       404:
 *         description: 세션을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 구글 드라이브 코드
router.get('/attendance/spreadsheets', authenticateToken, adminMiddleware, sessionController.spreadsheets);
/**
 * @swagger
 * /api/session/attendance/spreadsheets:
 *   get:
 *     summary: Record attendance data to Google Sheets
 *     description: Records attendance data to a specified Google Spreadsheet. Requires authentication and admin privileges.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance recorded successfully
 *       500:
 *         description: Error recording attendance
 */

// 특정 세션의 출석 정보를 Google 스프레드시트로 내보내기
router.post('/sessions/:id/spreadsheets', authenticateToken, adminMiddleware, sessionController.sessionToSpreadsheet);
/**
 * @swagger
 * /api/session/sessions/{id}/spreadsheets:
 *   post:
 *     summary: 특정 세션의 출석 정보를 Google 스프레드시트로 내보냅니다
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 성공적으로 출석 데이터를 내보냈습니다
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 출석 데이터를 내보내는 중 오류가 발생했습니다
 */

// 첫 번째 세션의 출석 정보를 Google 스프레드시트로 내보내기
router.post('/sessions/:id/spreadsheets/1', authenticateToken, adminMiddleware, sessionController.firstSessionToSpreadsheet);
/**
 * @swagger
 * /api/session/sessions/{id}/spreadsheets/1:
 *   post:
 *     summary: 첫 번째 세션의 출석 정보를 Google 스프레드시트로 내보냅니다
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 성공적으로 출석 데이터를 내보냈습니다
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 출석 데이터를 내보내는 중 오류가 발생했습니다
 */

// 두 번째 세션의 출석 정보를 Google 스프레드시트로 내보내기
router.post('/sessions/:id/spreadsheets/2', authenticateToken, adminMiddleware, sessionController.secondSessionToSpreadsheet);
/**
 * @swagger
 * /api/session/sessions/{id}/spreadsheets/2:
 *   post:
 *     summary: 두 번째 세션의 출석 정보를 Google 스프레드시트로 내보냅니다
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 성공적으로 출석 데이터를 내보냈습니다
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 출석 데이터를 내보내는 중 오류가 발생했습니다
 */

// 세 번째 세션의 출석 정보를 Google 스프레드시트로 내보내기
router.post('/sessions/:id/spreadsheets/3', authenticateToken, adminMiddleware, sessionController.thirdSessionToSpreadsheet);
/**
 * @swagger
 * /api/session/sessions/{id}/spreadsheets/3:
 *   post:
 *     summary: 세 번째 세션의 출석 정보를 Google 스프레드시트로 내보냅니다
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 성공적으로 출석 데이터를 내보냈습니다
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 출석 데이터를 내보내는 중 오류가 발생했습니다
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
 *         session:
 *           type: string
 *           description: 세션 ID 참조
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
