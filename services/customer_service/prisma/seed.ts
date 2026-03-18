import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.customer.createMany({
    data: [
      { email: 'alice@example.com', name: 'Alice Dupont', phone: '0612345678' },
      { email: 'bob@example.com', name: 'Bob Martin', phone: '0698765432' },
      { email: 'charlie@example.com', name: 'Charlie Bernard' },
    ],
  });
  console.log('Customer seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
