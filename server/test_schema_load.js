import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  console.log("Checking Meal model fields in Prisma Client...")
  const mealFields = prisma.meal
  console.log("Meal service query methods available:", Object.keys(mealFields))
  
  // Try querying a meal record to ensure no client query errors are thrown
  const count = await prisma.meal.count()
  console.log("Successfully connected to Supabase PostgreSQL database. Meal count:", count)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
