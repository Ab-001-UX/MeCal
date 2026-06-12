import prisma from '../services/prisma.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { sendOtp, verifyOtp } from '../services/termii.service.js'
import { generateWellnessSummary, calculateCalorieGoal, getStepGoal } from '../services/gemini.service.js'
import { setAuthCookie } from '../utils/authCookies.js'
import { clearLoginAttempts } from '../middleware/rateLimit.middleware.js'
import {
  BCRYPT_ROUNDS,
  JWT_EXPIRES_IN,
  sanitizeUser,
  serializeAllergies
} from '../utils/userHelpers.js'


export async function onboardUser(req, res) {
  try {
    const data = req.body
    console.log('Onboarding data received:', { ...data, password: '[HIDDEN]' })

    if (!data.phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' })
    }

    const existingUser = await prisma.user.findUnique({ where: { phoneNumber: data.phoneNumber } })
    if (existingUser) {
      console.log('Onboarding failed: Phone number already in use', data.phoneNumber)
      return res.status(400).json({ success: false, message: 'Phone number already in use' })
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS)

    const profileForGoals = {
      ...data,
      age: data.age ? parseInt(data.age, 10) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : null,
      height: data.height ? parseFloat(data.height) : null,
      unitPreference: data.unitPreference || 'kg'
    }

    const calorieGoal = data.calorieGoal
      ? parseInt(data.calorieGoal, 10)
      : calculateCalorieGoal(profileForGoals)
    const stepGoal = data.stepGoal
      ? parseInt(data.stepGoal, 10)
      : getStepGoal(data.activityLevel)

    // Calculate dynamic water target if not provided by onboarding summary
    let calculatedWaterGoal = 8;
    if (profileForGoals.weight) {
      let weightKg = profileForGoals.weight;
      if (profileForGoals.unitPreference === 'imperial') {
        weightKg = profileForGoals.weight * 0.453592;
      }
      const activityOffset = data.activityLevel === 'active' ? 1000 : data.activityLevel === 'moderate' ? 500 : 0;
      const targetWaterMl = weightKg * 35 + activityOffset;
      const capacity = data.waterPreference === 'bottle' ? 750 : 500;
      calculatedWaterGoal = Math.ceil(targetWaterMl / capacity);
    }
    const waterGoal = data.waterGoal
      ? parseInt(data.waterGoal, 10)
      : Math.max(data.waterPreference === 'bottle' ? 4 : 5, calculatedWaterGoal)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        password: hashedPassword,
        age: profileForGoals.age,
        height: profileForGoals.height,
        weight: profileForGoals.weight,
        targetWeight: profileForGoals.targetWeight,
        unitPreference: profileForGoals.unitPreference,
        gender: data.gender || null,
        goal: data.goal,
        targetDuration: data.targetDuration || data.timeline,
        country: data.country,
        tribe: data.tribe || null,
        lifestyleType: data.lifestyleType || data.lifestyle,
        budgetPreference: data.budgetPreference || data.budget,
        foodAvailability: data.foodAvailability,
        activityLevel: data.activityLevel,
        waterPreference: data.waterPreference || 'sachet',
        allergies: serializeAllergies(data.allergies),
        otherAllergies: data.otherAllergies || null,
        calorieGoal,
        waterGoal,
        stepGoal
      }
    })

    console.log('User created successfully:', user.id)

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables')
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    setAuthCookie(res, token)

    res.status(201).json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    console.error('Onboarding error detail:', error)
    if (error.code === 'P2002' && error.meta?.target?.includes('phoneNumber')) {
      return res.status(400).json({ success: false, message: 'Phone number already in use' })
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to complete onboarding' })
  }
}

export async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch profile' })
  }
}

export async function logout(req, res) {
  res.clearCookie('mecal_token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  })
  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

export async function login(req, res) {
  try {
    const { phoneNumber, password } = req.body

    const user = await prisma.user.findUnique({ where: { phoneNumber } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
      if (user.password === sha256Hash) {
        const newHashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHashedPassword }
        })
      } else {
        return res.status(400).json({ success: false, message: 'Incorrect password' })
      }
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables')
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    setAuthCookie(res, token)

    clearLoginAttempts(req.ip)

    const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
    res.status(200).json({ success: true, data: sanitizeUser(freshUser) })
  } catch (error) {
    console.error('Login error:', error)
    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to login'
      : error.message
    res.status(500).json({ success: false, message })
  }
}

export async function checkPhone(req, res) {
  try {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' })
    }
    const existingUser = await prisma.user.findUnique({ where: { phoneNumber } })
    if (existingUser) {
      return res.status(200).json({ success: true, exists: true })
    }
    return res.status(200).json({ success: true, exists: false })
  } catch (error) {
    console.error('Check phone error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to check phone number' })
  }
}

