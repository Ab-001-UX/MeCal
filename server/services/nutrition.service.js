export const FALLBACK_FOODS = {
  "rice and beans": { calories: 450, carbs: 60, protein: 15, fat: 10 },
  "amala and ewedu": { calories: 400, carbs: 70, protein: 10, fat: 5 },
  "eba and egusi": { calories: 600, carbs: 60, protein: 20, fat: 30 },
  "bread and egg": { calories: 350, carbs: 30, protein: 15, fat: 15 },
  "indomie and egg": { calories: 450, carbs: 50, protein: 15, fat: 20 },
  "jollof rice": { calories: 500, carbs: 70, protein: 10, fat: 15 },
  "pounded yam and egusi": { calories: 700, carbs: 80, protein: 20, fat: 35 },
  "beans and plantain": { calories: 550, carbs: 65, protein: 15, fat: 12 },
  "yam and egg": { calories: 500, carbs: 60, protein: 15, fat: 10 }
};

export function validateNutritionData(data) {
  const errors = [];
  
  if (!data.foodName || typeof data.foodName !== 'string') {
    errors.push('Invalid food name');
  }
  
  const metrics = ['calories', 'carbs', 'protein', 'fat'];
  metrics.forEach(metric => {
    if (typeof data[metric] !== 'number' || data[metric] < 0) {
      errors.push(`Invalid ${metric}: must be a positive number`);
    }
  });
  
  // Check balance if values are numbers
  if (errors.length === 0) {
    const calculatedCalories = data.carbs * 4 + data.protein * 4 + data.fat * 9;
    const diff = Math.abs(calculatedCalories - data.calories);
    // Allow 20% deviation or 100 calories, whichever is greater
    const allowedDeviation = Math.max(100, data.calories * 0.2);
    
    if (diff > allowedDeviation) {
      errors.push(`Calorie mismatch: Calculated ${calculatedCalories} from macros, but reported ${data.calories}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getFallbackData(foodName) {
  const normalizedQuery = foodName ? foodName.toLowerCase().trim() : '';
  
  if (normalizedQuery) {
    // Try to find a match in the fallback dictionary
    for (const [key, value] of Object.entries(FALLBACK_FOODS)) {
      if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
        return {
          foodName: key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          calories: value.calories,
          carbs: value.carbs,
          protein: value.protein,
          fat: value.fat,
          fallbackUsed: true
        };
      }
    }
  }
  
  // If no match or no name, return a generic fallback
  return {
    foodName: foodName || "Unknown Meal",
    calories: 500,
    carbs: 50,
    protein: 20,
    fat: 15,
    fallbackUsed: true
  };
}
