import express from 'express';
import { login, logout, getLoginHistory, updateAllShopPasswords, updateShopPassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout); // ไม่ต้องใช้ verifyToken เพราะ logout ควรทำงานได้แม้ token ไม่ valid
router.get('/history', verifyToken, getLoginHistory);
router.post('/update-all-passwords', updateAllShopPasswords);
router.post('/update-password', updateShopPassword);

export default router; 