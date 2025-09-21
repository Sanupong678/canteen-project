import express from 'express'
import {
  getAllTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getTopicById
} from '../controllers/evaluationTopicController.js'
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/', getAllTopics)
router.get('/:id', getTopicById)

// Admin only routes
router.post('/', verifyToken, isAdmin, createTopic)
router.put('/:id', verifyToken, isAdmin, updateTopic)
router.delete('/:id', verifyToken, isAdmin, deleteTopic)

export default router
