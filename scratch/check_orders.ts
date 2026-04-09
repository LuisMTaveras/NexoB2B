import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    include: { items: true }
  })
  console.log('Total Orders in DB:', orders.length)
  console.log('Orders Detail:', JSON.stringify(orders, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
