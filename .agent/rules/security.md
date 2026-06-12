# security.md — MeCal

## Guiding Principle

MeCal stores sensitive personal data — body metrics, food habits, health goals, and tribal identity. Treat every user's data as if it were your own. Security is not a feature to add later.

---

## Authentication

### JWT in HTTP-only Cookies

- JWT is stored in an HTTP-only cookie — never in localStorage, sessionStorage, or a response body
- The cookie is set server-side on login and cleared on logout
- Cookie config (production):

```js
res.cookie('mecal_token', token, {
  httpOnly: true,
  secure: true,            // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in ms
})
```

- Cookie config (development — `secure: false` only):

```js
res.cookie('mecal_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
})
```

- On logout, clear the cookie:

```js
res.clearCookie('mecal_token', { httpOnly: true, sameSite: 'strict' })
```

### JWT Signing

- Sign with `HS256` using a strong secret (minimum 32 characters, generated randomly)
- Payload contains only `{ userId, iat, exp }` — no email, no role, no personal data in the token
- Always verify the token in middleware before any protected route handler runs

```js
// auth.middleware.js
import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const token = req.cookies.mecal_token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorised' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.userId }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }
}
```

### Password Storage

- Hash passwords with `bcrypt`, minimum cost factor of 12
- Never store plain-text passwords
- Never log passwords at any point

```js
import bcrypt from 'bcrypt'

const hash = await bcrypt.hash(password, 12)
const isMatch = await bcrypt.compare(password, storedHash)
```

---

## Data Scoping

Every database query on user-owned data must filter by `userId`. This is non-negotiable.

```js
// Correct — always scope to the authenticated user
const meals = await prisma.meal.findMany({
  where: {
    userId: req.user.id,
    date: targetDate
  }
})

// Wrong — never query without userId
const meals = await prisma.meal.findMany({
  where: { date: targetDate }
})
```

This applies to: meals, hydration logs, step check-ins, recommendations, history, summaries, and onboarding data.

---

## Environment Variables

- All secrets live in `.env` — never hardcoded in source files
- `.env` is in `.gitignore` — never commit it
- Access env vars only on the server — never on the client (no `VITE_` prefix for secrets)
- Required server env vars:

```
DATABASE_URL
JWT_SECRET
GEMINI_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NODE_ENV
PORT
```

- The only client env var is `VITE_API_BASE_URL` — it points to the backend, not to any secret service

---

## Input Validation

- Validate all incoming request data on the server before it reaches the database or any service
- Never trust client-supplied data
- Validate in middleware before the controller runs
- Check: required fields are present, types are correct, values are within expected ranges

```js
// Example: meal log validation
export function validateMealLog(req, res, next) {
  const { name, calories, servingSize } = req.body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Meal name is required.' })
  }

  if (!calories || typeof calories !== 'number' || calories < 0 || calories > 10000) {
    return res.status(400).json({ success: false, message: 'Invalid calorie value.' })
  }

  next()
}
```

- Sanitise string inputs — strip leading/trailing whitespace at minimum
- Do not return detailed validation errors that expose internal schema structure

---

## Image Upload Security

- Images are uploaded client → our server → Cloudinary
- The client never uploads directly to Cloudinary — this would expose the API secret
- Validate file type and size on the server before sending to Cloudinary:

```js
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5MB

if (!ALLOWED_TYPES.includes(file.mimetype)) {
  return res.status(400).json({ success: false, message: 'Only JPEG, PNG, and WebP images are allowed.' })
}

if (file.size > MAX_SIZE_BYTES) {
  return res.status(400).json({ success: false, message: 'Image must be under 5MB.' })
}
```

- Store only the Cloudinary `secure_url` in the database — never the raw file
- Use Cloudinary's unsigned upload only for dev/testing — always use signed uploads in production

---

## API Key Protection

| Service | Key location | Called from |
|---|---|---|
| Gemini API | Server `.env` only | `server/services/gemini.service.js` |
| Cloudinary | Server `.env` only | `server/services/cloudinary.service.js` |
| Open Food Facts | No key required | `server/services/openfoodfacts.service.js` |

- If any API key is ever accidentally committed, rotate it immediately — do not just delete the commit
- Log API errors server-side — never send raw API error messages to the client

---

## CORS

- Configure CORS to allow only your frontend origin
- Do not use `cors({ origin: '*' })` in production

```js
import cors from 'cors'

app.use(cors({
  origin: process.env.CLIENT_URL,  // e.g. https://mecal.app
  credentials: true                // required for cookies
}))
```

---

## Rate Limiting

- Apply rate limiting to auth routes to prevent brute-force attacks
- Apply rate limiting to the `/api/scan` endpoint to protect Gemini free tier quota

```js
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again later.' }
})

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,
  message: { success: false, message: 'Scanning too fast. Please wait a moment.' }
})

app.use('/api/auth', authLimiter)
app.use('/api/scan', scanLimiter)
```

---

## Database Security

- Use Prisma client for all database operations — never write raw SQL
- Never expose Prisma errors directly in API responses
- Use `select` in Prisma queries to return only the fields the client needs — never return the full user record including password hash

```js
// Correct — select only what is needed
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    calorieGoal: true,
    hydrationGoal: true
    // passwordHash is never selected
  }
})
```

---

## Sensitive Data Handling

- Never log: passwords, JWT tokens, full request bodies on auth routes, or personal health data
- Tribe selection is optional and personal — never expose it in any response that is not scoped to the authenticated user
- Body metrics (weight, height, BMI) are stored and returned only to the owning user
- Do not include sensitive fields in error messages

---

## Error Responses

Never expose internal details in error responses:

```js
// Wrong — exposes internals
res.status(500).json({ error: error.message, stack: error.stack })

// Correct — generic but helpful
res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' })
```

Use a global error middleware as the single place where errors are formatted and logged:

```js
// error.middleware.js — last middleware registered
export function errorHandler(err, req, res, next) {
  console.error(err)  // log internally

  const status = err.status || 500
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong.'
    : err.message

  res.status(status).json({ success: false, message })
}
```

---

## Security Checklist Before Shipping

- [ ] `.env` is in `.gitignore` and not committed
- [ ] JWT is stored in HTTP-only cookie only
- [ ] All protected routes use `authenticate` middleware
- [ ] All database queries filter by `userId`
- [ ] Passwords are hashed with bcrypt (cost 12)
- [ ] Cloudinary uploads go through the server
- [ ] CORS is restricted to the frontend origin
- [ ] Rate limiting is on auth and scan routes
- [ ] No API keys or secrets in client code
- [ ] Error responses contain no stack traces or internal details
- [ ] File upload validates type and size before sending to Cloudinary