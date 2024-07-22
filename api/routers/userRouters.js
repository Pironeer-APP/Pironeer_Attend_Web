const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authentication');
const emailConfig = require('../../config/email');
const adminMiddleware = require("../middlewares/admin");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: 유저 관련 작업
 *   - name: Admin
 *     description: 관리자 관련 작업
 */

// 회원 가입
router.post("/signup", userController.createUser);
/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: 유저 회원가입
 *     description: 새로운 사용자를 생성합니다. 비밀번호는 암호화되어 저장됩니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자의 아이디
 *               password:
 *                 type: string
 *                 description: 사용자의 비밀번호
 *               email:
 *                 type: string
 *                 description: 사용자의 이메일
 *             example:
 *               username: "[유저 이름]"
 *               password: "[비밀번호]"
 *               email: "[이메일]"
 *     responses:
 *       201:
 *         description: 사용자 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *               example:
 *                 message: "User created successfully"
 *                 user: 
 *                   username: "[유저 이름]"
 *                   password: "[암호화 된 비밀번호]"
 *                   email: "[이메일]"
 *                   isAdmin: false
 *                   _id: "669c04b76fdd1c09d3c1b565"
 *                   __v: 0
 *       400:
 *         description: 요청 데이터 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error creating user"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 *             example:
 *               message: "Error creating user"
 *               error: "Error details"
 */

// 로그인
router.post("/login", userController.login);
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: 유저 로그인
 *     description: 사용자 로그인을 처리합니다. 성공 시 JWT 토큰 반환.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자의 아이디
 *               password:
 *                 type: string
 *                 description: 사용자의 비밀번호
 *             example:
 *               username: "[유저 이름]"
 *               password: "[유저 비밀번호]"
 *     responses:
 *       200:
 *         description: 로그인 성공, 토큰 발급
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successfully"
 *                 token:
 *                   type: string
 *                   description: 인증 토큰
 *                   example: "[jwt토큰]"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *               example:
 *                 message: "Login successfully"
 *                 token: "[jwt토큰]"
 *                 user:
 *                   _id: "669c04b76fdd1c09d3c1b565"
 *                   username: "[유저 이름]"
 *                   password: "[유저 비밀번호]"
 *                   email: "[이메일]"
 *                   isAdmin: false
 *                   __v: 0
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 유저가 없습니다, 비밀번호 틀림"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

// 모든 유저 정보
router.get("/users", authenticateToken, adminMiddleware, userController.getAllUsers);
/**
 * @swagger
 * /api/user/users:
 *   get:
 *     summary: 모든 유저 조회
 *     description: 모든 사용자의 정보를 조회합니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 모든 사용자 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 */

// 특정 유저
router.get("/users/:id", authenticateToken, userController.getUserById);
/**
 * @swagger
 * /api/user/users/{id}:
 *   get:
 *     summary: 특정 유저 조회
 *     description: ID로 특정 사용자의 정보를 조회합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 사용자의 ID
 *     responses:
 *       200:
 *         description: 사용자 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 */

// 유저 수정
router.put("/users/:id", authenticateToken, userController.updateUser);
/**
 * @swagger
 * /api/user/users/{id}:
 *   put:
 *     summary: 유저 정보 업데이트
 *     description: ID로 특정 사용자의 정보를 업데이트합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 업데이트할 사용자의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 업데이트할 사용자의 새 아이디
 *               email:
 *                 type: string
 *                 description: 업데이트할 사용자의 새 이메일
 *               password:
 *                 type: string
 *                 description: 업데이트할 사용자의 새 비밀번호
 *     responses:
 *       200:
 *         description: 사용자 업데이트 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 */

