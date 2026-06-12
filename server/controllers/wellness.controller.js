/**
 * Wellness Tips Controller — Powered by Groq (Llama 3.3)
 *
 * Calls Groq AI once per day to generate 10 fresh wellness tips
 * rooted in West African food culture and nutrition.
 * Results are cached in Upstash Redis for 24 hours so:
 *  - All users see the same fresh tips all day
 *  - Only 1 Groq API call per day regardless of user count
 *  - Zero load on Gemini (kept for food scanning only)
 */

const GROQ_API_KEY      = process.env.GROQ_API_KEY
const REDIS_URL         = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN       = process.env.UPSTASH_REDIS_REST_TOKEN
const UNSPLASH_KEY      = process.env.UNSPLASH_ACCESS_KEY

// ── Topic → Unsplash image map ────────────────────────────────────────────────
// Groq returns an imageTopic word; we map it to a real Unsplash photo.
const IMAGE_MAP = {
  // Staples
  plantain:    'https://images.unsplash.com/photo-1614790840969-62b5d53ef994?w=600&h=400&fit=crop',
  yam:         'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=400&fit=crop',
  cassava:     'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&h=400&fit=crop',
  fufu:        'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&h=400&fit=crop',
  rice:        'https://images.unsplash.com/photo-1536304993881-ff86e0c9c785?w=600&h=400&fit=crop',
  millet:      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop',
  sorghum:     'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop',
  fonio:       'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop',
  // Proteins
  beans:       'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=400&fit=crop',
  fish:        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop',
  chicken:     'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop',
  meat:        'https://images.unsplash.com/photo-1544025162-d76538b88ea2?w=600&h=400&fit=crop',
  protein:     'https://images.unsplash.com/photo-1544025162-d76538b88ea2?w=600&h=400&fit=crop',
  eggs:        'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&h=400&fit=crop',
  groundnuts:  'https://images.unsplash.com/photo-1553787434-dd9eb4ea4d0c?w=600&h=400&fit=crop',
  peanuts:     'https://images.unsplash.com/photo-1553787434-dd9eb4ea4d0c?w=600&h=400&fit=crop',
  // Soups & stews
  soup:        'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  stew:        'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  // Vegetables & greens
  vegetables:  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
  greens:      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
  okra:        'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=400&fit=crop',
  eggplant:    'https://images.unsplash.com/photo-1536411396859-3b8dba6e8022?w=600&h=400&fit=crop',
  tomatoes:    'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=600&h=400&fit=crop',
  // Fruits
  fruits:      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
  watermelon:  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=400&fit=crop',
  pineapple:   'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
  mango:       'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&h=400&fit=crop',
  papaya:      'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=600&h=400&fit=crop',
  baobab:      'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?w=600&h=400&fit=crop',
  // Drinks & hydration
  water:       'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop',
  hibiscus:    'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=600&h=400&fit=crop',
  zobo:        'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=600&h=400&fit=crop',
  bissap:      'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=600&h=400&fit=crop',
  tigernuts:   'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop',
  pap:         'https://images.unsplash.com/photo-1571590648029-67cf36745bfd?w=600&h=400&fit=crop',
  porridge:    'https://images.unsplash.com/photo-1571590648029-67cf36745bfd?w=600&h=400&fit=crop',
  // Herbs & spices
  ginger:      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=400&fit=crop',
  pepper:      'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=600&h=400&fit=crop',
  spices:      'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&h=400&fit=crop',
  moringa:     'https://images.unsplash.com/photo-1565299543923-37de65d01a8c?w=600&h=400&fit=crop',
  turmeric:    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=400&fit=crop',
  // Fallback
  default:     'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
}

function resolveImageFallback(topic = '') {
  const key = topic.toLowerCase().replace(/\s+/g, '')
  return IMAGE_MAP[key] || IMAGE_MAP.default
}

