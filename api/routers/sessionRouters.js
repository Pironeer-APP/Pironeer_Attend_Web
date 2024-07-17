const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");

/**
 * @swagger
 * tags:
 *   - name: Sessions
 *     description: 세션 관련 작업
 */

// 세션 생성
router.post('/createSession', authenticateToken,adminMiddleware, sessionController.createSession);

// 모든 세션 조회 (유저 인증 필요)
router.get('/sessions', authenticateToken, sessionController.getAllSessions);

// 특정 세션 조회 (모든 유저의 출석 포함, 어드민 인증 필요)
router.get('/sessions/:id',authenticateToken,adminMiddleware, sessionController.getSessionById);

// 세션 삭제 (어드민 인증 필요)
router.delete('/deleteSession/:sessionId', authenticateToken, adminMiddleware, sessionController.deleteSession);

// 구글 드라이브 코드
router.get('/attendance/spreadsheets', authenticateToken,adminMiddleware, sessionController.spreadsheets);
router.post('/sessions/:id/spreadsheets', authenticateToken,adminMiddleware,sessionController.sessionToSpreadsheet);
router.post('/sessions/:id/spreadsheets/1', authenticateToken,adminMiddleware,sessionController.firstSessionToSpreadsheet);
router.post('/sessions/:id/spreadsheets/2', authenticateToken,adminMiddleware,sessionController.secondSessionToSpreadsheet);
router.post('/sessions/:id/spreadsheets/3', authenticateToken,adminMiddleware,sessionController.thirdSessionToSpreadsheet);
module.exports = router;

/**
 * @swagger
 * /api/session/sessions/{id}/spreadsheets:
 *   post:
 *     summary: "특정 세션의 출석 정보를 Google 스프레드시트로 내보냅니다"
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "세션 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 출석 데이터를 내보냈습니다"
 *       404:
 *         description: "세션을 찾을 수 없습니다"
 *       500:
 *         description: "출석 데이터를 내보내는 중 오류가 발생했습니다"
 * 
 * /api/session/sessions/{id}/spreadsheets/1:
 *   post:
 *     summary: "특정 세션의 출석 정보를 Google 스프레드시트로 내보냅니다"
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "세션 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 출석 데이터를 내보냈습니다"
 *       404:
 *         description: "세션을 찾을 수 없습니다"
 *       500:
 *         description: "출석 데이터를 내보내는 중 오류가 발생했습니다"
 * 
 * /api/session/sessions/{id}/spreadsheets/2:
 *   post:
 *     summary: "특정 세션의 출석 정보를 Google 스프레드시트로 내보냅니다"
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "세션 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 출석 데이터를 내보냈습니다"
 *       404:
 *         description: "세션을 찾을 수 없습니다"
 *       500:
 *         description: "출석 데이터를 내보내는 중 오류가 발생했습니다"
 * 
 * /api/session/sessions/{id}/spreadsheets/3:
 *   post:
 *     summary: "특정 세션의 출석 정보를 Google 스프레드시트로 내보냅니다"
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "세션 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 출석 데이터를 내보냈습니다"
 *       404:
 *         description: "세션을 찾을 수 없습니다"
 *       500:
 *         description: "출석 데이터를 내보내는 중 오류가 발생했습니다"
 * 
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
 * 
 * /api/session/startAttendCheck/{id}:
 *   post:
 *     summary: 세션의 출석 체크 시작
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
 * 
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
 * 
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
 * 
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
 * 
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
 * 
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
 * 
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 세션을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 * 
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
 *         description: 출석 체크 중일 경우 즉시 응답.
 *                      진행 중이 아닐 경우 기다렸다가 시작시 이벤트 메세지 전송
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 data: {"message":"출석체크 진행중","token":{"attendIdx":123,"someOtherData":"example"},"isChecked":false}
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
 *
 * /api/session/attendance/spreadsheets:
 *   get:
 *     summary: Record attendance data to Google Sheets
 *     description: Records attendance data to a specified Google Spreadsheet. Requires authentication and admin privileges.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Attendance
 *     responses:
 *       200:
 *         description: Attendance recorded successfully
 *       500:
 *         description: Error recording attendance
 */

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
