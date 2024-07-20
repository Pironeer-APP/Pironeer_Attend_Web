const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authentication');
const adminMiddleware = require('../middlewares/admin');
const depositController = require('../controllers/depositController');

//보증금 페이지 접속
router.get('/deposit/:userId', authenticateToken, depositController.checkDeposit);

//보증금 방어권 사용
router.post('/deposit/:userId/defend/use', authenticateToken, depositController.useDefend);

//보증금 새로고침
router.post('/deposit/:userId/reload', authenticateToken, depositController.depositReload);

//보증금 방어권 삭제
router.post('/:userId/defend/delete', authenticateToken,adminMiddleware, depositController.dependDelete);

//보증금 방어권 추가
router.post('/:userId/defend/add', authenticateToken,adminMiddleware, depositController.dependAdd);

//보증금 새로고침 (모든 유저)
router.post('/:userId/reload/all', authenticateToken,adminMiddleware, depositController.depositReloadAll);

//과제 정보 입력
router.post('/:userId/assignment/insert', authenticateToken,adminMiddleware, depositController.AssignmentInsert);

// 과제 정보 수정(과제 리스트 수정)
router.post('/:userId/assignment/update', authenticateToken,adminMiddleware, depositController.AssignmentUpdate);

module.exports = router;