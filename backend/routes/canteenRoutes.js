import express from 'express';
import { getCanteens, createCanteen, updateCanteen, deleteCanteen } from '../controllers/canteenController.js';
const router = express.Router();

router.get('/', getCanteens);
router.post('/', createCanteen);
router.patch('/:id', updateCanteen);
router.delete('/:id', deleteCanteen);

export default router; 