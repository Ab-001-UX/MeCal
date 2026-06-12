import { PrismaClient } from '@prisma/client'
import { getStartOfDay, getEndOfDay } from '../utils/dateHelpers.js'

const prisma = new PrismaClient()

export async function logWater(req, res) {
  try {
    const { amount } = req.body
    
    const log = await prisma.waterLog.create({
      data: {
        amount: amount || 1,
        userId: req.user.id
      }
    })
    
    res.status(201).json({ success: true, data: log })
  } catch (error) {
    console.error('Log water error:', error)
    res.status(500).json({ success: false, message: 'Failed to log water' })
  }
}

export async function getTodayWater(req, res) {
  try {
    const dateParam = req.query.date ? new Date(req.query.date) : Date.now()
    const start = getStartOfDay(req, dateParam)
    const end = getEndOfDay(req, dateParam)
    
    const logs = await prisma.waterLog.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })
    
    const total = logs.reduce((sum, log) => sum + log.amount, 0)
    
    res.status(200).json({ success: true, data: { total } })
  } catch (error) {
    console.error('Get water error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch water logs' })
  }
}
