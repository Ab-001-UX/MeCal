import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const meals = await prisma.meal.deleteMany({})
  const water = await prisma.waterLog.deleteMany({})
  const activities = await prisma.activity.deleteMany({})
  const savedMeals = await prisma.savedMeal.deleteMany({})
  const users = await prisma.user.deleteMany({})
  console.log(`Successfully wiped database:`)
  console.log(`- Users: ${users.count}`)
  console.log(`- Meals: ${meals.count}`)
  console.log(`- Water Logs: ${water.count}`)
  console.log(`- Activities: ${activities.count}`)
  console.log(`- Saved Meals: ${savedMeals.count}`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
