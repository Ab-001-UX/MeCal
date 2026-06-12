import express from 'express'
import { logWater, getTodayWater } from '../controllers/water.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/log', authenticate, logWater)
router.get('/today', authenticate, getTodayWater)

export default router
