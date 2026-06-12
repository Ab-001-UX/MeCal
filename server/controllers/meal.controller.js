import { executeMealPipeline } from '../services/mealPipeline.js'
import { analyzeFoodText, getDailyMealPlan } from '../services/gemini.service.js'
import { lookupBarcode } from '../services/openfoodfacts.service.js'
import { getCachedRecommendations, setCachedRecommendations } from '../services/recommendationCache.js'
import { profileForAi } from '../utils/userHelpers.js'
import { getStartOfDay, getEndOfDay } from '../utils/dateHelpers.js'
import prisma from '../services/prisma.js'

export async function scanMeal(req, res) {
  try {
    const { image, type } = req.body
    
    const result = await executeMealPipeline({ image, userId: req.user.id, type })
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Scan meal error:', error)
    const status = error.message.startsWith('Validation') ? 400 : 500
    res.status(status).json({ success: false, message: error.message })
  }
}

export async function getTodayMeals(req, res) {
  try {
    const dateParam = req.query.date ? new Date(req.query.date) : Date.now()
    const start = getStartOfDay(req, dateParam)
    const end = getEndOfDay(req, dateParam)
    
    const meals = await prisma.meal.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })
    
    res.status(200).json({ success: true, data: meals })
  } catch (error) {
    console.error('Get meals error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch meals' })
  }
}

export async function logManualMeal(req, res) {
  try {
    const { 
      foodName, 
      portion, 
      portionUnit, 
      category, 
      soup, 
      proteins, 
      oilLevel, 
      isCompositeDish,
      calories,
      protein,
      carbs,
      fat,
      type
    } = req.body
    
    if (!foodName) {
      return res.status(400).json({ success: false, message: 'Food name is required' })
    }
    
    let savedMeal
    let fallbackUsed = false
    
    if (calories !== undefined && protein !== undefined && carbs !== undefined && fat !== undefined) {
      // Direct logging with pre-calculated suggested macros
      savedMeal = await prisma.meal.create({
        data: {
          name: foodName,
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          carbs: parseFloat(carbs),
          fat: parseFloat(fat),
          imageUrl: "https://via.placeholder.com/400x300.png?text=Suggested+Meal",
          type: type || null,
          userId: req.user.id
        }
      })
    } else {
      // Legacy text-based analysis
      let textQuery = `${portion || 1} ${portionUnit || 'Plate(s)'} of `
      if (category === 'tubers' && req.body.preparation) {
        textQuery += `${req.body.preparation} ${foodName}`
      } else {
        textQuery += foodName
      }
      
      if (soup) {
        textQuery += `, eaten with ${soup}`
      }
      if (oilLevel) {
        textQuery += ` (oil level: ${oilLevel})`
      }
      if (proteins && proteins.length > 0) {
        textQuery += `, accompanied by: ${proteins.join(', ')}`
      }
      if (isCompositeDish) {
        textQuery += ` (cooked as a traditional composite communal dish)`
      }
      if (req.body.additional) {
        textQuery += `, with additional: ${req.body.additional}`
      }
      
      const analysis = await analyzeFoodText(textQuery)
      fallbackUsed = analysis.fallbackUsed
      
      // Save to database
      savedMeal = await prisma.meal.create({
        data: {
          name: analysis.foodName,
          calories: parseFloat(analysis.calories),
          protein: parseFloat(analysis.macros.protein),
          carbs: parseFloat(analysis.macros.carbs),
          fat: parseFloat(analysis.macros.fat),
          imageUrl: "https://via.placeholder.com/400x300.png?text=Manual+Entry",
          type: type || null,
          userId: req.user.id
        }
      })
    }
    
    res.status(200).json({
      success: true,
      data: savedMeal,
      fallbackUsed
    })
  } catch (error) {
    console.error('Manual meal log error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to log manual meal' })
  }
}

export async function updateMeal(req, res) {
  try {
    const { id } = req.params
    const { name, calories, protein, carbs, fat, type } = req.body

    const meal = await prisma.meal.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    })

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' })
    }

    const diffMs = Date.now() - new Date(meal.createdAt).getTime()
    if (diffMs > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Real meals can only be edited within 10 minutes of logging' })
    }

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        name,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        type: type !== undefined ? type : undefined
      }
    })

    res.status(200).json({ success: true, data: updatedMeal })
  } catch (error) {
    console.error('Update meal error:', error)
    res.status(500).json({ success: false, message: 'Failed to update meal' })
  }
}

