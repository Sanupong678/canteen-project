import express from 'express';
import { login, logout, getLoginHistory, updateAllShopPasswords, updateShopPassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/history', verifyToken, getLoginHistory);
router.post('/update-all-passwords', updateAllShopPasswords);
router.post('/update-password', updateShopPassword);

export default router; 