import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `
    console.log('--- Columns in table "User" ---')
    console.log(JSON.stringify(columns, null, 2))
  } catch (error) {
    console.error('Failed to query database schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
