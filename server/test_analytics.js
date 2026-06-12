import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Testing weekly analytics database query...')
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('No user found in the database.')
      return
    }
    console.log('Found user:', user.id, user.email)
    
    const day = new Date()
    const startOfDay = new Date(day)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(day)
    endOfDay.setHours(23, 59, 59, 999)
    
    console.log('Querying meals for today:', startOfDay, 'to', endOfDay)
    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
    console.log('Meals found:', meals.length)
    
  } catch (err) {
    console.error('DATABASE QUERY ERROR:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
