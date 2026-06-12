import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      phoneNumber: true,
      name: true,
      password: true
    }
  })
  console.log('Users in DB:', users)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
