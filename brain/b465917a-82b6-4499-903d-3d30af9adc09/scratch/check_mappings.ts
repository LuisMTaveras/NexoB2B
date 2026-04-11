
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const mappings = await prisma.integrationMapping.findMany({
    select: {
      resource: true,
      detailEndpoint: true,
      detailFetchOn: true,
      detailFieldMappings: true
    }
  })
  console.log(JSON.stringify(mappings, null, 2))
}

main().finally(() => prisma.$disconnect())
