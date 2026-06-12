import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
        country: true,
        tribe: true
      }
    })
    
    console.log('--- REGISTERED USERS COUNT ---')
    console.log(`Total registered accounts: ${users.length}\n`)
    
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. Name: ${user.name || 'N/A'}`)
      console.log(`   Phone: ${user.phoneNumber}`)
      console.log(`   Location: ${user.country || 'N/A'} (Tribe: ${user.tribe || 'N/A'})`)
      console.log(`   Created At: ${user.createdAt || 'N/A'}`)
      console.log('------------------------------')
    })
  } catch (error) {
    console.error('Failed to retrieve users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
