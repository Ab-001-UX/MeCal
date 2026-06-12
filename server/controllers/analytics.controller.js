import prisma from '../services/prisma.js'
import { getStartOfDay, getEndOfDay } from '../utils/dateHelpers.js'

/**
 * Get aggregated calories and water consumption for the last 7 days
 */
export async function getWeeklyAnalytics(req, res) {
  try {
    const userId = req.user.id
    
    // Fetch the user's water unit preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { waterPreference: true }
    })
    
    const waterPref = user?.waterPreference || 'sachet'
    const waterUnit = waterPref === 'sachet' ? 500 : 750 // 500ml per pure water sachet, 750ml per bottle
    
    const data = []
    
    // Generate the last 7 days chronologically (Mon -> Sun)
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      
      const startOfDay = getStartOfDay(req, day)
      const endOfDay = getEndOfDay(req, day)
      
      // Query meals for this user within this specific calendar day
      const meals = await prisma.meal.findMany({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
      
      // Query water logs for this user within this specific calendar day
      const waterLogs = await prisma.waterLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
      
      // Sum daily calories
      const dailyCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
      
      // Sum daily water (ml) and convert to user's unit preference (sachets or bottles)
      const totalWaterMl = waterLogs.reduce((sum, log) => sum + log.amount, 0)
      const dailyWaterUnits = Math.round((totalWaterMl / waterUnit) * 10) / 10 // Rounded to 1 decimal place
      
      // Get three-letter weekday name (e.g., 'Mon')
      const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
      
      data.push({
        day: dayName,
        calories: Math.round(dailyCalories),
        water: dailyWaterUnits
      })
    }
    
    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get weekly analytics error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch weekly analytics' })
  }
}

/**
 * Get aggregated data and scores for a specific month
 */
export async function getMonthHistory(req, res) {
  try {
    const userId = req.user.id
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1) // 1-indexed

    // Start and end of the month conformed to user timezone
    const rawStart = new Date(year, month - 1, 1, 12, 0, 0, 0)
    const rawEnd = new Date(year, month, 0, 12, 0, 0, 0)
    const startOfMonth = getStartOfDay(req, rawStart)
    const endOfMonth = getEndOfDay(req, rawEnd)

    const meals = await prisma.meal.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      }
    })

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      }
    })

    const activities = await prisma.activity.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      }
    })

    const numDays = new Date(year, month, 0).getDate()
    const data = []

    for (let d = 1; d <= numDays; d++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      
      const dayDate = new Date(year, month - 1, d, 12, 0, 0, 0)
      const dayStart = getStartOfDay(req, dayDate)
      const dayEnd = getEndOfDay(req, dayDate)

      // filter for this specific day using timezone conformed boundaries
      const dayMeals = meals.filter(m => {
        const t = new Date(m.createdAt).getTime()
        return t >= dayStart.getTime() && t <= dayEnd.getTime()
      })

      const dayWater = waterLogs.filter(w => {
        const t = new Date(w.createdAt).getTime()
        return t >= dayStart.getTime() && t <= dayEnd.getTime()
      })

      const dayActivities = activities.filter(a => {
        const t = new Date(a.createdAt).getTime()
        return t >= dayStart.getTime() && t <= dayEnd.getTime()
      })

      const totalCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0)
      const totalWaterMl = dayWater.reduce((sum, w) => sum + w.amount, 0)
      
      const stepReport = dayActivities.find(a => a.type === 'StepGoalReport')
      const stepGoalHit = stepReport ? stepReport.value >= 1 : null

      data.push({
        date: dateString,
        calories: Math.round(totalCalories),
        waterMl: totalWaterMl,
        stepGoalHit,
        loggedMealNames: dayMeals.map(m => m.name),
        hasData: dayMeals.length > 0 || dayWater.length > 0 || dayActivities.length > 0
      })
    }

    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get month history error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch month history' })
  }
}

/**
 * Get detailed logs for a specific day
 */
export async function getDayHistory(req, res) {
  try {
    const userId = req.user.id
    const { date } = req.params // format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' })
    }

    const [year, month, day] = date.split('-').map(Number)
    const midDay = new Date(year, month - 1, day, 12, 0, 0, 0)
    const startOfDay = getStartOfDay(req, midDay)
    const endOfDay = getEndOfDay(req, midDay)

    const meals = await prisma.meal.findMany({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    })

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    })

    const activities = await prisma.activity.findMany({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    })

    let totalSteps = 0
    let totalActiveMinutes = 0
    let totalCaloriesBurned = 0
    let stepGoalHit = null

    activities.forEach(act => {
      totalCaloriesBurned += act.calories

      if (act.type === 'StepGoalReport') {
        stepGoalHit = act.value >= 1
      } else if (act.type === 'Steps') {
        totalSteps += act.value
      } else {
        totalActiveMinutes += act.value
      }
    })

    res.status(200).json({
      success: true,
      data: {
        date,
        meals,
        waterLogs,
        activities: activities.filter(a => a.type !== 'StepGoalReport'),
        totalSteps: Math.round(totalSteps),
        totalActiveMinutes: Math.round(totalActiveMinutes),
        totalCaloriesBurned: Math.round(totalCaloriesBurned),
        stepGoalHit
      }
    })
  } catch (error) {
    console.error('Get day history error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch day history' })
  }
}

