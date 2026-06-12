import { analyzeFoodImage } from './gemini.service.js'
import { uploadImage } from './cloudinary.service.js'
import prisma from './prisma.js'

/**
 * Executes the multi-stage pipeline for handling a meal entry.
 * @param {Object} params
 * @param {string} params.image - Base64 image string
 * @param {string} params.userId - ID of the user
 * @returns {Promise<Object>} The saved meal record
 */
export async function executeMealPipeline({ image, userId, type }) {
  // Stage 1: Validation
  if (!image) {
    throw new Error('Validation failed: No image provided')
  }

  // Stage 2: Upload Image
  const uploadResult = await uploadImage(image)

  // Stage 3: Analyze Image
  const analysis = await analyzeFoodImage(image)

  // Stage 4: Persist to Database
  const savedMeal = await prisma.meal.create({
    data: {
      name: analysis.foodName,
      calories: parseFloat(analysis.calories),
      protein: parseFloat(analysis.macros.protein),
      carbs: parseFloat(analysis.macros.carbs),
      fat: parseFloat(analysis.macros.fat),
      imageUrl: uploadResult.secure_url,
      type: type || null,
      userId: userId
    }
  })

  return {
    success: true,
    data: savedMeal,
    fallbackUsed: analysis.fallbackUsed,
    confidence: analysis.confidence || (analysis.fallbackUsed ? 'Low' : 'Medium')
  }
}
