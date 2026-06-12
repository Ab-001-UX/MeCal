# architecture.md — MeCal

## Guiding Principle

The client handles UI and user interaction. The server handles all business logic, data, and external API calls. These two never blur.

---

## Project Structure

```
mecal/
├── client/
│   └── src/
│       ├── assets/          # Static images, icons, fonts
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level components only
│       ├── store/           # Zustand store slices
│       ├── services/        # Axios functions — one file per domain
│       ├── hooks/           # Custom React hooks
│       ├── styles/          # tokens.css + global.css only
│       └── utils/           # Pure, stateless helper functions
│
└── server/
    ├── routes/              # Express route declarations
    ├── controllers/         # Request/response handling
    ├── middleware/           # Auth, validation, error handling
    ├── services/            # Business logic + external API calls
    ├── prisma/
    │   └── schema.prisma
    └── index.js
```

---

## Layer Responsibilities

### Client

**`pages/`**
- One file per route
- Handles layout and composes components
- Fetches data via service functions — no direct Axios calls inside pages
- No business logic lives here

**`components/`**
- Reusable, self-contained UI pieces
- Receive data via props — never fetch their own data unless it is a self-contained widget (e.g. a date picker)
- No Zustand store access inside presentational components — pass data as props
- Container components (that connect to store or services) live here too but are clearly named: `MealLogContainer.jsx`

**`services/`**
- All Axios calls live here — one file per domain
- Examples: `meal.service.js`, `auth.service.js`, `scan.service.js`
- Returns plain data or throws errors — no UI logic
- Never called directly inside JSX — always called from a hook or an event handler

**`store/`**
- Zustand slices only
- One file per domain slice: `userStore.js`, `trackingStore.js`, `hydrationStore.js`, `mealStore.js`, `uiStore.js`
- Stores only: global UI state, authenticated user data, and locally queued offline actions
- Server responses do not live in Zustand permanently — fetch fresh or cache in a hook

**`hooks/`**
- Custom hooks that combine store access + service calls
- Example: `useMealLog.js` handles calling the meal service, updating the store, and handling errors
- All data-fetching logic belongs in a hook, not in a component

**`utils/`**
- Pure functions with no side effects
- Examples: `formatCalories.js`, `getCompletionScore.js`, `getTribeList.js`
- No imports from store, services, or components

### Server

**`routes/`**
- Declares routes and maps them to controllers
- No logic here — only `router.get(path, middleware, controller)`
- Group by domain: `auth.routes.js`, `meal.routes.js`, `scan.routes.js`, `user.routes.js`

**`controllers/`**
- Handles `req`, `res`, `next` only
- Calls service functions and returns responses
- No direct Prisma calls — that belongs in services
- No external API calls — that belongs in services

**`services/`**
- All business logic lives here
- All external API calls: Gemini, Cloudinary, Open Food Facts
- All Prisma queries
- One file per domain: `gemini.service.js`, `cloudinary.service.js`, `meal.service.js`, `auth.service.js`
- Functions are async and throw descriptive errors — controllers catch them

**`middleware/`**
- `auth.middleware.js` — JWT verification on protected routes
- `validate.middleware.js` — request body validation
- `error.middleware.js` — global error handler, last middleware in the chain

---

## Data Flow

```
User action
  → Component event handler
    → Custom hook
      → Client service (Axios)
        → Express route
          → Auth middleware
            → Controller
              → Server service
                → Prisma / External API
              ← Returns data
            ← Controller sends response
          ← Axios receives response
        ← Hook updates store or local state
      ← Component re-renders
```

---

## API Route Naming

- All routes prefixed with `/api`
- RESTful, lowercase, hyphenated

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/user/profile
PUT    /api/user/profile

POST   /api/scan
POST   /api/meals
GET    /api/meals?date=YYYY-MM-DD
DELETE /api/meals/:id

GET    /api/recommendations
GET    /api/history/:date
GET    /api/summary/weekly
GET    /api/summary/monthly

POST   /api/hydration/log
POST   /api/steps/checkin
```

---

## Offline Architecture

- Offline support is handled on the client using IndexedDB
- Read `skills/offline-first/SKILL.md` before implementing any offline feature
- Queue pattern: if the user is offline, the action is saved to IndexedDB with a `pending` status
- On reconnect, a sync function processes the queue in order and sends each action to the server
- Features that must work offline: meal logging, hydration tap, step check-in
- Features that do not need to work offline: recommendations, history, summaries

---

## Environment Variables

Client (prefixed with `VITE_`):
```
VITE_API_BASE_URL=http://localhost:5000
```

Server:
```
DATABASE_URL=
JWT_SECRET=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NODE_ENV=
PORT=
```

- Never commit `.env` files
- Never access server env vars on the client
- Never expose `GEMINI_API_KEY` or `CLOUDINARY_API_SECRET` to the frontend

---

## Rules

- Business logic never lives in a route file or a React component
- Prisma is never imported outside of `server/services/`
- Axios is never called directly inside a React component or page
- External API calls always go through the server — never directly from the client
- Each file has one clear responsibility
- If a file is doing two things, split it