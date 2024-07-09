const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authentication');
const emailConfig = require('../../config/email');
const adminMiddleware = require("../middlewares/admin");

// 회원 가입
router.post("/signup", userController.createUser);
// 로그인
router.post("/login", userController.login);
// 모든 유저 정보
router.get("/users",authenticateToken,adminMiddleware, userController.getAllUsers);
// 특정 유저
router.get("/users/:id", authenticateToken, userController.getUserById);
// 유저 수정
router.put("/users/:id", authenticateToken, userController.updateUser);
// 유저 삭제
router.delete("/users/:id", authenticateToken, userController.deleteUser);

// 유저 -> 관리자
router.put("/users/:id/admin", authenticateToken, adminMiddleware, userController.updateUserToAdmin);
// 특정 유저의 출석 정보 변경
router.put("/users/:id/attendance", authenticateToken, adminMiddleware, userController.updateUserAttendance);

//인증 이메일 전송
router.post('/signup/send', emailConfig.sendEmail);
//코드 인증
router.post('/signup/cert', emailConfig.certEmail);
// 출석 정보 확인 edited by 진혁
router.get('/checkAttendance/:id', authenticateToken, userController.checkAttendance);
//SSE 구현
router.get('/events/:id', authenticateToken, userController.checkAttendance);
module.exports = router;
/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: 유저 관련 작업
 *   - name: Admin
 *     description: 관리자 관련 작업
 */

