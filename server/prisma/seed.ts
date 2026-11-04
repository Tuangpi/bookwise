import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { code: 'FREE', name: 'Free', price: 0, limits: { staff: 2, bookingsPerMonth: 50, sms: false } },
    { code: 'STARTER', name: 'Starter', price: 19, limits: { staff: 5, bookingsPerMonth: 500, sms: false } },
    { code: 'PRO', name: 'Pro', price: 49, limits: { staff: 25, bookingsPerMonth: 5000, sms: true } },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: { name: p.name, price: p.price, limits: p.limits },
      create: { code: p.code, name: p.name, price: p.price, limits: p.limits },
    });
  }
  console.log('Seeded plans');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
