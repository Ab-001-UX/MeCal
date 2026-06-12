import express from 'express'
import { logActivity, getTodayActivities, logStepGoalReport } from '../controllers/activity.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// Log dynamic step sync or selected workout
router.post('/log', authenticate, logActivity)
router.post('/step-report', authenticate, logStepGoalReport)

// Fetch aggregated steps and exercises logged today
router.get('/today', authenticate, getTodayActivities)

export default router
