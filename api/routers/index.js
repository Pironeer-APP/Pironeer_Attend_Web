const express = require('express');
const router = express.Router();
const userRouters = require("./userRouters")
const sessionRouters = require("./sessionRouters")

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 유저 추가 수정 삭제 조회
 */
router.use("/user", userRouters)

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: 세션 생성, 관리 출석체크 진행, 관리
 */
router.use("/session", sessionRouters)

module.exports = router
