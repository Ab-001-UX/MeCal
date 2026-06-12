import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Delete children first to avoid foreign key constraints
  await prisma.meal.deleteMany({})
  await prisma.waterLog.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.savedMeal.deleteMany({})
  
  // Now delete users
  const result = await prisma.user.deleteMany({})
  console.log('Successfully deleted all data. Users deleted:', result.count)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