export async function sendPasswordResetOtp(req, res) {
  try {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' })
    }

    const user = await prisma.user.findUnique({ where: { phoneNumber } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this phone number not found' })
    }

    const result = await sendOtp(phoneNumber)

    if (result.success) {
      return res.status(200).json({ success: true, pinId: result.pinId, message: 'OTP sent successfully' })
    }
    return res.status(500).json({ success: false, message: 'Failed to send OTP' })
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' })
  }
}

export async function verifyPasswordResetOtp(req, res) {
  try {
    const { pinId, pin } = req.body
    if (!pinId || !pin) {
      return res.status(400).json({ success: false, message: 'pinId and pin are required' })
    }

    const result = await verifyOtp(pinId, pin)

    if (result.success) {
      return res.status(200).json({ success: true, message: 'OTP verified successfully' })
    }
    return res.status(400).json({ success: false, message: result.message || 'Invalid OTP' })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ success: false, message: 'Failed to verify OTP' })
  }
}

export async function resetPassword(req, res) {
  try {
    const { phoneNumber, newPassword } = req.body
    if (!phoneNumber || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone number and new password are required' })
    }

    const user = await prisma.user.findUnique({ where: { phoneNumber } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return res.status(200).json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, message: 'Failed to reset password' })
  }
}

export async function getWellnessSummary(req, res) {
  try {
    const { lang, ...profile } = req.body
    const summary = await generateWellnessSummary(profile, lang === 'fr' ? 'fr' : 'en')
    res.status(200).json({ success: true, data: summary })
  } catch (error) {
    console.error('Wellness summary error:', error)
    const message = process.env.NODE_ENV === 'production'
      ? 'Failed to generate wellness summary'
      : error.message
    res.status(500).json({ success: false, message })
  }
}

export async function updateProfile(req, res) {
  try {
    const allowedFields = [
      'name', 'age', 'height', 'weight', 'targetWeight', 'unitPreference', 'gender', 'goal',
      'targetDuration', 'country', 'tribe', 'lifestyleType', 'budgetPreference',
      'foodAvailability', 'activityLevel', 'waterPreference', 'otherAllergies',
      'calorieGoal', 'waterGoal', 'stepGoal'
    ]

    const data = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field]
      }
    }

    if (req.body.allergies !== undefined) {
      data.allergies = serializeAllergies(req.body.allergies)
    }

    if (data.age !== undefined) data.age = data.age ? parseInt(data.age, 10) : null
    if (data.height !== undefined) data.height = data.height ? parseFloat(data.height) : null
    if (data.weight !== undefined) data.weight = data.weight ? parseFloat(data.weight) : null
    if (data.targetWeight !== undefined) data.targetWeight = data.targetWeight ? parseFloat(data.targetWeight) : null
    if (data.calorieGoal !== undefined) data.calorieGoal = data.calorieGoal ? parseInt(data.calorieGoal, 10) : null
    if (data.waterGoal !== undefined) data.waterGoal = data.waterGoal ? parseInt(data.waterGoal, 10) : null
    if (data.stepGoal !== undefined) data.stepGoal = data.stepGoal ? parseInt(data.stepGoal, 10) : null

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' })
    }

    // Fetch existing user to merge profiles for recalculating targets
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Determine if we need to auto-recalculate goals.
    const isDrivingFieldUpdated = 
      data.weight !== undefined ||
      data.targetWeight !== undefined ||
      data.height !== undefined ||
      data.age !== undefined ||
      data.gender !== undefined ||
      data.goal !== undefined ||
      data.targetDuration !== undefined ||
      data.activityLevel !== undefined ||
      data.waterPreference !== undefined ||
      data.unitPreference !== undefined;

    if (isDrivingFieldUpdated) {
      const mergedProfile = {
        ...currentUser,
        ...data
      }
      
      // Dynamic recalculations
      data.calorieGoal = calculateCalorieGoal(mergedProfile);
      data.stepGoal = getStepGoal(mergedProfile.activityLevel);

      const weightKg = mergedProfile.unitPreference === 'imperial' 
        ? (mergedProfile.weight || 70) * 0.453592 
        : (mergedProfile.weight || 70);
      const activityOffset = mergedProfile.activityLevel === 'active' ? 1000 : mergedProfile.activityLevel === 'moderate' ? 500 : 0;
      const targetWaterMl = weightKg * 35 + activityOffset;
      const capacity = mergedProfile.waterPreference === 'bottle' ? 750 : 500;
      const calculatedWaterGoal = Math.ceil(targetWaterMl / capacity);
      data.waterGoal = Math.max(mergedProfile.waterPreference === 'bottle' ? 4 : 5, calculatedWaterGoal);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data
    })

    res.status(200).json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: 'Failed to update profile' })
  }
}
