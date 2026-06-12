import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const loginAttempts = new Map()
const scanAttempts = new Map()

// Initialize Upstash if configured
let upstashRedis = null
let upstashLoginRatelimit = null
let upstashScanRatelimit = null

if (
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN && 
  process.env.UPSTASH_REDIS_REST_TOKEN !== '********' &&
  !process.env.UPSTASH_REDIS_REST_TOKEN.startsWith('your_')
) {
  try {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    // 5 login attempts per 15 minutes
    upstashLoginRatelimit = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
    })

    // 15 scans per 1 minute
    upstashScanRatelimit = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(15, "1 m"),
    })
  } catch (error) {
    console.error('Failed to initialize Upstash rate limiters, falling back to memory:', error)
  }
}

export async function loginRateLimiter(req, res, next) {
  const ip = req.ip
  
  if (upstashLoginRatelimit) {
    try {
      const { success } = await upstashLoginRatelimit.limit(ip)
      if (!success) {
        return res.status(429).json({ 
          success: false, 
          message: 'Too many login attempts. Please try again in 15 minutes.' 
        })
      }
      return next()
    } catch (err) {
      console.error('Upstash login rate limiter error, falling back to memory:', err)
    }
  }

  // Memory Fallback
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const maxAttempts = 5

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, [])
  }

  const attempts = loginAttempts.get(ip).filter(timestamp => now - timestamp < windowMs)
  
  if (attempts.length >= maxAttempts) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many login attempts. Please try again in 15 minutes.' 
    })
  }

  attempts.push(now)
  loginAttempts.set(ip, attempts)
  next()
}

export function clearLoginAttempts(ip) {
  loginAttempts.delete(ip)
  if (upstashRedis) {
    upstashRedis.del(`ratelimit:${ip}`).catch(() => {})
  }
}

export async function scanRateLimiter(req, res, next) {
  const ip = req.ip

  if (upstashScanRatelimit) {
    try {
      const { success } = await upstashScanRatelimit.limit(ip)
      if (!success) {
        return res.status(429).json({
          success: false,
          message: 'Too many scan requests. Please wait a moment and try again.'
        })
      }
      return next()
    } catch (err) {
      console.error('Upstash scan rate limiter error, falling back to memory:', err)
    }
  }

  // Memory Fallback
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxAttempts = 15

  if (!scanAttempts.has(ip)) {
    scanAttempts.set(ip, [])
  }

  const attempts = scanAttempts.get(ip).filter((timestamp) => now - timestamp < windowMs)

  if (attempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many scan requests. Please wait a moment and try again.'
    })
  }

  attempts.push(now)
  scanAttempts.set(ip, attempts)
  next()
}
