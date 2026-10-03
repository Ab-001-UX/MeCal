import express from 'express'
import { getTodayMeals, logManualMeal, updateMeal, deleteMeal, logMeal, getRecommendations, getSavedMeals, saveMealToLibrary, removeSavedMeal } from '../controllers/meal.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/manual', authenticate, logManualMeal)
router.post('/log', authenticate, logMeal)
router.get('/recommendations', authenticate, getRecommendations)
router.get('/today', authenticate, getTodayMeals)
router.put('/:id', authenticate, updateMeal)
router.delete('/:id', authenticate, deleteMeal)
router.get('/saved', authenticate, getSavedMeals)
router.post('/saved', authenticate, saveMealToLibrary)
router.delete('/saved/:id', authenticate, removeSavedMeal)

export default router
