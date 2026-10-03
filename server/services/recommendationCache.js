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

function cacheKey(userId, dateStr) {
  const d = dateStr || new Date().toISOString().slice(0, 10)
  return `recs:${userId}:${d}`
}

export async function getCachedRecommendations(userId, dateStr) {
  const key = cacheKey(userId, dateStr)
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

export async function setCachedRecommendations(userId, data, dateStr) {
  const key = cacheKey(userId, dateStr)
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

export async function clearUserRecommendationCache(userId) {
  // Clear memory cache keys for this user
  for (const k of Array.from(localCache.keys())) {
    if (k.startsWith(`recs:${userId}:`)) {
      localCache.delete(k)
    }
  }
  if (redis) {
    try {
      // Proactively delete today and surrounding dates directly
      const today = new Date()
      const directKeys = []
      for (let offset = -7; offset <= 7; offset++) {
        const d = new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10)
        directKeys.push(`recs:${userId}:${d}`)
      }
      await Promise.all(directKeys.map(k => redis.del(k).catch(() => {})))

      const pattern = `recs:${userId}:*`
      const keys = await redis.keys(pattern).catch(() => [])
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(k => redis.del(k).catch(() => {})))
      }
    } catch (err) {
      console.warn('Failed to clear redis cache for user:', err.message)
    }
  }
}
