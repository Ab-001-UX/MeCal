import express from 'express';
import { redis } from '../services/recommendationCache.js';

const router = express.Router();
const localMemoryCache = new Map();

router.get('/generate', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).send('Missing query parameter');
  }

  const queryClean = q.toLowerCase().trim();
  const redisKey = `img:cache:${queryClean.replace(/\s+/g, '_')}`;

  try {
    // 1. Try serving from Upstash Redis or Local Memory Cache
    let cachedBase64 = null;
    if (redis) {
      try {
        cachedBase64 = await redis.get(redisKey);
      } catch (err) {
        console.error('[Image Cache] Redis get error:', err.message);
      }
    }
    if (!cachedBase64) {
      cachedBase64 = localMemoryCache.get(redisKey);
    }

    if (cachedBase64) {
      const buffer = Buffer.from(cachedBase64, 'base64');
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=604800'); // Cache locally for 7 days
      return res.send(buffer);
    }

    // 2. Not cached: Generate fresh image via Pollinations AI
    // Create a detailed prompt for better food images
    const prompt = encodeURIComponent(`Professional high quality top-down food photography of ${q}, appetizing, realistic, well-lit, restaurant style`);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=400&height=300&nologo=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout (allows cold start generation)

    try {
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!imageResponse.ok) {
        throw new Error(`Pollinations AI responded with status ${imageResponse.status}`);
      }

      // Convert Web stream to buffer and base64
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Str = buffer.toString('base64');

      // 3. Cache the generated base64 string for 30 days (2,592,000 seconds)
      if (redis) {
        try {
          await redis.set(redisKey, base64Str, { ex: 30 * 24 * 60 * 60 });
        } catch (err) {
          console.error('[Image Cache] Redis set error:', err.message);
        }
      }
      localMemoryCache.set(redisKey, base64Str);

      res.set('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=604800');
      return res.send(buffer);
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`[Image Cache] Generation failed for: "${q}": ${error.message}`);
      // Redirect to a high-quality stock photography fallback
      return res.redirect('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop');
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    return res.redirect('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop');
  }
});

export default router;
