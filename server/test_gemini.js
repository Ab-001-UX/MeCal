import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDailyMealPlan } from './services/gemini.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const testProfile = {
  name: 'Monsurat',
  age: 26,
  height: 165,
  weight: 78,
  targetWeight: 65,
  unitPreference: 'kg',
  gender: 'Female',
  goal: 'lose',
  targetDuration: '3 months',
  country: 'Nigeria',
  tribe: 'Yoruba',
  lifestyleType: 'student',
  budgetPreference: 'moderate',
  activityLevel: 'moderate',
  calorieGoal: 1500,
  waterGoal: 5,
  stepGoal: 8500
};

async function test() {
  console.log('Testing Gemini recommendations with profile:', testProfile);
  try {
    const recommendations = await getDailyMealPlan(testProfile, 'en');
    console.log('Gemini recommendations response:', JSON.stringify(recommendations, null, 2));
  } catch (error) {
    console.error('Test error:', error);
  }
}

test();
