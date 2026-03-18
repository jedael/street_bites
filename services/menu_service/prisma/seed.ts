import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const burgers = await prisma.category.create({
    data: {
      name: 'Burgers',
      description: 'Nos burgers maison',
      display_order: 1,
    },
  });

  const sides = await prisma.category.create({
    data: {
      name: 'Accompagnements',
      description: 'Frites, salades et plus',
      display_order: 2,
    },
  });

  const drinks = await prisma.category.create({
    data: {
      name: 'Boissons',
      description: 'Boissons fraîches',
      display_order: 3,
    },
  });

  // Create products
  await prisma.product.createMany({
    data: [
      {
        name: 'Classic Burger',
        description: 'Steak haché, salade, tomate, oignon, sauce maison',
        price: 8.50,
        category_id: burgers.id,
        is_available: true,
        preparation_time: 10,
      },
      {
        name: 'Cheese Burger',
        description: 'Steak haché, cheddar, cornichons, ketchup',
        price: 9.00,
        category_id: burgers.id,
        is_available: true,
        preparation_time: 10,
      },
      {
        name: 'Double Burger',
        description: 'Double steak, double fromage, sauce spéciale',
        price: 12.50,
        category_id: burgers.id,
        is_available: true,
        preparation_time: 15,
      },
      {
        name: 'Frites Classiques',
        description: 'Frites maison croustillantes',
        price: 3.50,
        category_id: sides.id,
        is_available: true,
        preparation_time: 8,
      },
      {
        name: 'Onion Rings',
        description: 'Rondelles d\'oignon panées',
        price: 4.00,
        category_id: sides.id,
        is_available: true,
        preparation_time: 8,
      },
      {
        name: 'Coca-Cola',
        description: 'Canette 33cl',
        price: 2.50,
        category_id: drinks.id,
        is_available: true,
        preparation_time: 1,
      },
      {
        name: 'Eau Minérale',
        description: 'Bouteille 50cl',
        price: 1.50,
        category_id: drinks.id,
        is_available: true,
        preparation_time: 1,
      },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
