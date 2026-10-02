import { validateNutritionData, getFallbackData } from './nutrition.service.js';

async function callGemini(prompt, retries = 2) {
  let apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/['"]/g, '').trim();

  if (!apiKey) {
    console.warn('[AI] GEMINI_API_KEY is not set. Attempting Groq fallback immediately...');
    return await callGroq(prompt);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout per attempt

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error:', errorData);
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error('[AI] Gemini failed with error:', lastError?.message || lastError);
  try {
    console.log('[AI] Attempting Groq fallback...');
    return await callGroq(prompt);
  } catch (groqError) {
    console.error('[AI] Groq fallback also failed:', groqError.message);
    throw new Error(`AI services failed: Gemini error (${lastError?.message || lastError}) | Groq error (${groqError.message})`);
  }
}

async function callGroq(prompt) {
  let groqKey = process.env.GROQ_API_KEY;
  if (groqKey) groqKey = groqKey.replace(/['"]/g, '').trim();
  if (!groqKey) throw new Error('GROQ_API_KEY is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGroqVision(prompt, base64Data) {
  let groqKey = process.env.GROQ_API_KEY;
  if (groqKey) groqKey = groqKey.replace(/['"]/g, '').trim();
  if (!groqKey) throw new Error('GROQ_API_KEY is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq Vision API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseJsonFromText(text) {
  if (!text) throw new Error('Empty text content');
  
  // Find first occurrence of { or [
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = text.lastIndexOf(']');
  }
  
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    // Try standard fallback cleanup
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
  
  const jsonStr = text.slice(startIdx, endIdx + 1);
  return JSON.parse(jsonStr);
}

export function calculateCalorieGoal(profile) {
  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 165;
  const age = parseInt(profile.age) || 25;
  const gender = (profile.gender || 'female').toLowerCase();
  const goal = profile.goal || 'maintain';
  const activity = profile.activityLevel || 'moderate';
  const targetWeight = profile.targetWeight ? parseFloat(profile.targetWeight) : null;
  const targetDuration = profile.targetDuration || profile.timeline;

  let w = weight;
  let h = height;
  if (profile.unitPreference === 'imperial') {
    w = weight * 0.453592;
    h = height * 2.54;
  }

  let bmr = 10 * w + 6.25 * h - 5 * age + (gender === 'male' ? 5 : -161);
  const multipliers = { low: 1.2, moderate: 1.55, active: 1.725 };
  let tdee = bmr * (multipliers[activity] || 1.55);

  let adjustment = 0;
  if ((goal === 'lose' || goal === 'gain') && targetWeight && targetWeight !== weight) {
    let wCurrentKg = w;
    let wTargetKg = targetWeight;
    if (profile.unitPreference === 'imperial') {
      wTargetKg = targetWeight * 0.453592;
    }
    
    // Parse duration helper logic inside the function directly
    let durationDays = 90; // Default to 3 months (90 days)
    if (targetDuration) {
      const str = String(targetDuration).toLowerCase().trim();
      const match = str.match(/(\d+)/);
      const number = match ? parseInt(match[1], 10) : null;
      
      if (str.includes('month')) {
        durationDays = (number || 3) * 30;
      } else if (str.includes('week')) {
        durationDays = (number || 12) * 7;
      } else if (str.includes('year') || str.includes('an')) {
        durationDays = (number || 1) * 365;
      } else if (str.includes('day') || str.includes('jour')) {
        durationDays = number || 90;
      } else if (number) {
        durationDays = number;
      }
    }
    
    // 7700 kcal per kg of weight delta
    const diffKg = wTargetKg - wCurrentKg;
    const dailyDelta = (7700 * diffKg) / Math.max(1, durationDays);
    
    // Cap adjustment at max deficit of -1000 kcal and max surplus of +1000 kcal for safety
    adjustment = Math.max(-1000, Math.min(1000, dailyDelta));
  } else {
    // Fallback logic if targetWeight is not set or goal is maintain
    if (goal === 'lose') adjustment = -500;
    if (goal === 'gain') adjustment = 400;
  }

  return Math.round(Math.max(1200, tdee + adjustment));
}

export function getStepGoal(activityLevel) {
  if (activityLevel === 'low') return 5000;
  if (activityLevel === 'active') return 10000;
  return 7500;
}

export async function generateWellnessSummary(profile, lang = 'en') {
  const calorieGoal = calculateCalorieGoal(profile);
  const stepGoal = getStepGoal(profile.activityLevel);
  
  // Calculate dynamic water target: 35 ml per kg of weight + activity adjustment
  const weight = parseFloat(profile.weight) || 70;
  let weightKg = weight;
  if (profile.unitPreference === 'imperial') {
    weightKg = weight * 0.453592;
  }
  const activity = profile.activityLevel || 'moderate';
  const activityOffset = activity === 'active' ? 1000 : activity === 'moderate' ? 500 : 0;
  const targetWaterMl = weightKg * 35 + activityOffset;
  const capacity = profile.waterPreference === 'bottle' ? 750 : 500;
  const calculatedWaterGoal = Math.ceil(targetWaterMl / capacity);
  // Ensure a minimum target: 4 bottles (3L) or 5 sachets (2.5L)
  const waterGoal = Math.max(profile.waterPreference === 'bottle' ? 4 : 5, calculatedWaterGoal);

  const fallback = {
    calorieGoal,
    stepGoal,
    waterGoal,
    summary: lang === 'fr'
      ? `Bonjour ${profile.name || ''} ! Votre objectif est ${calorieGoal} kcal/jour, ${waterGoal} unités d'eau, et ${stepGoal} pas.`
      : `Hi ${profile.name || ''}! Your daily target is ${calorieGoal} kcal, ${waterGoal} water units, and ${stepGoal} steps.`,
    tips: lang === 'fr'
      ? ['Buvez de l\'eau régulièrement.', 'Privilégiez les repas locaux maison.', 'Bougez un peu chaque jour.']
      : ['Stay hydrated through the day.', 'Favor home-cooked local meals.', 'Move a little every day.']
  };

  try {
    const prompt = `
      You are MeCal, a warm wellness coach for African users.
      Generate a personalized onboarding wellness summary in ${lang === 'fr' ? 'French' : 'English'}.
      Profile: ${JSON.stringify(profile)}
      Pre-calculated targets: calories=${calorieGoal}, steps=${stepGoal}, water units=${waterGoal}
      Return ONLY JSON:
      {
        "calorieGoal": ${calorieGoal},
        "stepGoal": ${stepGoal},
        "waterGoal": ${waterGoal},
        "summary": "2-3 supportive sentences in ${lang === 'fr' ? 'French' : 'English'}",
        "tips": ["tip1", "tip2", "tip3"]
      }
      Use casual, culturally grounded tone. No clinical language.
    `;
    const text = await callGemini(prompt);
    const result = parseJsonFromText(text);
    return { ...fallback, ...result, source: 'ai' };
  } catch (error) {
    console.error('Wellness summary fallback:', error.message);
    return { ...fallback, source: 'fallback' };
  }
}

export async function getDailyMealPlan(profile, lang = 'en', dateStr = null, dayNum = null) {
  try {
    const calorieTarget = profile.calorieGoal || 2000;
    const stepTarget = profile.stepGoal || 7500;
    const waterTarget = profile.waterGoal || 8; 
    const capacity = profile.waterPreference === 'bottle' ? 750 : 500;
    const waterTargetMl = waterTarget * capacity;

    const todayDate = dateStr ? new Date(dateStr) : new Date();
    const dayOfWeek = todayDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' });
    const dayIndex = isNaN(todayDate.getDay()) ? new Date().getDay() : todayDate.getDay();

    const prompt = `
      Today's Date: ${todayDate.toDateString()} (${dayOfWeek})
      Generate a personalized daily nutrition, hydration, and activity blueprint for this user in ${lang === 'fr' ? 'French' : 'English'}.
      Profile: ${JSON.stringify(profile)}
      Allergies to avoid: ${JSON.stringify(profile.allergies || [])}
      Other allergies: ${profile.otherAllergies || 'none'}
      
      Baseline Targets:
      - Daily Calorie Target: ${calorieTarget} kcal
      - Daily Water Target: ${waterTargetMl} ml
      - Daily Step Target: ${stepTarget} steps

      CRUCIAL ROTATION REQUIREMENT FOR VARIETY:
      Today is ${dayOfWeek}. DO NOT recommend the exact same food items, fruits, or snacks as yesterday or previous days!
      You MUST rotate fruits and meals daily:
      - Rotate fruits: Choose a fruit recommendation appropriate for ${dayOfWeek} from a rich variety (e.g. Watermelon, Cucumber & Garden Eggs, Grapefruit, Pawpaw/Papaya, Star Apple/Agbalumo, Oranges, Guava, Bananas, Coconut, Mango, Pineapple, Avocado).
      - Rotate meals: Explore a wide variety of West African meals (e.g., Ewa Agoyin, Yam Porridge, Plantain Frittata, Bole, Abacha, Masa, Kunun, Tuwo Shinkafa, Thieboudienne, Garba, Jollof Rice, Ogi/Akara, Amala/Ewedu, etc.).
      
      Please customize and return appropriate targets for today. They should vary slightly from the baseline to feel organic, realistic, and dynamic (e.g. within +/- 10% of baselines based on their country, tribe, and selected lifestyle).
      
      Generate:
      1. 3 culturally appropriate meals (light, medium, heavy) that sum up approximately to today's calorie goal:
         - "light" (Breakfast, approx 20% of target)
         - "medium" (Breakfast or Lunch, approx 35% of target)
         - "heavy" (Lunch or Dinner, approx 45% of target)
      2. 3 distinct, light local snacks (e.g., puff puff, mosa, chin chin, roasted groundnuts, plantain chips, etc.) appropriate to their country and tribe.
         - Snacks must NOT be heavy. Keep each under 300 kcal.
      3. A fruit recommendation:
         - Strongly respect the user's weight goal. If their goal is weight loss, recommend low-calorie, high-water fruits (e.g. Watermelon, Cucumber, Star Apple, Grapefruit, Papaya). DO NOT recommend high-calorie fruits like Bananas or Avocados for weight loss.
         - If weight gain, recommend calorie-dense fruits (e.g. Bananas, Avocados, Coconut, Dates).
         - Suggest local fruits available in their country. Include how many to consume, the best time to eat them, and a short idea.

      Return ONLY JSON:
      {
        "calorieGoal": number,
        "waterGoalMl": number,
        "stepGoal": number,
        "light": { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "emoji": "🍲" },
        "medium": { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "emoji": "🍛" },
        "heavy": { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "emoji": "🍲" },
        "fruitRecommendation": { "name": "string", "quantity": "string", "bestTime": "string", "idea": "string", "emoji": "🍉" },
        "snacks": [
          { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "emoji": "🍩" },
          { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "emoji": "🍿" },
          { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "emoji": "🥜" }
        ]
      }
      Use realistic local meals/snacks for their country/tribe. Respect allergies. Casual tone.
    `;
    const text = await callGemini(prompt);
    const result = parseJsonFromText(text);
    return { ...result, source: 'ai' };
  } catch (error) {
    console.error('Meal plan fallback:', error.message);
    try {
      const fs = await import('fs');
      fs.writeFileSync('db_ai_inner_error.txt', error.stack || error.message);
    } catch (_) {}
    
    // Return a rich, culturally appropriate fallback meal plan
    const calorieTarget = profile.calorieGoal || 2000;
    const stepTarget = profile.stepGoal || 7500;
    const waterTarget = profile.waterGoal || 8;
    const capacity = profile.waterPreference === 'bottle' ? 750 : 500;
    const waterTargetMl = waterTarget * capacity;
    
    const isYoruba = (profile.tribe || '').toLowerCase() === 'yoruba' || (profile.tribe || '').toLowerCase().includes('yoruba');
    const isIgbo = (profile.tribe || '').toLowerCase() === 'igbo' || (profile.tribe || '').toLowerCase().includes('igbo');
    const isHausa = (profile.tribe || '').toLowerCase() === 'hausa' || (profile.tribe || '').toLowerCase().includes('hausa');
    const isFrancophone = lang === 'fr';

    const goal = (profile.goal || 'maintain').toLowerCase();
    const rotationIndex = (dayNum !== null && dayNum !== undefined) ? (dayNum - 1) : (isNaN(dayIndex) ? 0 : dayIndex);
    const selectedFruit = currentFruitPool[Math.abs(rotationIndex) % currentFruitPool.length];

    let fallbackPlan;

    if (isFrancophone) {
      const options = [
        // Day 0
        {
          light: { name: "Bouillie de mil & Beignets", description: "Bouillie de mil traditionnelle légère servie avec de petits beignets chauds.", emoji: "🥣" },
          medium: { name: "Alloco avec Œuf Bouilli", description: "Bananes douces frites (alloco) accompagnées de deux œufs bouillis pour les protéines.", emoji: "🍌" },
          heavy: { name: "Riz Gras au Poulet", description: "Riz pilaf parfumé cuit dans une sauce tomate riche avec du poulet grillé et des légumes.", emoji: "🍛" },
          snacks: [
            { name: "Banane douce locale", description: "Petite banane mûre locale.", calories: 90, protein: 1, carbs: 22, fat: 0, emoji: "🍌" },
            { name: "Poignée de Noix de Cajou", description: "Noix de cajou grillées locales.", calories: 160, protein: 5, carbs: 9, fat: 13, emoji: "🥜" },
            { name: "Salade de fruits frais", description: "Mélange de papaye, mangue et ananas.", calories: 120, protein: 1, carbs: 28, fat: 0, emoji: "🍍" }
          ]
        },
        // Day 1
        {
          light: { name: "Café au Lait & Pain Beurre", description: "Café au lait chaud traditionnel avec du pain frais tartiné de beurre.", emoji: "☕" },
          medium: { name: "Attiéké avec Poisson Grillé", description: "Semoule de manioc cuite à la vapeur servie avec du poisson grillé et sauce oignon.", emoji: "🐟" },
          heavy: { name: "Maffé de Bœuf & Riz", description: "Sauce crémeuse à la pâte d'arachide mijotée avec du bœuf et des carottes, servie sur du riz.", emoji: "🍛" },
          snacks: [
            { name: "Chips de Banane", description: "Chips croustillantes salées de banane plantain.", calories: 140, protein: 1, carbs: 25, fat: 5, emoji: "🍿" },
            { name: "Arachides Grillées", description: "Arachides grillées locales.", calories: 150, protein: 6, carbs: 8, fat: 12, emoji: "🥜" },
            { name: "Morceaux de Mangue", description: "Mangue fraîche coupée en morceaux.", calories: 90, protein: 1, carbs: 23, fat: 0, emoji: "🥭" }
          ]
        },
        // Day 2
        {
          light: { name: "Bouillie de Fonio sucrée", description: "Bouillie crémeuse et légère de fonio sucrée au miel.", emoji: "🥣" },
          medium: { name: "Plakali avec Sauce Gombo", description: "Pâte de manioc fermentée servie avec une sauce gombo gélatineuse et poisson.", emoji: "🍲" },
          heavy: { name: "Yassa Poulet & Riz blanc", description: "Poulet mariné au citron et oignons caramélisés, servi avec du riz blanc cuit à la vapeur.", emoji: "🍛" },
          snacks: [
            { name: "Noix de coco fraîche", description: "Chair de noix de coco fraîche locale.", calories: 180, protein: 2, carbs: 8, fat: 16, emoji: "🥥" },
            { name: "Dattes séchées", description: "Dattes séchées naturellement sucrées.", calories: 110, protein: 1, carbs: 28, fat: 0, emoji: "🌴" },
            { name: "Tranches d'Ananas", description: "Ananas frais sucré.", calories: 80, protein: 1, carbs: 21, fat: 0, emoji: "🍍" }
          ]
        },
        // Day 3
        {
          light: { name: "Omelette aux Légumes & Pain", description: "Omelette moelleuse aux tomates et oignons servie avec du pain frais.", emoji: "🍳" },
          medium: { name: "Kedjenou de Poulet & Attiéke", description: "Ragoût de poulet mijoté à l'étouffée avec légumes, servi avec attiéké.", emoji: "🍲" },
          heavy: { name: "Foutou Banane avec Sauce Graine", description: "Pâte de banane plantain pilée servie avec une riche sauce graine de palmier et viande.", emoji: "🍲" },
          snacks: [
            { name: "Beignets douces", description: "Petits beignets dorés traditionnels.", calories: 130, protein: 2, carbs: 22, fat: 4, emoji: "🍩" },
            { name: "Grain de tournesol", description: "Graines grillées croustillantes.", calories: 120, protein: 4, carbs: 6, fat: 10, emoji: "🌻" },
            { name: "Papaye en dé", description: "Morceaux de papaye fraîche.", calories: 75, protein: 1, carbs: 18, fat: 0, emoji: "🥭" }
          ]
        },
        // Day 4
        {
          light: { name: "Galettes de Riz (Masa) & Miel", description: "Galettes de riz fermenté servies avec un filet de miel.", emoji: "🥞" },
          medium: { name: "Riz Sauce Feuille & Poisson", description: "Riz blanc servi avec une sauce aux feuilles d'épinard et poisson fumé.", emoji: "🍛" },
          heavy: { name: "Placali avec Sauce Feuille & Bœuf", description: "Placali frais servi avec une sauce crémeuse aux feuilles et viande de bœuf.", emoji: "🍲" },
          snacks: [
            { name: "Tranches de Concombre", description: "Concombre frais en rondelles.", calories: 30, protein: 1, carbs: 6, fat: 0, emoji: "🥒" },
            { name: "Noix de cajou", description: "Cajou grillées salées.", calories: 150, protein: 5, carbs: 9, fat: 12, emoji: "🥜" },
            { name: "Tranches d'Orange", description: "Orange douce coupée.", calories: 65, protein: 1, carbs: 15, fat: 0, emoji: "🍊" }
          ]
        },
        // Day 5
        {
          light: { name: "Bouillie de Maïs & Beignets", description: "Bouillie chaude de maïs avec beignets soufflés.", emoji: "🥣" },
          medium: { name: "Garba d'Attiéké au Thon", description: "Attiéké servi avec morceaux de thon frit et piments frais.", emoji: "🐟" },
          heavy: { name: "Riz au Gras de Poisson", description: "Riz mijoté au bouillon de poisson et légumes de saison.", emoji: "🍛" },
          snacks: [
            { name: "Banane flambée légère", description: "Banane poêlée sans sucre ajouté.", calories: 110, protein: 1, carbs: 26, fat: 1, emoji: "🍌" },
            { name: "Arachides bouillies", description: "Arachides fraîches bouillies.", calories: 140, protein: 6, carbs: 10, fat: 9, emoji: "🥜" },
            { name: "Pamplemousse", description: "Demi pamplemousse frais.", calories: 50, protein: 1, carbs: 12, fat: 0, emoji: "🍊" }
          ]
        },
        // Day 6
        {
          light: { name: "Pain Grillé & Confiture de Mangue", description: "Pain croustillant avec confiture artisanale de mangue.", emoji: "🍞" },
          medium: { name: "Ragout d'Igname au Poulet", description: "Dés d'igname mijotés dans une sauce tomate avec poulet.", emoji: "🍲" },
          heavy: { name: "Sauce Pistache & Foutou Igname", description: "Foutou d'igname pilé servi avec une sauce pistache riche et viande.", emoji: "🍲" },
          snacks: [
            { name: "Chips de patate douce", description: "Chips de patate douce au four.", calories: 125, protein: 1, carbs: 24, fat: 3, emoji: "🍿" },
            { name: "Noix de coco râpée", description: "Noix de coco naturelle.", calories: 130, protein: 1, carbs: 5, fat: 12, emoji: "🥥" },
            { name: "Tranches d'Ananas", description: "Ananas frais et juteux.", calories: 85, protein: 1, carbs: 22, fat: 0, emoji: "🍍" }
          ]
        }
      ];
      const selected = options[Math.abs(rotationIndex) % options.length];
      fallbackPlan = {
        calorieGoal: calorieTarget,
        waterGoalMl: waterTargetMl,
        stepGoal: stepTarget,
        light: { ...selected.light, calories: Math.round(calorieTarget * 0.22), protein: 8, carbs: 45, fat: 6 },
        medium: { ...selected.medium, calories: Math.round(calorieTarget * 0.35), protein: 14, carbs: 52, fat: 12 },
        heavy: { ...selected.heavy, calories: Math.round(calorieTarget * 0.43), protein: 32, carbs: 75, fat: 18 },
        fruitRecommendation: selectedFruit,
        snacks: selected.snacks
      };
    } else if (isYoruba) {
      const options = [
        // Day 0
        {
          light: { name: "Ogi (Pap) & Akara", description: "Warm fermented corn pap served with 3 pieces of crispy bean cakes.", emoji: "🥣" },
          medium: { name: "Amala with Ewedu & Fish", description: "Soft yam flour swallow served with mucilaginous ewedu soup and stewed fish.", emoji: "🍲" },
          heavy: { name: "Jollof Rice with Grilled Chicken & Dodo", description: "Nigerian smoky Jollof rice served with grilled chicken breast and fried plantain slices.", emoji: "🍛" },
          snacks: [
            { name: "Roasted Groundnuts", description: "Handful of dry-roasted local peanuts.", calories: 160, protein: 7, carbs: 6, fat: 14, emoji: "🥜" },
            { name: "Mosa (Plantain Puffs)", description: "Light fermented sweet plantain puffs.", calories: 150, protein: 2, carbs: 30, fat: 3, emoji: "🍩" },
            { name: "Garden Egg with Peanut Butter", description: "Crisp local garden egg paired with a spoon of peanut paste.", calories: 120, protein: 4, carbs: 8, fat: 8, emoji: "🍆" }
          ]
        },
        // Day 1
        {
          light: { name: "Boiled Yam with Egg Stew", description: "Boiled white yam slices served with delicious pepper and egg stir-fry.", emoji: "🍠" },
          medium: { name: "Moi Moi & Custard", description: "Steamed savory bean pudding served with warm creamy custard.", emoji: "🍮" },
          heavy: { name: "Pounded Yam with Egusi Soup & Beef", description: "Soft pounded yam swallow paired with rich melon seed soup and beef chunks.", emoji: "🍲" },
          snacks: [
            { name: "Chin Chin", description: "Crunchy fried dough snack bits.", calories: 150, protein: 3, carbs: 22, fat: 6, emoji: "🍿" },
            { name: "Roasted Cashew Nuts", description: "Handful of local roasted cashews.", calories: 170, protein: 5, carbs: 9, fat: 13, emoji: "🥜" },
            { name: "Fruit Salad", description: "Diced local pawpaw, pineapple, and watermelon.", calories: 100, protein: 1, carbs: 24, fat: 0, emoji: "🍉" }
          ]
        },
        // Day 2
        {
          light: { name: "Eko (Agidi) & Akara", description: "Cold corn starch gel served with hot crispy bean cakes.", emoji: "🫔" },
          medium: { name: "Beans & Fried Plantain (Dodo)", description: "Slow-cooked brown beans seasoned with palm oil, served with fried plantain.", emoji: "🍲" },
          heavy: { name: "Ofada Rice with Ayamase Sauce & Fish", description: "Unpolished local brown rice topped with spicy green pepper stew, assorted meat, and fish.", emoji: "🍛" },
          snacks: [
            { name: "Plantain Chips", description: "Crispy salted unripe plantain chips.", calories: 140, protein: 1, carbs: 26, fat: 4, emoji: "🍿" },
            { name: "Roasted Plantain (Boli)", description: "Sweet smoky roasted plantain piece.", calories: 180, protein: 2, carbs: 42, fat: 1, emoji: "🍌" },
            { name: "Fresh Dates", description: "Naturally sweet local dates.", calories: 110, protein: 1, carbs: 28, fat: 0, emoji: "🌴" }
          ]
        },
        // Day 3
        {
          light: { name: "Ewa Agoyin & Fried Bread", description: "Mashed brown beans with spicy black pepper palm oil sauce and soft bread.", emoji: "🍲" },
          medium: { name: "Yam Porridge (Asaro) with Fish", description: "Savory yam cubes cooked in tomato pepper broth with smoked fish.", emoji: "🍲" },
          heavy: { name: "Eba (Yellow Garri) with Ila Alasepo & Goat Meat", description: "Garri swallow served with rich okro soup cooked with goat meat and crayfish.", emoji: "🍲" },
          snacks: [
            { name: "Boiled Groundnuts", description: "Fresh salted boiled peanuts.", calories: 140, protein: 6, carbs: 9, fat: 9, emoji: "🥜" },
            { name: "Kunun Aya", description: "Chilled homemade tigernut milk.", calories: 130, protein: 2, carbs: 24, fat: 3, emoji: "🥛" },
            { name: "Cucumber Slices", description: "Crisp cucumber rounds.", calories: 25, protein: 1, carbs: 5, fat: 0, emoji: "🥒" }
          ]
        },
        // Day 4
        {
          light: { name: "Plantain Frittata Slice", description: "Baked egg frittata studded with sweet plantain slices and peppers.", emoji: "🍳" },
          medium: { name: "Fried Rice with Mackerel Fish", description: "Savory vegetable fried rice served with seasoned fried mackerel.", emoji: "🍛" },
          heavy: { name: "Amala with Gbegiri & Ewedu (Abula) & Beef", description: "Classic Ibadan trio: Amala served with bean gbegiri soup, ewedu, and beef.", emoji: "🍲" },
          snacks: [
            { name: "Roasted Corn & Coconut", description: "Roasted sweet maize with mature coconut slice.", calories: 170, protein: 4, carbs: 28, fat: 5, emoji: "🌽" },
            { name: "Agbalumo (Star Apple)", description: "Tangy sweet African star apple.", calories: 60, protein: 1, carbs: 14, fat: 0, emoji: "🍎" },
            { name: "Cashew Nuts", description: "Lightly salted roasted cashews.", calories: 160, protein: 5, carbs: 9, fat: 12, emoji: "🥜" }
          ]
        },
        // Day 5
        {
          light: { name: "Oats Porridge with Milk & Honey", description: "Warm rolled oats topped with warm milk and a drizzle of honey.", emoji: "🥣" },
          medium: { name: "Gizdodo (Gizzard & Plantain)", description: "Sautéed chicken gizzards and sweet plantain cubes in spicy tomato sauce.", emoji: "🍲" },
          heavy: { name: "Pounded Yam with Efo Riro & Tilapia", description: "Pounded yam served with rich vegetable efo riro spinach soup and tilapia.", emoji: "🍲" },
          snacks: [
            { name: "Puff Puff", description: "2 pieces of soft fried dough balls.", calories: 140, protein: 2, carbs: 24, fat: 4, emoji: "🍩" },
            { name: "Walnuts", description: "Handful of local toasted walnuts.", calories: 160, protein: 4, carbs: 4, fat: 15, emoji: "🥜" },
            { name: "Orange Segments", description: "Fresh juicy orange slices.", calories: 65, protein: 1, carbs: 15, fat: 0, emoji: "🍊" }
          ]
        },
        // Day 6
        {
          light: { name: "Sweet Potato Fries & Fried Egg", description: "Pan-fried sweet potato chips with a seasoned sunny-side egg.", emoji: "🍠" },
          medium: { name: "White Rice & Pepper Soup", description: "Steamed rice served alongside spicy chicken pepper soup.", emoji: "🍲" },
          heavy: { name: "Garri with Efo Elegusi & Assorted Meat", description: "Eba swallow served with spinach melon soup and assorted beef & ponmo.", emoji: "🍲" },
          snacks: [
            { name: "Coconut Bites", description: "Crispy dried coconut flakes.", calories: 140, protein: 2, carbs: 6, fat: 12, emoji: "🥥" },
            { name: "Zobo Drink (Unsweetened)", description: "Chilled hibiscus flower infusion with ginger.", calories: 45, protein: 0, carbs: 11, fat: 0, emoji: "🍷" },
            { name: "Pawpaw Cubes", description: "Fresh papaya cubes.", calories: 75, protein: 1, carbs: 18, fat: 0, emoji: "🥭" }
          ]
        }
      ];
      const selected = options[Math.abs(rotationIndex) % options.length];
      fallbackPlan = {
        calorieGoal: calorieTarget,
        waterGoalMl: waterTargetMl,
        stepGoal: stepTarget,
        light: { ...selected.light, calories: Math.round(calorieTarget * 0.22), protein: 12, carbs: 42, fat: 8 },
        medium: { ...selected.medium, calories: Math.round(calorieTarget * 0.35), protein: 26, carbs: 50, fat: 10 },
        heavy: { ...selected.heavy, calories: Math.round(calorieTarget * 0.43), protein: 34, carbs: 70, fat: 16 },
        fruitRecommendation: selectedFruit,
        snacks: selected.snacks
      };
    } else if (isIgbo) {
      const options = [
        // Day 0
        {
          light: { name: "Okpa (Bambara Nut Pudding)", description: "Traditional steamed bambara nut pudding with a touch of palm oil and fluted pumpkin.", emoji: "🫔" },
          medium: { name: "Pounded Yam with Oha Soup & Beef", description: "Smooth pounded yam swallow served with fragrant oha leaf soup and cooked beef pieces.", emoji: "🍲" },
          heavy: { name: "Ukwa (Breadfruit porridge)", description: "Local breadfruit porridge simmered with dry fish, local spices, and fresh pepper.", emoji: "🥣" },
          snacks: [
            { name: "Roasted Corn & Ube", description: "Boiled or roasted maize paired with African pear.", calories: 180, protein: 4, carbs: 32, fat: 4, emoji: "🌽" },
            { name: "Garden Egg", description: "Crisp local white garden eggs.", calories: 35, protein: 1, carbs: 7, fat: 0, emoji: "🍆" },
            { name: "Cashew Nuts", description: "Roasted crunchy local cashew nuts.", calories: 150, protein: 5, carbs: 9, fat: 12, emoji: "🥜" }
          ]
        },
        // Day 1
        {
          light: { name: "Boiled Yam with Garden Egg Dip", description: "Boiled white yam paired with a savory garden egg and onion sauce.", emoji: "🍠" },
          medium: { name: "Abacha (African Salad) with Fish", description: "Shredded cassava tossed with palm oil, ugba, garden eggs, and fried fish.", emoji: "🥗" },
          heavy: { name: "Garri (Eba) with Bitterleaf Soup & Goat Meat", description: "Yellow garri swallow paired with rich bitterleaf soup and tender goat meat.", emoji: "🍲" },
          snacks: [
            { name: "Roasted Groundnuts", description: "Handful of roasted peanuts.", calories: 160, protein: 7, carbs: 6, fat: 14, emoji: "🥜" },
            { name: "Okpa Di Oku (Warm Okpa)", description: "Warm slice of high-protein native bean cake.", calories: 200, protein: 10, carbs: 28, fat: 6, emoji: "🫔" },
            { name: "Coconut slices", description: "Fresh mature coconut pieces.", calories: 140, protein: 2, carbs: 6, fat: 13, emoji: "🥥" }
          ]
        },
        // Day 2
        {
          light: { name: "Corn Porridge & Akara", description: "Fresh corn meal porridge served with fluffy bean cakes.", emoji: "🥣" },
          medium: { name: "Ji Mmiri Oku (Yam Pepper Soup)", description: "Spicy, hot yam pepper soup prepared with fresh fish and local herbs.", emoji: "🍲" },
          heavy: { name: "Pounded Yam with Egusi Soup & Stockfish", description: "Pounded yam served with rich egusi soup cooked with premium stockfish and pumpkin leaves.", emoji: "🍲" },
          snacks: [
            { name: "Plantain Chips", description: "Crispy fried plantain strips.", calories: 130, protein: 1, carbs: 24, fat: 4, emoji: "🍿" },
            { name: "Agidi (Eko) with Stew", description: "Corn starch gel served with a side of rich tomato stew.", calories: 160, protein: 3, carbs: 32, fat: 2, emoji: "🫔" },
            { name: "Pawpaw slices", description: "Fresh papaya slices.", calories: 80, protein: 1, carbs: 20, fat: 0, emoji: "🥭" }
          ]
        },
        // Day 3
        {
          light: { name: "Fried Plantain & Scrambled Eggs", description: "Sweet dodo slices served with fluffy peppered scrambled eggs.", emoji: "🍳" },
          medium: { name: "Nkwobi (Spiced Cow Foot)", description: "Tender cow foot simmered in rich uba oil sauce with utazi leaves.", emoji: "🥩" },
          heavy: { name: "Fufu with Nsala (White Soup) & Chicken", description: "Cassava fufu swallow served with aromatic cat-fish or chicken Nsala white soup.", emoji: "🍲" },
          snacks: [
            { name: "Ugba & Garden Egg", description: "Oil palm processed oil bean with garden egg.", calories: 140, protein: 5, carbs: 8, fat: 10, emoji: "🍆" },
            { name: "Dry Roasted Peanuts", description: "Crunchy local peanuts.", calories: 150, protein: 7, carbs: 5, fat: 13, emoji: "🥜" },
            { name: "Udara (Star Apple)", description: "Fresh local sweet star apple.", calories: 60, protein: 1, carbs: 14, fat: 0, emoji: "🍎" }
          ]
        },
        // Day 4
        {
          light: { name: "Boiled Sweet Potato & Sauce", description: "Boiled sweet potato slices paired with tomatoes and palm oil dip.", emoji: "🍠" },
          medium: { name: "Bole (Grilled Plantain) with Fish", description: "Smoky roasted plantain served with spicy pepper sauce and grilled mackerel.", emoji: "🍌" },
          heavy: { name: "Pounded Yam with Ogbono Soup & Beef", description: "Pounded yam served with mucilaginous ogbono soup cooked with beef and okro.", emoji: "🍲" },
          snacks: [
            { name: "Chin Chin", description: "Crispy crunchy dough bites.", calories: 140, protein: 2, carbs: 20, fat: 5, emoji: "🍿" },
            { name: "Tigernut Milk", description: "Fresh coconut tigernut drink.", calories: 130, protein: 2, carbs: 22, fat: 3, emoji: "🥛" },
            { name: "Orange slices", description: "Fresh local sweet oranges.", calories: 65, protein: 1, carbs: 15, fat: 0, emoji: "🍊" }
          ]
        },
        // Day 5
        {
          light: { name: "Achicha (Dried Cocoyam) & Beans", description: "Traditional dried cocoyam steamed with pigeon peas and palm oil sauce.", emoji: "🥣" },
          medium: { name: "Jollof Rice with Fried Tilapia", description: "Nigerian jollof rice paired with crispy fried tilapia fish.", emoji: "🍛" },
          heavy: { name: "Eba with Ofe Akwu (Banga Soup) & Meat", description: "Garri swallow served with rich palm fruit banga soup and assorted beef.", emoji: "🍲" },
          snacks: [
            { name: "Roasted Cashews", description: "Roasted cashew nuts.", calories: 160, protein: 5, carbs: 9, fat: 13, emoji: "🥜" },
            { name: "Fruit Salad", description: "Diced local papaya, pineapple, and watermelon.", calories: 90, protein: 1, carbs: 22, fat: 0, emoji: "🍉" },
            { name: "Plantain Puffs", description: "Sweet fried plantain dough ball.", calories: 130, protein: 2, carbs: 24, fat: 3, emoji: "🍩" }
          ]
        },
        // Day 6
        {
          light: { name: "Pap (Ogi) with Moi Moi", description: "Smooth corn pap paired with steamed savory bean pudding.", emoji: "🥣" },
          medium: { name: "Yam Porridge with Fresh Vegetables", description: "Yam cubes cooked with ugu spinach leaves and smoked fish.", emoji: "🍲" },
          heavy: { name: "Pounded Yam with Ofe Ora & Dry Fish", description: "Pounded yam served with rich ora leaf soup, stockfish, and dry fish.", emoji: "🍲" },
          snacks: [
            { name: "Coconut & Corn", description: "Boiled corn with fresh coconut slice.", calories: 160, protein: 4, carbs: 26, fat: 5, emoji: "🌽" },
            { name: "Dates", description: "Naturally sweet dates.", calories: 100, protein: 1, carbs: 26, fat: 0, emoji: "🌴" },
            { name: "Guava", description: "Fresh green guava.", calories: 55, protein: 2, carbs: 12, fat: 0, emoji: "🍐" }
          ]
        }
      ];
      const selected = options[Math.abs(rotationIndex) % options.length];
      fallbackPlan = {
        calorieGoal: calorieTarget,
        waterGoalMl: waterTargetMl,
        stepGoal: stepTarget,
        light: { ...selected.light, calories: Math.round(calorieTarget * 0.22), protein: 14, carbs: 38, fat: 10 },
        medium: { ...selected.medium, calories: Math.round(calorieTarget * 0.35), protein: 28, carbs: 55, fat: 12 },
        heavy: { ...selected.heavy, calories: Math.round(calorieTarget * 0.43), protein: 24, carbs: 60, fat: 14 },
        fruitRecommendation: selectedFruit,
        snacks: selected.snacks
      };
    } else { // Hausa or General Fallback
      const options = [
        // Day 0
        {
          light: { name: "Masa with Honey", description: "Fermented rice cakes drizzled with a teaspoon of natural honey.", emoji: "🥞" },
          medium: { name: "Tuwo Shinkafa with Miyan Taushe & Beef", description: "Soft rice swallow served with rich pumpkin-peanut miyan taushe soup and stewed beef.", emoji: "🍲" },
          heavy: { name: "White Rice with Stew & Fish", description: "Steamed local white rice topped with rich bell pepper tomato stew and fried fish.", emoji: "🍛" },
          snacks: [
            { name: "Kilishi (Beef Jerky)", description: "Thin sun-dried spiced beef strips.", calories: 120, protein: 15, carbs: 4, fat: 5, emoji: "🥩" },
            { name: "Kunun Aya", description: "Chilled nutritious tiger nut milk drink.", calories: 150, protein: 2, carbs: 28, fat: 4, emoji: "🥛" },
            { name: "Fresh Dates", description: "Sweet dry dates.", calories: 100, protein: 1, carbs: 25, fat: 0, emoji: "🌴" }
          ]
        },
        // Day 1
        {
          light: { name: "Kunun Gyada & Masa", description: "Nutritious groundnut pap served with fermented rice cakes.", emoji: "🥣" },
          medium: { name: "Fura da Nono (Millet & Yogurt)", description: "Traditional refreshing millet dough ball mashed into rich local yogurt.", emoji: "🥛" },
          heavy: { name: "Tuwo Masara with Miyan Kuka & Lamb", description: "Maize meal swallow served with rich dried baobab leaf soup and slow-cooked lamb.", emoji: "🍲" },
          snacks: [
            { name: "Dambu Nama", description: "Shredded dried spiced beef floss.", calories: 140, protein: 16, carbs: 2, fat: 8, emoji: "🥩" },
            { name: "Roasted Groundnuts", description: "Dry-roasted local peanuts.", calories: 160, protein: 7, carbs: 6, fat: 14, emoji: "🥜" },
            { name: "Tigernuts", description: "Chewy fresh tiger nuts.", calories: 120, protein: 1, carbs: 22, fat: 3, emoji: "🥥" }
          ]
        },
        // Day 2
        {
          light: { name: "Kosai (Hausa Akara) & Kunun Kanwa", description: "Crispy bean cakes paired with millet gruel spiced with ginger.", emoji: "🍘" },
          medium: { name: "Beans & Sweet Potato Porridge", description: "Savory porridge made from brown beans and sweet potato cubes.", emoji: "🍲" },
          heavy: { name: "Shinkafa da Miyar Geda (Peanut Soup) & Beef", description: "Fluffy white rice served with a rich, nutty peanut soup and beef.", emoji: "🍛" },
          snacks: [
            { name: "Kunun Zaki", description: "Spiced sweet millet beverage.", calories: 130, protein: 2, carbs: 28, fat: 1, emoji: "🥛" },
            { name: "Gurasa", description: "Traditional local wheat bread, sprinkled with yaji.", calories: 150, protein: 4, carbs: 32, fat: 1, emoji: "🍞" },
            { name: "Sweet Orange", description: "Fresh local sweet orange.", calories: 70, protein: 1, carbs: 16, fat: 0, emoji: "🍊" }
          ]
        },
        // Day 3
        {
          light: { name: "Boiled Sweet Potato & Pepper Sauce", description: "Boiled sweet potatoes served with vegetable oil and chili pepper dip.", emoji: "🍠" },
          medium: { name: "Suya (Beef Skewers) & Cucumber", description: "Grilled beef suya skewers seasoned with yaji pepper, served with cucumber slices.", emoji: "🥩" },
          heavy: { name: "Tuwo Shinkafa with Miyan Kubewa (Okro) & Meat", description: "Rice swallow served with fresh okro soup and tender beef.", emoji: "🍲" },
          snacks: [
            { name: "Roasted Groundnuts", description: "Handful of roasted peanuts.", calories: 150, protein: 7, carbs: 6, fat: 13, emoji: "🥜" },
            { name: "Fresh Dates", description: "Sweet dry dates.", calories: 100, protein: 1, carbs: 25, fat: 0, emoji: "🌴" },
            { name: "Papaya Cubes", description: "Diced fresh papaya.", calories: 70, protein: 1, carbs: 17, fat: 0, emoji: "🥭" }
          ]
        },
        // Day 4
        {
          light: { name: "Kunun Tsamiya & Kosai", description: "Tamarind-spiced millet gruel paired with 3 crispy bean cakes.", emoji: "🥣" },
          medium: { name: "Dan Wake (Bean Flour Dumplings)", description: "Northern bean dumplings tossed in vegetable oil, kuka, and yaji spice.", emoji: "🍲" },
          heavy: { name: "Jollof Rice with Fried Chicken", description: "Rich tomato jollof rice served with seasoned fried chicken leg.", emoji: "🍛" },
          snacks: [
            { name: "Kilishi", description: "Sun-dried seasoned beef slice.", calories: 110, protein: 14, carbs: 3, fat: 4, emoji: "🥩" },
            { name: "Kunun Aya", description: "Tigernut milk drink.", calories: 130, protein: 2, carbs: 24, fat: 3, emoji: "🥛" },
            { name: "Guava", description: "Fresh green guava.", calories: 55, protein: 2, carbs: 12, fat: 0, emoji: "🍐" }
          ]
        },
        // Day 5
        {
          light: { name: "Masa & Vegetable Sauce", description: "Fermented rice cakes served with mild pepper vegetable dip.", emoji: "🥞" },
          medium: { name: "Beans Porridge with Fried Plantain", description: "Slow cooked brown beans with fried ripe plantain slices.", emoji: "🍲" },
          heavy: { name: "Tuwo Masara with Miyan Busheshen Kifi", description: "Maize meal swallow served with smoked fish soup and leafy greens.", emoji: "🍲" },
          snacks: [
            { name: "Gurasa with Yaji", description: "Local wheat flatbread with suya pepper.", calories: 140, protein: 4, carbs: 28, fat: 1, emoji: "🍞" },
            { name: "Cashews", description: "Roasted cashew nuts.", calories: 150, protein: 5, carbs: 9, fat: 12, emoji: "🥜" },
            { name: "Watermelon Slices", description: "Chilled watermelon.", calories: 60, protein: 1, carbs: 14, fat: 0, emoji: "🍉" }
          ]
        },
        // Day 6
        {
          light: { name: "Boiled Eggs & Toast", description: "2 hard-boiled eggs served with 2 slices of whole wheat bread.", emoji: "🥚" },
          medium: { name: "Rice & Beans with Tomato Stew", description: "Steamed rice and brown beans topped with seasoned tomato stew and beef.", emoji: "🍛" },
          heavy: { name: "Tuwo Shinkafa with Miyan Taushe & Goat Meat", description: "Rice swallow served with pumpkin peanut soup and goat meat.", emoji: "🍲" },
          snacks: [
            { name: "Dambu Nama", description: "Spiced beef floss.", calories: 130, protein: 15, carbs: 2, fat: 7, emoji: "🥩" },
            { name: "Tigernuts", description: "Fresh chewy tigernuts.", calories: 120, protein: 1, carbs: 22, fat: 3, emoji: "🥥" },
            { name: "Orange", description: "Juicy sweet orange.", calories: 65, protein: 1, carbs: 15, fat: 0, emoji: "🍊" }
          ]
        }
      ];
      const selected = options[Math.abs(rotationIndex) % options.length];
      fallbackPlan = {
        calorieGoal: calorieTarget,
        waterGoalMl: waterTargetMl,
        stepGoal: stepTarget,
        light: { ...selected.light, calories: Math.round(calorieTarget * 0.22), protein: 6, carbs: 45, fat: 4 },
        medium: { ...selected.medium, calories: Math.round(calorieTarget * 0.35), protein: 28, carbs: 52, fat: 14 },
        heavy: { ...selected.heavy, calories: Math.round(calorieTarget * 0.43), protein: 30, carbs: 68, fat: 12 },
        fruitRecommendation: selectedFruit,
        snacks: selected.snacks
      };
    }

    return { ...fallbackPlan, source: 'fallback' };
  }
}

export async function analyzeFoodImage(base64Image) {
  let apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/['"]/g, '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Extract base64 data (remove header if present)
  const base64Data = base64Image.split(',')[1] || base64Image;

  const prompt = `
    Analyze this food image and return a JSON object with the following structure:
    {
      "foodName": "Name of the food",
      "calories": 500,
      "carbs": 50,
      "protein": 20,
      "fat": 10,
      "confidence": "High",
      "tribeTip": "A cultural health tip related to this food (e.g., 'Perfect for a Yoruba lunch!')"
    }
    confidence must be exactly one of: "High", "Medium", "Low".
    Return ONLY the raw JSON object. Do not wrap it in markdown or code blocks. The values for calories, carbs, protein, and fat should be numbers, not strings.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini response');
    
    const result = parseJsonFromText(text);
    
    const validation = validateNutritionData(result);
    
    if (!validation.isValid) {
      console.warn('Gemini data failed validation:', validation.errors);
      const fallback = getFallbackData(result.foodName);
      return {
        foodName: fallback.foodName,
        calories: fallback.calories,
        macros: {
          carbs: fallback.carbs,
          protein: fallback.protein,
          fat: fallback.fat
        },
        tribeTip: result.tribeTip || "Fallback applied due to invalid data.",
        confidence: 'Low',
        fallbackUsed: true
      };
    }
    
    return {
      foodName: result.foodName,
      calories: result.calories,
      macros: {
        carbs: result.carbs,
        protein: result.protein,
        fat: result.fat
      },
      tribeTip: result.tribeTip,
      confidence: normalizeConfidence(result.confidence, false),
      fallbackUsed: false
    };
  } catch (error) {
    console.error('Gemini Image Scan Error:', error.message);
    try {
      console.log('[AI] Attempting Groq Vision fallback...');
      const groqText = await callGroqVision(prompt, base64Data);
      const jsonStr = groqText.replace(/```json|```/g, '').trim();
      const result = JSON.parse(jsonStr);
      const validation = validateNutritionData(result);
      
      if (validation.isValid) {
        return {
          foodName: result.foodName,
          calories: result.calories,
          macros: {
            carbs: result.carbs,
            protein: result.protein,
            fat: result.fat
          },
          tribeTip: result.tribeTip,
          confidence: 'Medium',
          fallbackUsed: false,
          source: 'groq_vision'
        };
      }
      console.warn('[AI] Groq Vision data failed validation:', validation.errors);
    } catch (groqError) {
      console.error('[AI] Groq Vision fallback also failed:', groqError.message);
    }

    // Ultimate fallback to hardcoded data if both vision models fail
    const fallback = getFallbackData();
    return {
      foodName: fallback.foodName,
      calories: fallback.calories,
      macros: {
        carbs: fallback.carbs,
        protein: fallback.protein,
        fat: fallback.fat
      },
      tribeTip: "Fallback applied due to service error.",
      confidence: 'Low',
      fallbackUsed: true
    };
  }
}

function normalizeConfidence(value, fallbackUsed) {
  if (fallbackUsed) return 'Low'
  return ['High', 'Medium', 'Low'].includes(value) ? value : 'Medium'
}

export async function getMealRecommendations(userProfile, logs = []) {
  let apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/['"]/g, '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
    Generate personalized meal recommendations for a user with the following profile:
    ${JSON.stringify(userProfile, null, 2)}
    
    And the following recent food logs (for behavioral pattern analysis):
    ${JSON.stringify(logs, null, 2)}
    
    Consider their goals, body metrics, lifestyle, country, tribe, and allergies.
    If they have allergies, ensure the recommended meals DO NOT contain those allergens.
    If they have logs, analyze their calorie patterns and suggest meals that help them reach their goals.
    
    Return a JSON array of objects with the following structure:
    [
      { "name": "Meal Name", "calories": 500, "category": "Breakfast/Lunch/Dinner/Snack", "reason": "Why this fits their profile" }
    ]
    Return ONLY the raw JSON array. Do not wrap it in markdown or code blocks.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the JSON from the response
    return parseJsonFromText(text);
  } catch (error) {
    console.error('Gemini Service Error:', error);
    // Fallback to hardcoded values if AI fails
    if (userProfile.tribe === 'Yoruba') {
      return [
        { name: "Ogi and Akara", calories: 300, category: "Breakfast", reason: "Fallback (Yoruba)" },
        { name: "Amala and Ewedu", calories: 450, category: "Lunch", reason: "Fallback (Yoruba)" },
        { name: "Eba and Egusi", calories: 550, category: "Dinner", reason: "Fallback (Yoruba)" }
      ];
    }
    return [
      { name: "Bread and Egg", calories: 350, category: "Breakfast", reason: "Fallback" },
      { name: "Rice and Stew", calories: 500, category: "Lunch", reason: "Fallback" },
      { name: "Indomie and Egg", calories: 400, category: "Dinner", reason: "Fallback" }
    ];
  }
}

export async function analyzeFoodText(textQuery) {
  let apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/['"]/g, '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
    Analyze this text description of a meal and return a JSON object.
    You are a West African nutrition expert. Be highly precise in estimating calories, carbs, protein, and fat:
    - Account heavily for traditional swallows (Eba, Foutou, Amala) and stews (Egusi, Palm Nut, Sauce Arachide).
    - Pay close attention to specified oil levels (e.g. Floating/Heavy oil significantly increases fat/calories).
    - Include proteins/obstacles mentioned (assorted meat, poulet bicyclette, smoked fish, ponmo).
    - If composite dishes are specified (e.g., Garba, Thiéboudienne), compute the calories of the complete traditional dish recipe based on the portion.
    
    Structure the response exactly as:
    {
      "foodName": "Name of the food",
      "calories": 500,
      "carbs": 50,
      "protein": 20,
      "fat": 10,
      "tribeTip": "A cultural health tip related to this food (e.g., 'Perfect for a Yoruba lunch!')"
    }
    Meal Description: "${textQuery}"
    Return ONLY the raw JSON object. Do not wrap it in markdown or code blocks. The values for calories, carbs, protein, and fat should be numbers, not strings.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the JSON from the response
    const result = parseJsonFromText(text);
    
    // Validate data
    const validation = validateNutritionData(result);
    
    if (!validation.isValid) {
      console.warn('Gemini data failed validation:', validation.errors);
      const fallback = getFallbackData(result.foodName || textQuery);
      return {
        foodName: fallback.foodName,
        calories: fallback.calories,
        macros: {
          carbs: fallback.carbs,
          protein: fallback.protein,
          fat: fallback.fat
        },
        tribeTip: result.tribeTip || "Fallback applied due to invalid data.",
        fallbackUsed: true
      };
    }
    
    return {
      foodName: result.foodName,
      calories: result.calories,
      macros: {
        carbs: result.carbs,
        protein: result.protein,
        fat: result.fat
      },
      tribeTip: result.tribeTip,
      fallbackUsed: false
    };
  } catch (error) {
    console.error('Gemini Service Error:', error);
    // Use fallback data on failure
    const fallback = getFallbackData(textQuery);
    return {
      foodName: fallback.foodName,
      calories: fallback.calories,
      macros: {
        carbs: fallback.carbs,
        protein: fallback.protein,
        fat: fallback.fat
      },
      tribeTip: "Fallback applied due to service error.",
      fallbackUsed: true
    };
  }
}