// ── Live Unsplash image search ────────────────────────────────────────────────
// Searches Unsplash for "{topic} west african food" and returns the best match.
// Falls back to the static IMAGE_MAP if the API is unavailable or key is missing.
async function fetchUnsplashImage(topic = '') {
  if (!UNSPLASH_KEY || UNSPLASH_KEY.includes('PASTE')) {
    return resolveImageFallback(topic)
  }
  try {
    let cleanTopic = topic.trim();
    const lower = cleanTopic.toLowerCase();
    if (lower === 'zobo' || lower === 'bissap') {
      cleanTopic = 'hibiscus tea';
    } else if (lower.includes('zobo')) {
      cleanTopic = cleanTopic.replace(/zobo/gi, 'hibiscus drink');
    } else if (lower.includes('bissap')) {
      cleanTopic = cleanTopic.replace(/bissap/gi, 'hibiscus drink');
    }

    const query    = encodeURIComponent(`${cleanTopic} west african food`)
    const url      = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
    })
    if (!response.ok) throw new Error(`Unsplash ${response.status}`)
    const data  = await response.json()
    const photo = data.results?.[0]
    if (!photo) return resolveImageFallback(topic)
    // Use the "regular" size (1080px wide) — good quality, fast to load
    return photo.urls?.regular || photo.urls?.full || resolveImageFallback(topic)
  } catch (err) {
    console.warn(`[Wellness] Unsplash fallback for "${topic}": ${err.message}`)
    return resolveImageFallback(topic)
  }
}

// ── Redis helpers (Upstash REST — no package needed) ──────────────────────────
async function redisGet(key) {
  try {
    const res  = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    })
    const data = await res.json()
    return data.result
  } catch {
    return null
  }
}

async function redisSet(key, value, ttlSeconds) {
  try {
    await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value, ex: ttlSeconds })
    })
  } catch (err) {
    console.error('[Wellness] Redis set error:', err.message)
  }
}

// ── Daily themes — 14 topics gives a 2-week rotation with no repeats ──────────
const DAILY_THEMES = [
  // Week 1
  'West African street foods — making them healthier without losing flavour',
  'Power of West African superfoods: moringa, baobab, fonio, and tiger nuts',
  'Traditional cooking methods across West Africa and their wellness benefits',
  'Hydration with local West African drinks: zobo, kunu, bissap, tamarind juice',
  'Plant proteins in West African diets: beans, black-eyed peas, groundnuts, and cowpeas',
  'Managing weight with everyday West African foods you already love',
  'West African herbs and natural remedies: ginger, turmeric, bitter leaf, and uziza',
  // Week 2
  'Gut health and fermented West African foods: ogi, dawadawa, locust beans, fermented cassava',
  'Heart-healthy eating the West African way: less oil, more vegetables and fish',
  'Energy foods for active lifestyles — fufu, yam, millet, and sorghum',
  'Ghanaian food culture and nutrition: kelewele, kontomire, red red, and waakye',
  'Senegalese and Francophone West African nutrition: thieboudienne, mafe, yassa, and attieke',
  'Iron and micronutrient-rich West African foods for women and children',
  'Seasonal and local eating in West Africa — why fresh and unprocessed always wins',
]

