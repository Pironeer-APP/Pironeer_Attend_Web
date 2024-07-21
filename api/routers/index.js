const express = require('express');
const router = express.Router();
const userRouters = require("./userRouters");
const sessionRouters = require("./sessionRouters");
const attendanceRouters = require("./attendanceRouters");
const depositRouters = require('./depositRouters');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: 유저 추가 수정 삭제 조회
 */
router.use("/user", userRouters);

/**
 * @swagger
 * tags:
 *   - name: Sessions
 *     description: 세션 생성, 관리
 */
router.use("/session", sessionRouters);

/**
 * @swagger
 * tags:
 *   - name: Attendance
 *     description: 출석체크 진행, 관리, 출석 관련 작업
 */
router.use("/session", attendanceRouters);

// /**
//  * @swagger
//  * tags:
//  *   - name: Attendance
//  *     description: 출석체크 진행, 관리, 출석 관련 작업
//  */
// router.use("/attendance", attendanceRouters)

/**
 * @swagger
 * tags:
 *   name: Deposits
 *   description: 보증금 조회, 보증금 방어권 사용
 */
router.use("/deposit", depositRouters);

module.exports = router
