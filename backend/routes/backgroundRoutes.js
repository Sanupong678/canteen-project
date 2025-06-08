import express from 'express';
import { getBackgrounds, createBackground, deleteBackground } from '../controllers/backgroundController.js';
const router = express.Router();

router.get('/', getBackgrounds);
router.post('/', createBackground);
router.delete('/:id', deleteBackground);

export default router; 