# code-style.md — MeCal

## Guiding Principle

Write code that reads like plain English. Clarity over cleverness. Consistency over preference.

---

## Language

- JavaScript only — no TypeScript
- ESNext syntax — use modern JS features (optional chaining, nullish coalescing, destructuring, spread)
- `async/await` always — no `.then()` chains
- `const` by default — `let` only when reassignment is needed — never `var`

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `MealCard.jsx` |
| Hooks | camelCase, `use` prefix | `useMealLog.js` |
| Services | camelCase, `.service.js` suffix | `meal.service.js` |
| Store slices | camelCase, `Store` suffix | `mealStore.js` |
| Utility functions | camelCase | `formatCalories.js` |
| CSS Module files | Match component name | `MealCard.module.css` |
| Route files | camelCase, `.routes.js` suffix | `meal.routes.js` |
| Controller files | camelCase, `.controller.js` suffix | `meal.controller.js` |
| Variables | camelCase, descriptive | `dailyCalorieGoal` |
| Boolean variables | `is`, `has`, or `can` prefix | `isLoading`, `hasTracked` |
| Constants | UPPER_SNAKE_CASE | `MAX_HYDRATION_UNITS` |
| Event handlers | `handle` prefix | `handleScanSubmit` |

---

## File Structure — React Component

```jsx
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party imports
import { Camera } from 'lucide-react'

// 3. Internal imports — store, hooks, services, utils
import { useMealLog } from '../../hooks/useMealLog'
import { formatCalories } from '../../utils/formatCalories'

// 4. CSS Module import — always last
import styles from './MealCard.module.css'

// 5. Component — named export always
export function MealCard({ meal, onEdit }) {
  // 5a. Hooks at the top
  const { logMeal } = useMealLog()
  const [isExpanded, setIsExpanded] = useState(false)

  // 5b. Derived values
  const displayCalories = formatCalories(meal.calories)

  // 5c. Handlers
  function handleToggle() {
    setIsExpanded(prev => !prev)
  }

  // 5d. Effects last
  useEffect(() => {
    // ...
  }, [meal.id])

  // 5e. Return
  return (
    <div className={styles.card}>
      {/* ... */}
    </div>
  )
}
```

---

## File Structure — Express Route + Controller

**Route file:**
```js
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { logMeal, getMeals, deleteMeal } from '../controllers/meal.controller.js'

const router = Router()

router.post('/', authenticate, logMeal)
router.get('/', authenticate, getMeals)
router.delete('/:id', authenticate, deleteMeal)

export default router
```

**Controller file:**
```js
import { createMealEntry, fetchMealsByDate } from '../services/meal.service.js'

export async function logMeal(req, res, next) {
  try {
    const meal = await createMealEntry(req.user.id, req.body)
    res.status(201).json({ success: true, data: meal })
  } catch (error) {
    next(error)
  }
}
```

**Service file:**
```js
import { prisma } from '../lib/prisma.js'

export async function createMealEntry(userId, data) {
  return prisma.meal.create({
    data: {
      userId,
      name: data.name,
      calories: data.calories,
      // ...
    }
  })
}
```

---

## Component Rules

- Functional components only — no class components
- One component per file
- Props should be destructured in the function signature
- Do not use default exports for components — named exports only
- Keep components under 150 lines — split if larger
- No logic inside JSX — extract to a variable or handler above the return

```jsx
// Wrong
return (
  <div className={user.isActive ? styles.active : styles.inactive}>
    {meals.filter(m => m.date === today).map(m => <MealCard key={m.id} meal={m} />)}
  </div>
)

// Correct
const containerClass = user.isActive ? styles.active : styles.inactive
const todaysMeals = meals.filter(m => m.date === today)

return (
  <div className={containerClass}>
    {todaysMeals.map(m => <MealCard key={m.id} meal={m} />)}
  </div>
)
```

---

## Hooks Rules

- Call hooks only at the top level of a component — never inside conditionals or loops
- Custom hooks must start with `use`
- Each custom hook should have one clear responsibility
- Return only what the caller needs — do not return the whole store slice

---

## Error Handling

**Client:**
- Wrap all service calls in try/catch inside hooks
- Never surface raw error messages to the user — use friendly, brand-consistent messages
- Use a `uiStore` to manage global error and loading states

```js
// Inside a hook
async function handleLogMeal(data) {
  try {
    setLoading(true)
    const result = await mealService.log(data)
    // update store
  } catch {
    setError('Could not save your meal. Try again.')
  } finally {
    setLoading(false)
  }
}
```

**Server:**
- All controllers use try/catch and pass errors to `next(error)`
- A single global error middleware handles all thrown errors
- Never send stack traces in production responses
- Use consistent error response shape:

```js
// Error response shape
{ success: false, message: 'Human-readable message' }

// Success response shape
{ success: true, data: { ... } }
```

---

## Imports

- No default exports from components — use named exports
- Group imports in this order, separated by a blank line:
  1. React
  2. Third-party libraries
  3. Internal (store, hooks, services, utils, components)
  4. CSS Module
- Use relative paths for internal imports — no path aliases

---

## Async Patterns

```js
// Always async/await
async function fetchRecommendations(userId) {
  const data = await recommendationService.get(userId)
  return data
}

// Never .then()
recommendationService.get(userId).then(data => { ... }) // ✗
```

---

## What Not to Do

- No `console.log` in committed code — use a proper logger on the server (`console.error` only in catch blocks during development)
- No inline styles in JSX — use CSS Modules
- No business logic inside components or route files
- No `any` assumptions — validate data shape before using it
- No commented-out code blocks committed to the repo
- Do not mutate state directly — always use store setters or `useState` setters
- Do not nest ternaries — use if/else or early returns