/**
 * @swagger
 * paths:
 *  /api/user/signup:
 *    post:
 *      summary: "유저 회원가입"
 *      description: "새로운 사용자를 생성합니다. 비밀번호는 암호화되어 저장됩니다."
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - username
 *                - password
 *                - email
 *              properties:
 *                username:
 *                  type: string
 *                  description: "사용자의 아이디"
 *                password:
 *                  type: string
 *                  description: "사용자의 비밀번호"
 *                email:
 *                  type: string
 *                  description: "사용자의 이메일"
 *      responses:
 *        201:
 *          description: "사용자 생성 성공"
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/User'
 *        400:
 *          description: "요청 데이터 오류"
 *  /api/user/login:
 *    post:
 *      summary: "유저 로그인"
 *      description: "사용자 로그인을 처리합니다. 성공 시 JWT 토큰 반환."
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - username
 *                - password
 *              properties:
 *                username:
 *                  type: string
 *                  description: "사용자의 아이디"
 *                password:
 *                  type: string
 *                  description: "사용자의 비밀번호"
 *      responses:
 *        200:
 *          description: "로그인 성공, 토큰 발급"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  token:
 *                    type: string
 *                    description: "인증 토큰"
 *        401:
 *          description: "인증 실패"
 *        500:
 *          description: "서버 오류"
 *  
 *  /api/user/users:
 *    get:
 *      summary: "모든 유저 조회"
 *      description: "모든 사용자의 정보를 조회합니다."
 *      tags: [Admin]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        200:
 *          description: "모든 사용자 정보 반환"
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/User'
 *        404:
 *          description: "사용자를 찾을 수 없음"
 *  /api/user/users/{id}:
 *    get:
 *      summary: "특정 유저 조회"
 *      description: "ID로 특정 사용자의 정보를 조회합니다."
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: "조회할 사용자의 ID"
 *      responses:
 *        200:
 *          description: "사용자 정보 반환"
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/User'
 *        404:
 *          description: "사용자를 찾을 수 없음"
 *    put:
 *      summary: "유저 정보 업데이트"
 *      description: "ID로 특정 사용자의 정보를 업데이트합니다."
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: "업데이트할 사용자의 ID"
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                  description: "업데이트할 사용자의 새 아이디"
 *                email:
 *                  type: string
 *                  description: "업데이트할 사용자의 새 이메일"
 *                password:
 *                  type: string
 *                  description: "업데이트할 사용자의 새 비밀번호"
 *      responses:
 *        200:
 *          description: "사용자 업데이트 성공"
 *        404:
 *          description: "사용자를 찾을 수 없음"
 *    delete:
 *      summary: "유저 삭제"
 *      description: "ID로 특정 사용자를 삭제합니다."
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: "삭제할 사용자의 ID"
 *      responses:
 *        200:
 *          description: "사용자 삭제 성공"
 *        404:
 *          description: "사용자를 찾을 수 없음"
 *        500:
 *          description: "서버 오류"
 *  /api/user/users/{id}/admin:
 *    put:
 *      summary: "유저를 관리자 권한으로 업데이트"
 *      tags: [Admin]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: "업데이트할 사용자의 ID"
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                isAdmin:
 *                  type: boolean
 *      responses:
 *        200:
 *          description: "사용자 관리자 권한 업데이트 성공"
 *        404:
 *          description: "사용자를 찾을 수 없음"
 *        500:
 *          description: "서버 오류"
 *  /api/user/users/{id}/attendance:
 *    put:
 *      summary: 특정 유저의 해당 세션의 원하는 출석체크 값 바꾸기
 *      tags: [Admin]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: "업데이트할 사용자의 ID"
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                userId:
 *                  type: string
 *                  description: The ID of the user
 *                  example: "664c8a6f2fb638f06aef242f"
 *                sessionId:
 *                  type: string
 *                  description: The ID of the session
 *                  example: "6655b4c0e76a7861f29d527f"
 *                attendIdx:
 *                  type: number
 *                  description: The index of the specific attendance entry within the session
 *                  example: 1
 *                status:
 *                  type: boolean
 *                  description: The new status value (true or false)
 *                  example: true
 *      responses:
 *        200:
 *          description: Attendance updated successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Attendance updated successfully"
 *                  attendance:
 *                    type: object
 *                    description: The updated attendance document
 *        404:
 *          description: Attendance record not found
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Attendance record not found"
 *        500:
 *          description: Server error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Server error"
 *                  error:
 *                    type: string
 *                    example: "error details"
 *  /api/user/signup/send:
 *    post:
 *      summary: "인증 이메일 전송"
 *      description: "사용자가 회원가입 시 입력한 이메일 주소로 인증 이메일을 전송합니다."
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *              properties:
 *                email:
 *                  type: string
 *                  description: "인증 이메일을 받을 사용자의 이메일 주소"
 *      responses:
 *        200:
 *          description: "이메일 전송 성공"
 *        400:
 *          description: "이메일 형식 오류 또는 필수 정보"
 *        500:
 *          description: "서버 오류"
 *  /api/user/signup/cert:
 *    post:
 *      summary: "이메일로 받은 코드 인증"
 *      description: "사용자가 이메일로 받은 인증 코드를 제출하여 인증 절차를 완료합니다."
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - code
 *              properties:
 *                code:
 *                  type: string
 *                  description: "이용자가 입력한 코드"
 *  /api/user/checkAttendance/{id}:
 *    get:
 *      summary: 특정 유저의 출석 정보 확인
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: "User ID"
 *      responses:
 *        200:
 *          description: "Attendance information retrieved successfully"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                  attend:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        _id:
 *                          type: string
 *                        user:
 *                          type: string
 *                        session:
 *                          type: string
 *                        attendList:
 *                          type: array
 *                          items: 
 *                            type: object
 *                            properties:   
 *                              _id: 
 *                                type: string
 *                              attendIdx:
 *                                type: string
 *                              status: 
 *                                type: boolean
 *                  session_name:
 *                    type: string
 *                  session_date:
 *                    type: string 
 *                  absent:
 *                    type: integer
 *        404:
 *          description: "Attendance information not found"
 *        500:
 *          description: "Error checking attendance"
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: "유저의 고유 식별자"
 *        username:
 *          type: string
 *          description: "유저의 이름"
 *        email:
 *          type: string
 *          description: "유저의 이메일"
 *        password:
 *          type: string
 *          description: "유저의 비밀번호"
 *
 *
 * */
