import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes.js'
import mealRoutes from './routes/meal.routes.js'
import waterRoutes from './routes/water.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import activityRoutes from './routes/activity.routes.js'
import imageRoutes from './routes/image.routes.js'
import wellnessRoutes from './routes/wellness.routes.js'
import prisma from './services/prisma.js'
import * as Sentry from '@sentry/node'

dotenv.config({ override: true })

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  })
}


// Auto-enable RLS and create missing indexes on startup to satisfy security and performance advisors
async function enableRLSOnStartup() {
  try {

    const tables = ['User', 'SavedMeal', 'Meal', 'WaterLog', 'Activity']
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;
      `).catch(err => {
        console.error(`Failed to enable RLS for table "${table}":`, err.message)
      })
    }
    
    // Create missing covering indexes on foreign keys to improve performance
    const indexes = [
      { name: 'Activity_userId_idx', table: 'Activity', column: 'userId' },
      { name: 'Meal_userId_idx', table: 'Meal', column: 'userId' },
      { name: 'WaterLog_userId_idx', table: 'WaterLog', column: 'userId' },
      { name: 'SavedMeal_userId_idx', table: 'SavedMeal', column: 'userId' }
    ]
    for (const idx of indexes) {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "${idx.name}" ON public."${idx.table}"("${idx.column}");
      `).catch(err => {
        console.error(`Failed to create index "${idx.name}":`, err.message)
      })
    }
    
    console.log('Row Level Security and covering indexes verified for all tables.')
  } catch (error) {
    console.error('Failed to configure database on startup:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

enableRLSOnStartup()


const app = express()
const PORT = process.env.PORT || 5000

const isLocalDevOrigin = (origin) => {
  if (!origin) return true
  return (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) ||
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) ||
    /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:\d+$/.test(origin)
  )
}

app.use(cors({
  origin: (origin, callback) => {
    const isProduction = process.env.NODE_ENV === 'production'
    const allowed = process.env.CLIENT_URL
      ? origin === process.env.CLIENT_URL || (!isProduction && isLocalDevOrigin(origin))
      : isLocalDevOrigin(origin)
    callback(null, allowed)
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MeCal API is running...' })
})

// Cron job endpoint to keep database alive
app.get('/api/cron/ping', async (req, res) => {
  try {
    await prisma.user.findFirst()
    res.json({ status: 'alive', message: 'Database connection successful' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/meal', mealRoutes)
app.use('/api/water', waterRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/image', imageRoutes)
app.use('/api/wellness', wellnessRoutes)

import fs from 'fs'
import path from 'path'

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  try {
    fs.appendFileSync(
      path.join(process.cwd(), 'error.log'),
      `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`
    )
  } catch (e) {
    console.error('Failed to write to error.log:', e.message)
  }
  const message = err.message || 'Something went wrong!'
  res.status(err.status || 500).json({ success: false, message, stack: err.stack })
})

// Graceful shutdown to release Prisma connections on Nodemon restarts
const cleanup = async () => {
  console.log('Disconnecting database connections...');
  try {
    await prisma.$disconnect();
  } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.once('SIGUSR2', async () => {
  try {
    await prisma.$disconnect();
  } catch (_) {}
  process.kill(process.pid, 'SIGUSR2');
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})

