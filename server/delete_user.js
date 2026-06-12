import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const phone = '08020908910'
  const deleted = await prisma.user.deleteMany({
    where: {
      phoneNumber: phone
    }
  })
  console.log(`Deleted ${deleted.count} user(s) with phone ${phone}`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
