import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ override: true })

const prisma = new PrismaClient()

export default prisma
