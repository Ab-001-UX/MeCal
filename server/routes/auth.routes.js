import express from 'express'
import { onboardUser, getProfile, updateProfile, logout, login, checkPhone, sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword, getWellnessSummary } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { loginRateLimiter } from '../middleware/rateLimit.middleware.js'


const router = express.Router()


router.post('/onboard', onboardUser)
router.post('/wellness-summary', getWellnessSummary)
router.get('/me', authenticate, getProfile)
router.patch('/me', authenticate, updateProfile)
router.post('/logout', logout)
router.post('/login', loginRateLimiter, login)
router.post('/check-phone', checkPhone)

// Password reset routes
router.post('/forgot-password/send-otp', sendPasswordResetOtp)
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp)
router.post('/reset-password', resetPassword)

export default router
