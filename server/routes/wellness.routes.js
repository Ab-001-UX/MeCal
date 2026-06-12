import express from 'express'
import { getTodaysTips } from '../controllers/wellness.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// GET /api/wellness/tips — returns today's 10 cached wellness articles
router.get('/tips', authenticate, getTodaysTips)


export default router
