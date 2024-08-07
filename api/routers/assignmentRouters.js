const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require("../middlewares/admin");

//과제 생성
router.post('/createAssignment', authenticateToken, adminMiddleware, assignmentController.createAssignment);

//모든 과제 조회
router.get('/assignments', authenticateToken, adminMiddleware, assignmentController.getAllAssignments);

//특정 과제 조회 + 해당 과제의 모든 채점 결과도 조회
router.get('/assignments/:assignmentId', authenticateToken, adminMiddleware, assignmentController.getAssignmentById);

//과제 삭제
router.delete('/deleteAssignment/:assignmentId', authenticateToken, adminMiddleware, assignmentController.deleteAssignment);

module.exports = router;