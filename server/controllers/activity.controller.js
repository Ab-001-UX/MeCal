import { PrismaClient } from '@prisma/client'
import { getStartOfToday, getEndOfToday, getStartOfDay, getEndOfDay } from '../utils/dateHelpers.js'

const prisma = new PrismaClient()

/**
 * Log steps or a specific type of workout
 */
export async function logStepGoalReport(req, res) {
  try {
    const { hit } = req.body
    if (typeof hit !== 'boolean') {
      return res.status(400).json({ success: false, message: 'hit (boolean) is required' })
    }

    const userId = req.user.id
    const startOfDay = getStartOfToday(req)
    const endOfDay = getEndOfToday(req)

    await prisma.activity.deleteMany({
      where: {
        userId,
        type: 'StepGoalReport',
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    })

    const activity = await prisma.activity.create({
      data: {
        type: 'StepGoalReport',
        value: hit ? 1 : 0,
        calories: 0,
        userId
      }
    })

    res.status(201).json({
      success: true,
      data: { activity, stepGoalHit: hit }
    })
  } catch (error) {
    console.error('Step goal report error:', error)
    res.status(500).json({ success: false, message: 'Failed to save step goal report' })
  }
}

export async function logActivity(req, res) {
  try {
    const { type, value, calories } = req.body
    const userId = req.user.id
    
    if (!type || value === undefined || calories === undefined) {
      return res.status(400).json({ success: false, message: 'Type, value, and calories are required fields' })
    }
    
    // Create new activity log
    const activity = await prisma.activity.create({
      data: {
        type,
        value: parseFloat(value),
        calories: parseFloat(calories),
        userId
      }
    })
    
    res.status(201).json({ success: true, data: activity })
  } catch (error) {
    console.error('Log activity error:', error)
    res.status(500).json({ success: false, message: 'Failed to log physical activity' })
  }
}

/**
 * Get aggregated active burn, steps, and exercises logged today
 */
export async function getTodayActivities(req, res) {
  try {
    const userId = req.user.id
    
    const dateParam = req.query.date ? new Date(req.query.date) : Date.now()
    const startOfDay = getStartOfDay(req, dateParam)
    const endOfDay = getEndOfDay(req, dateParam)
    
    // Query activities for today
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Aggregate data
    let totalSteps = 0
    let totalActiveMinutes = 0
    let totalCaloriesBurned = 0
    
    let stepGoalHit = null

    activities.forEach(activity => {
      totalCaloriesBurned += activity.calories

      if (activity.type === 'StepGoalReport') {
        stepGoalHit = activity.value >= 1
      } else if (activity.type === 'Steps') {
        totalSteps += activity.value
      } else {
        totalActiveMinutes += activity.value
      }
    })
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        totalSteps: Math.round(totalSteps),
        totalActiveMinutes: Math.round(totalActiveMinutes),
        totalCaloriesBurned: Math.round(totalCaloriesBurned),
        stepGoalHit
      }
    })
  } catch (error) {
    console.error('Get today activities error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch today\'s activities' })
  }
}