// ── Groq generation ───────────────────────────────────────────────────────────
async function generateWithGroq() {
  // Deterministic theme per calendar date — same theme all day, new theme tomorrow
  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
  const seed  = today.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  const theme = DAILY_THEMES[seed % DAILY_THEMES.length]

  const prompt = `You are a West African wellness and nutrition expert covering Nigeria, Ghana, Senegal, Cote d'Ivoire, Mali, Burkina Faso, and neighbouring countries. Generate exactly 10 unique, practical daily wellness tips for West African users.

Today's theme: "${theme}"
Today's date: ${new Date().toDateString()}

Return a JSON array of exactly 10 objects. Each object must have:
- "en": an object with:
  - "title": catchy English headline (max 8 words)
  - "summary": one English sentence to hook the reader (max 20 words)
  - "fullText": practical 3-4 English sentences with specific West African food examples (60-80 words)
- "fr": an object with:
  - "title": the same tip's headline translated to natural, fluent French (max 8 words)
  - "summary": the summary translated to fluent French (max 20 words)
  - "fullText": the full tip translated to fluent, conversational French (60-80 words) — use correct French food terms and keep local food names (egusi, zobo, suya etc.) as-is since they are proper nouns
- "category": Either "nutrition" or "hydration"
- "imageTopic": ONE word from this exact list:
  plantain, yam, cassava, fufu, rice, millet, sorghum, fonio, beans, fish, chicken, meat, eggs,
  groundnuts, peanuts, soup, stew, vegetables, greens, okra, eggplant, tomatoes, fruits, watermelon,
  pineapple, mango, papaya, baobab, water, hibiscus, zobo, bissap, tigernuts, pap, porridge,
  ginger, pepper, spices, moringa, turmeric

Rules:
- Cover the breadth of West Africa — mix Nigerian, Ghanaian, Senegalese, and other regional foods
- Include specific local food names (egusi, suya, jollof, kelewele, thieboudienne, mafe, waakye, attieke, banku, ogi, dawadawa, zobo, kunu, massa, boli, kontomire, red red)
- Be specific, educational, and culturally accurate — not generic health advice
- Make each of the 10 tips genuinely different from the others
- Write for everyday users, not medical professionals
- The French translation must be complete and natural — no English sentences left untranslated

Respond with ONLY the raw JSON array. No markdown, no code blocks, no explanation.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens:  5500, // bilingual — ~2x content per tip
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const raw  = data.choices?.[0]?.message?.content?.trim()

  if (!raw) throw new Error('Groq returned empty response')

  // Strip any accidental markdown code fences
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  const tips    = JSON.parse(cleaned)

  if (!Array.isArray(tips) || tips.length === 0) {
    throw new Error('Groq response was not a valid array')
  }

  // Normalise bilingual tips and fetch Unsplash images in parallel
  const normalised = tips.slice(0, 10).map((tip, i) => ({
    id:         i + 1,
    en: {
      title:    tip.en?.title    || tip.title    || 'Wellness Tip',
      summary:  tip.en?.summary  || tip.summary  || '',
      fullText: tip.en?.fullText || tip.en?.text || tip.fullText || tip.text || tip.summary || '',
    },
    fr: {
      title:    tip.fr?.title    || tip.en?.title    || tip.title    || 'Conseil Bien-être',
      summary:  tip.fr?.summary  || tip.en?.summary  || tip.summary  || '',
      fullText: tip.fr?.fullText || tip.fr?.text    || tip.en?.fullText || tip.fullText || '',
    },
    category:   tip.category === 'hydration' ? 'hydration' : 'nutrition',
    imageTopic: tip.imageTopic || '',
    source:     'MeCal AI',
  }))

  // Fetch all images concurrently — max 10 Unsplash calls per day (cached after)
  const images = await Promise.all(
    normalised.map(tip => fetchUnsplashImage(tip.imageTopic))
  )

  return normalised.map((tip, i) => ({ ...tip, image: images[i] }))
}

// ── Controller ────────────────────────────────────────────────────────────────
export async function getTodaysTips(req, res) {
  try {
    const today    = new Date().toISOString().slice(0, 10)
    const cacheKey = `wellness:tips:groq:v2:${today}`

    // 1. Serve from Redis cache (same tips all day — only 1 Groq call per day)
    const cached = await redisGet(cacheKey)
    if (cached) {
      return res.json({ success: true, source: 'cache', data: JSON.parse(cached) })
    }

    // 2. No key configured — frontend falls back to hardcoded tips
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('PASTE')) {
      return res.json({
        success: true,
        source:  'fallback',
        data:    [],
        message: 'Add GROQ_API_KEY to server/.env to enable AI-generated tips'
      })
    }

    // 3. Generate fresh tips via Groq
    console.log('[Wellness] Generating new tips with Groq...')
    const tips = await generateWithGroq()
    console.log(`[Wellness] Generated ${tips.length} tips. Caching for 24h.`)

    // 4. Cache for exactly 24 hours
    await redisSet(cacheKey, JSON.stringify(tips), 86400)

    return res.json({ success: true, source: 'groq', data: tips })

  } catch (error) {
    console.error('[Wellness] Failed to generate tips:', error.message)
    // Always fall through gracefully — frontend will show hardcoded tips
    return res.json({
      success: true,
      source:  'fallback',
      data:    [],
      message: error.message
    })
  }
}
