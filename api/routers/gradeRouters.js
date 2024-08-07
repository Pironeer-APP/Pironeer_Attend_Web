const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");

//특정 유저의 과제 점수 수정
router.put('/updateScore/:assignmentId/:userId', authenticateToken, adminMiddleware, gradeController.updateScore);

//특정 유저의 모든 채점 결과 조회
router.get('/getScore/:userId', athenticateToken, gradeController.getScore);

module.exports = router;