export async function deleteMeal(req, res) {
  try {
    const { id } = req.params

    const meal = await prisma.meal.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    })

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' })
    }

    const diffMs = Date.now() - new Date(meal.createdAt).getTime()
    if (diffMs > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Real meals can only be deleted within 10 minutes of logging' })
    }

    await prisma.meal.delete({
      where: { id }
    })

    res.status(200).json({ success: true, message: 'Meal deleted successfully' })
  } catch (error) {
    console.error('Delete meal error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete meal' })
  }
}

export async function logMeal(req, res) {
  try {
    const { foodName, calories, protein, carbs, fat, imageUrl, type } = req.body
    if (!foodName) {
      return res.status(400).json({ success: false, message: 'Food name is required' })
    }

    const savedMeal = await prisma.meal.create({
      data: {
        name: foodName,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        imageUrl: imageUrl || null,
        type: type || null,
        userId: req.user.id
      }
    })

    res.status(201).json({ success: true, data: savedMeal })
  } catch (error) {
    console.error('Log meal error:', error)
    res.status(500).json({ success: false, message: 'Failed to log meal' })
  }
}

export async function getRecommendations(req, res) {
  try {
    const userId = req.user.id
    const lang = req.query.lang === 'fr' ? 'fr' : 'en'

    const cached = await getCachedRecommendations(userId)
    if (cached) {
      return res.status(200).json({ success: true, data: cached, cached: true })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const plan = await getDailyMealPlan(profileForAi(user), lang)
    if (plan) {
      // Only cache if the recommendations were successfully generated by the AI
      if (plan.source === 'ai') {
        await setCachedRecommendations(userId, plan)
      }
      return res.status(200).json({ success: true, data: plan, cached: false })
    }

    res.status(200).json({ success: true, data: null, cached: false })
  } catch (error) {
    console.error('Recommendations error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' })
  }
}

export async function scanBarcode(req, res) {
  try {
    const { barcode, type } = req.body
    if (!barcode) {
      return res.status(400).json({ success: false, message: 'Barcode is required' })
    }

    const product = await lookupBarcode(barcode)

    const savedMeal = await prisma.meal.create({
      data: {
        name: product.brand ? `${product.foodName} (${product.brand})` : product.foodName,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        imageUrl: product.imageUrl,
        type: type || null,
        userId: req.user.id
      }
    })

    res.status(200).json({
      success: true,
      data: savedMeal,
      product,
      servingNote: `Per ${product.servingSize}`
    })
  } catch (error) {
    console.error('Barcode scan error:', error)
    res.status(400).json({ success: false, message: error.message || 'Barcode lookup failed' })
  }
}

export async function getSavedMeals(req, res) {
  try {
    const saved = await prisma.savedMeal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json({ success: true, data: saved })
  } catch (error) {
    console.error('Get saved meals error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch saved meals' })
  }
}

export async function saveMealToLibrary(req, res) {
  try {
    const { name, calories, protein, carbs, fat, imageUrl } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: 'Meal name is required' })
    }

    const existing = await prisma.savedMeal.findFirst({
      where: { userId: req.user.id, name }
    })

    if (existing) {
      return res.status(200).json({ success: true, data: existing, alreadySaved: true })
    }

    const saved = await prisma.savedMeal.create({
      data: {
        name,
        calories: parseFloat(calories) || 0,
        protein: protein != null ? parseFloat(protein) : null,
        carbs: carbs != null ? parseFloat(carbs) : null,
        fat: fat != null ? parseFloat(fat) : null,
        imageUrl: imageUrl || null,
        userId: req.user.id
      }
    })

    res.status(201).json({ success: true, data: saved })
  } catch (error) {
    console.error('Save meal error:', error)
    res.status(500).json({ success: false, message: 'Failed to save meal' })
  }
}

export async function removeSavedMeal(req, res) {
  try {
    await prisma.savedMeal.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    })
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Remove saved meal error:', error)
    res.status(500).json({ success: false, message: 'Failed to remove saved meal' })
  }
}
