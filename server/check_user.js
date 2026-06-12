import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Querying database...')
  const user = await prisma.user.findFirst({
    where: {
      phoneNumber: '08023681569'
    }
  })
  
  if (user) {
    console.log('USER_FOUND:', JSON.stringify(user, null, 2))
  } else {
    console.log('USER_NOT_FOUND')
    const allUsers = await prisma.user.findMany({
      select: { name: true, phoneNumber: true }
    })
    console.log('Available users:', allUsers)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
