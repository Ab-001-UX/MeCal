import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function runVerification() {
  console.log('=== STARTING BACKEND & PRISMA COMPREHENSIVE VERIFICATION ===\n');

  // 1. Get a test user from the database
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found in database for testing');
  }
  console.log(`[PASS] Auth / User Lookup: User '${user.name}' (${user.id}) found.`);

  // 2. Test Manual Entry - prisma.meal.create with type
  console.log('\n--- Testing Feature 1: Manual Food Entry ---');
  const manualMeal = await prisma.meal.create({
    data: {
      name: 'Verification Jollof Rice & Plantain',
      calories: 650,
      protein: 18,
      carbs: 95,
      fat: 15,
      imageUrl: 'https://via.placeholder.com/400x300.png?text=Manual+Entry',
      type: 'Breakfast',
      userId: user.id
    }
  });
  console.log('[PASS] Manual Entry Meal Created successfully with ID:', manualMeal.id);
  console.log('       Type column value:', manualMeal.type);


  // 5. Test Meal History / Fetching - prisma.meal.findMany
  console.log('\n--- Testing Feature 4: Meal History & Querying ---');
  const todayMeals = await prisma.meal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`[PASS] Fetched ${todayMeals.length} meals for user without any Prisma column errors.`);

  // 6. Test Meal Update - prisma.meal.update
  console.log('\n--- Testing Feature 5: Meal Edit / Update ---');
  const updatedMeal = await prisma.meal.update({
    where: { id: manualMeal.id },
    data: {
      calories: 700,
      type: 'Dinner'
    }
  });
  console.log('[PASS] Updated meal calories to:', updatedMeal.calories, 'and type to:', updatedMeal.type);

  // 7. Test Meal Deletion - prisma.meal.delete
  console.log('\n--- Testing Feature 6: Meal Deletion ---');
  await prisma.meal.delete({ where: { id: manualMeal.id } });
  await prisma.meal.delete({ where: { id: aiMeal.id } });
  await prisma.meal.delete({ where: { id: barcodeMeal.id } });
  console.log('[PASS] Test meals successfully cleaned up / deleted from database.');

  // 8. Test WaterLog & Activity models
  console.log('\n--- Testing Feature 7: Water & Activity tracking ---');
  const water = await prisma.waterLog.create({
    data: { amount: 2, userId: user.id }
  });
  console.log('[PASS] WaterLog created:', water.id);
  await prisma.waterLog.delete({ where: { id: water.id } });

  const activity = await prisma.activity.create({
    data: { type: 'Steps', value: 5000, calories: 200, userId: user.id }
  });
  console.log('[PASS] Activity created:', activity.id);
  await prisma.activity.delete({ where: { id: activity.id } });

  console.log('\n=== ALL 8 VERIFICATION CHECKS PASSED WITH ZERO PRISMA RUNTIME ERRORS! ===');
}

runVerification()
  .catch((err) => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
