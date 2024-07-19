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

module.exports = router;