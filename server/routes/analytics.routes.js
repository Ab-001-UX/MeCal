import express from 'express'
import { getWeeklyAnalytics, getMonthHistory, getDayHistory } from '../controllers/analytics.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// Fetch weekly analytics (calories and water sachet counts for the last 7 days)
router.get('/weekly', authenticate, getWeeklyAnalytics)

// Fetch history for a specific month
router.get('/history/month', authenticate, getMonthHistory)

// Fetch detailed logs for a specific day
router.get('/history/day/:date', authenticate, getDayHistory)

export default router