// 유저 삭제
router.delete("/users/:id", authenticateToken, userController.deleteUser);
/**
 * @swagger
 * /api/user/users/{id}:
 *   delete:
 *     summary: 유저 삭제
 *     description: ID로 특정 사용자를 삭제합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 사용자의 ID
 *     responses:
 *       200:
 *         description: 사용자 삭제 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 유저 -> 관리자
router.put("/users/:id/admin", authenticateToken, adminMiddleware, userController.updateUserToAdmin);
/**
 * @swagger
 * /api/user/users/{id}/admin:
 *   put:
 *     summary: 유저를 관리자 권한으로 업데이트
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 업데이트할 사용자의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 사용자 관리자 권한 업데이트 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 특정 유저의 출석 정보 변경
router.put("/users/:id/attendance", authenticateToken, adminMiddleware, userController.updateUserAttendance);
/**
 * @swagger
 * /api/user/users/{id}/attendance:
 *   put:
 *     summary: 특정 유저의 출석 정보를 변경
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 업데이트할 사용자의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: "사용자의 ID"
 *               sessionId:
 *                 type: string
 *                 description: "세션 ID"
 *               attendIdx:
 *                 type: number
 *                 description: "출석 인덱스"
 *               status:
 *                 type: boolean
 *                 description: "새로운 출석 상태 (true 또는 false)"
 *     responses:
 *       200:
 *         description: 출석 정보 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "출석 정보 업데이트 성공"
 *                 attendance:
 *                   type: object
 *                   description: 업데이트된 출석 문서
 *       404:
 *         description: 출석 정보를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "출석 정보를 찾을 수 없음"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 *                 error:
 *                   type: string
 *                   example: "오류 세부 정보"
 */

// 인증 이메일 전송
router.post('/signup/send', emailConfig.sendEmail);
/**
 * @swagger
 * /api/user/signup/send:
 *   post:
 *     summary: 인증 이메일 전송
 *     description: 사용자가 회원가입 시 입력한 이메일 주소로 인증 이메일을 전송합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: 인증 이메일을 받을 사용자의 이메일 주소
 *     responses:
 *       200:
 *         description: 이메일 전송 성공
 *       400:
 *         description: 이메일 형식 오류 또는 필수 정보 누락
 *       500:
 *         description: 서버 오류
 */

// 코드 인증
router.post('/signup/cert', emailConfig.certEmail);
/**
 * @swagger
 * /api/user/signup/cert:
 *   post:
 *     summary: 이메일로 받은 코드 인증
 *     description: 사용자가 이메일로 받은 인증 코드를 제출하여 인증 절차를 완료합니다.
 *     tags: [Users]
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
 *                 description: 이용자가 입력한 코드
 *     responses:
 *       200:
 *         description: 코드 인증 성공
 *       400:
 *         description: 잘못된 코드
 *       500:
 *         description: 서버 오류
 */

// 출석 정보 확인
router.get('/checkAttendance/:id', authenticateToken, userController.ShowCheckAttendance);
/**
 * @swagger
 * /api/user/checkAttendance/{id}:
 *   get:
 *     summary: 특정 유저의 출석 정보 확인
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 사용자의 ID
 *     responses:
 *       200:
 *         description: 출석 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "출석 정보 반환 성공"
 *                 attend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user:
 *                         type: string
 *                       session:
 *                         type: string
 *                       attendList:
 *                         type: array
 *                         items: 
 *                           type: object
 *                           properties:   
 *                             _id: 
 *                               type: string
 *                             attendIdx:
 *                               type: string
 *                             status: 
 *                               type: boolean
 *                 session_name:
 *                   type: string
 *                 session_date:
 *                   type: string 
 *                 absent:
 *                   type: integer
 *       404:
 *         description: 출석 정보를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 유저네임을 Google Sheets로 기록
router.post('/users/spreadsheets', authenticateToken, adminMiddleware, userController.spreadsheets);
/**
 * @swagger
 * /api/user/users/spreadsheets:
 *   post:
 *     summary: 유저네임을 Google Sheets로 기록
 *     description: 모든 유저의 유저네임을 검색하여 지정된 Google 스프레드시트에 기록합니다. 인증 및 관리자 권한이 필요합니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 유저네임 기록 성공
 *       500:
 *         description: 유저네임 기록 중 오류 발생
 */

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 유저의 고유 식별자
 *         username:
 *           type: string
 *           description: 유저의 이름
 *         email:
 *           type: string
 *           description: 유저의 이메일
 *         password:
 *           type: string
 *           description: 유저의 비밀번호
 */
