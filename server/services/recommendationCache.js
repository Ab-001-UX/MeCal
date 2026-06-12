import { Redis } from '@upstash/redis'

const localCache = new Map()

export let redis = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
  } catch (error) {
    console.error('Failed to initialize Upstash Redis cache:', error)
  }
}

function cacheKey(userId) {
  return `recs:${userId}:${new Date().toISOString().slice(0, 10)}`
}

export async function getCachedRecommendations(userId) {
  const key = cacheKey(userId)
  if (redis) {
    try {
      const data = await redis.get(key)
      return data || null
    } catch (err) {
      console.error('Upstash Redis get cache error, falling back to memory:', err)
    }
  }
  return localCache.get(key) || null
}

export async function setCachedRecommendations(userId, data) {
  const key = cacheKey(userId)
  if (redis) {
    try {
      // Cache for 24 hours
      await redis.set(key, data, { ex: 24 * 60 * 60 })
      return
    } catch (err) {
      console.error('Upstash Redis set cache error, falling back to memory:', err)
    }
  }
  localCache.set(key, data)
}
