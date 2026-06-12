import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ override: true })

const prisma = new PrismaClient()

async function main() {
  console.log('Testing connection to Prisma with DATABASE_URL:', process.env.DATABASE_URL)
  try {
    const userCount = await prisma.user.count()
    console.log('Successfully connected! User count:', userCount)
    
    const sampleUser = await prisma.user.findFirst()
    console.log('Sample user:', sampleUser)
  } catch (error) {
    console.error('Prisma connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
