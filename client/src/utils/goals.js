// Mifflin-St Jeor daily goal calculations based on user profile
export const getDynamicCalorieAndMacroGoals = (user) => {
  const weightVal = parseFloat(user?.weight) || 70
  const heightVal = parseFloat(user?.height) || 165
  const ageVal = parseInt(user?.age) || 25
  const gender = user?.gender || 'Female'
  const goal = user?.goal || 'maintain'
  const activityLevel = user?.activityLevel || 'moderate'
  const unitPreference = user?.unitPreference || 'kg'

  // Convert imperial to metric if weight/height are stored in imperial units
  let weightKg = weightVal
  if (unitPreference === 'lbs' || weightVal > 250) {
    weightKg = weightVal * 0.453592
  }
  let heightCm = heightVal
  if (heightVal < 10) { // ft/in conversion
    heightCm = heightVal * 30.48
  }

  // Mifflin-St Jeor Equation
  let bmr = 0
  if (gender.toLowerCase() === 'male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageVal) + 5
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageVal) - 161
  }

  // TDEE Multipliers based on Activity Levels
  let multiplier = 1.2 // Sedentary
  if (activityLevel === 'moderate') {
    multiplier = 1.375 // Lightly active
  } else if (activityLevel === 'active') {
    multiplier = 1.55 // Moderately active
  }

  let tdee = bmr * multiplier

  // Goal Adjustments
  let calorieGoal = Math.round(tdee)
  if (goal === 'lose') {
    calorieGoal = Math.round(tdee - 450)
    if (calorieGoal < 1200) calorieGoal = 1200 // Safe minimum calories
  } else if (goal === 'gain') {
    calorieGoal = Math.round(tdee + 500)
  }

  // Macro distributions (Carbs: 50%, Protein: 25%, Fat: 25%)
  const carbsGoal = Math.round((calorieGoal * 0.50) / 4)
  const proteinGoal = Math.round((calorieGoal * 0.25) / 4)
  const fatGoal = Math.round((calorieGoal * 0.25) / 9)

  return { calorieGoal, fatGoal, proteinGoal, carbsGoal }
}

// Dynamic personalized Water Intake Goal (ml) based on user's weight, goal, and activity
export const getDynamicWaterGoal = (user) => {
  const weightVal = parseFloat(user?.weight) || 70
  const activityLevel = user?.activityLevel || 'moderate'
  const goal = user?.goal || 'maintain'
  const unitPreference = user?.unitPreference || 'kg'
  
  let weightKg = weightVal
  if (unitPreference === 'lbs' || weightVal > 250) {
    weightKg = weightVal * 0.453592
  }
  
  let baselineMl = weightKg * 35
  if (activityLevel === 'moderate') {
    baselineMl += 300
  } else if (activityLevel === 'active') {
    baselineMl += 600
  }
  
  if (goal === 'lose' || goal === 'gain') {
    baselineMl += 200
  }
  
  let waterMl = Math.round(baselineMl / 250) * 250
  if (waterMl < 1500) waterMl = 1500
  if (waterMl > 4000) waterMl = 4000
  return waterMl
}

// Dynamic personalized Steps Goal based on user's goal and activity level
export const getDynamicStepsGoal = (user) => {
  const goal = user?.goal || 'maintain'
  const activityLevel = user?.activityLevel || 'moderate'
  
  let baseSteps = 7000
  if (goal === 'lose') {
    baseSteps = 8000
  } else if (goal === 'gain') {
    baseSteps = 5000
  }
  
  if (activityLevel === 'moderate') {
    baseSteps += 1500
  } else if (activityLevel === 'active') {
    baseSteps += 3000
  }
  
  return baseSteps
}
