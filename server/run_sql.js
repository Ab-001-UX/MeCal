import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Attempting to apply RLS policy to the User table...')
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
    `)
    console.log('RLS enabled on User table.')
  } catch (err) {
    console.log('Note: RLS might already be enabled or ALTER failed:', err.message)
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can view own row"
      ON public."User"
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
    `)
    console.log('Policy "Users can view own row" created successfully!')
  } catch (error) {
    console.error('Failed to create policy:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
