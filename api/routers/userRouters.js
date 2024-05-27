const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateToken = require("../middlewares/authentication");

// 회원 가입
router.post("/signup", userController.createUser);
// 로그인
router.post("/login", userController.login);
// 모든 유저 정보
router.get("/users", authenticateToken, userController.getAllUsers);
// 특정 유저
router.get("/users/:id", authenticateToken, userController.getUserById);
// 유저 수정
router.put("/users/:id", authenticateToken, userController.updateUser);
// 유저 삭제
router.delete("/users/:id", authenticateToken, userController.deleteUser);

// router.post("/signup/admin", userController.createInitAdmin);

module.exports = router;

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
 *  /api/user/users:
 *    get:
 *      summary: "모든 유저 조회"
 *      description: "모든 사용자의 정보를 조회합니다."
 *      tags: [Users]
 *      security:
 *        - BearerAuth: []
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
 *        - BearerAuth: []
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
 *        - BearerAuth: []
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
 *        - BearerAuth: []
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
 *
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
 */
