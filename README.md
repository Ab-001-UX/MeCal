# MeCal 🌿🥣💧🏃‍♂️

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.12-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.8_Flash-4285F4?logo=google&logoColor=white)

**Cultural Nutritional Intelligence & Wellness Platform for West African Diets, Hydration, and Movement.**

[Features](#-key-features) • [Architecture](#-system-architecture) • [Setup Guide](#-local-development-setup) • [PRD Document](PRD.md) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

Most mainstream health and fitness apps are built around Western dietary norms and packaged supermarket foods. When people eat traditional West African meals, standard trackers fail to account for composite soups, swallowed staples, cooking oils, or local water units like pure water sachets.

**MeCal** solves this disconnect with an AI-driven, culturally grounded wellness companion engineered specifically for West Africa:
* Accurately logs authentic meals (e.g. *Jollof rice, Egusi soup, Pounded Yam, Ewa Agoyin, Attiéké, Ndolé, Thieboudienne*).
* Tracks hydration natively in **500ml pure water sachets** and **750ml bottles**.
* Calibrates daily calorie, macronutrient, and step targets according to individual culture, tribe, budget, and lifestyle.
* Fully localized in **English** and **French** for Anglophone and Francophone communities.

---

## 🌟 Key Features

### 🥗 Authentic West African Nutritional Intelligence
* **Composite Meal Logging:** Break down plates into base staples, local soups/sauces, proteins (beef, fish, chicken, eggs), and oil preparation levels (light, standard, heavy).
* **Portion Scaling:** Measure using everyday local units (wraps, cups, ladles, pieces, spoons).
* **Saved Meal Library:** Bookmark frequent home-cooked or buka meals for one-tap logging.

### 🪄 AI Blueprint & Plan Recalibration Wizard
* **7-Step Personalization Flow:** Re-calibrate targets anytime based on refreshed weight, target duration, lifestyle, and dietary preferences.
* **Google Gemini 3.8 Flash:** Generates daily calorie, hydration, and step targets tailored to your timeline.
* **Stacked Visual Cards:** Clean, modern cards displaying Calorie Goal (kcal/day), Hydration (sachets or bottles), and Step Goal.
* **Day 1 Reset:** Automatically resets progress tracking to Day 1 whenever a refreshed plan is activated.

### 💧 Localized Hydration Tracker
* **Sachet & Bottle Support:** Log water intake with one tap using 500ml sachet or 750ml bottle units.
* **Dynamic Targets:** Hydration goals adapt based on body weight (35ml/kg) and daily activity level.

### 🏃‍♂️ Activity & Step Check-in
* **Daily Movement Tracking:** Set and track step targets (5,000 to 10,000+ steps).
* **Active Energy Burn:** Log workout duration and active calories burned.
* **Device Guidance:** Visual instructions for step tracking via Apple Health, Google Fit, and Samsung Health.

### 📅 Weekly Meal Timetable & Planner
* **7-Day Meal Scheduler:** Plan Breakfast, Lunch, Dinner, and Snacks across the week.
* **Budget Consistency:** Helps users plan market shopping and avoid impromptu high-calorie spending.

### 📰 Curated Wellness Articles & Tips
* **Daily Rotating Insights:** Localized lifestyle, portion control, and nutrition guidance.
* **Bookmark Library:** Save and revisit tips directly from your profile.

### 🌍 Bilingual & Accessible Design
* **English & French (i18n):** Native language toggling across every view.
* **Dark & Light Modes:** Tailored contrast with a signature Forest Emerald Green design system.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 8, Zustand (State Management), Vanilla CSS Modules, CSS Tokens, i18next, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js (REST API, JWT Cookie Auth, Security Middleware) |
| **Database** | PostgreSQL hosted on Supabase, managed via Prisma ORM with Row-Level Security (RLS) |
| **Caching & Limits** | Upstash Redis (Rate limiting and AI recommendation caching) |
| **Artificial Intelligence**| Google Gemini 3.8 Flash (Primary) & Groq LLaMA-3 (Fallback) |
| **Media Assets** | Unsplash Developer API & Local SVG Icons |
| **Telemetry** | Sentry (Error Tracking & Performance Monitoring), PostHog (Product Analytics) |
| **Deployment** | Vercel (Client SPA) & Render (Node API Server) |

---

## 🏛️ System Architecture

```
  Client (Vite + React)                API Server (Express)              Databases & AI Services
┌───────────────────────┐            ┌───────────────────────┐         ┌─────────────────────────┐
│ • UI Views & Modals   │            │ • Auth (JWT Cookies)  │         │ PostgreSQL (Supabase)   │
│ • Zustand State Store │ ──HTTP───> │ • Goal Recalculation  │ ──ORM─> │ • User, Meal, WaterLog  │
│ • i18next Localization│  (Axios)   │ • Caching Middleware  │         │ • Row-Level Security    │
│ • Forest Green Tokens │            │ • Health & Analytics  │         └─────────────────────────┘
└───────────────────────┘            └───────────┬───────────┘                      │
                                                 │                                  │
                                                 ▼                                  ▼
                                     ┌───────────────────────┐         ┌─────────────────────────┐
                                     │ External Services     │ <───────│ Upstash Redis (Cache)   │
                                     │ • Gemini 3.8 Flash    │         │ Sentry (Error Logs)     │
                                     │ • Groq LLaMA-3        │         │ Unsplash Food API       │
                                     └───────────────────────┘         └─────────────────────────┘
```

---

## 📂 Project Directory Structure

```
MeCal/
├── PRD.md                  # Comprehensive Product Requirements Document
├── README.md               # GitHub Documentation
├── package.json            # Root workspaces / orchestration scripts
├── vercel.json             # Vercel SPA routing and /api proxy configuration
│
├── client/                 # React Frontend (Vite)
│   ├── index.html          # App entry point
│   ├── vite.config.js      # Vite configuration & dev proxy
│   ├── src/
│   │   ├── App.jsx         # Routes, AuthGate, Theme listener
│   │   ├── main.jsx        # App bootstrap & Sentry initialization
│   │   ├── i18n.js         # i18next configuration
│   │   ├── components/     # Layout, Navigation, SyncStatus, Modals
│   │   ├── locales/        # en.json and fr.json localization strings
│   │   ├── pages/          # Home, Profile, NewPlanWizard, Log Meal, Analytics, etc.
│   │   ├── services/       # Axios API client integrations
│   │   ├── store/          # Zustand stores (userStore, trackingStore, uiStore)
│   │   └── styles/         # tokens.css (Theme tokens) & global.css
│   └── public/             # Static icons, manifest, favicon
│
└── server/                 # Node.js Express API
    ├── index.js            # Express server bootstrap & RLS validation
    ├── controllers/        # Auth, Meal, Water, Activity, Analytics controllers
    ├── routes/             # Express route declarations
    ├── services/           # Gemini AI, Groq fallback, Prisma client, Redis cache
    ├── utils/              # Date and user serialization helpers
    └── prisma/
        └── schema.prisma   # PostgreSQL database schema & migrations
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **yarn**
* A free [Supabase](https://supabase.com) PostgreSQL database or local PostgreSQL instance
* A free [Google AI Studio](https://aistudio.google.com) API key for Gemini

---

### 2. Backend Setup (`/server`)

1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Populate your `.env` variables:
   ```env
   DATABASE_URL="postgresql://postgres:password@your-db-host:5432/postgres?connection_limit=3&pool_timeout=20"
   DIRECT_URL="postgresql://postgres:password@your-db-host:5432/postgres"
   JWT_SECRET="your-super-secure-jwt-secret-string"
   PORT=5001
   CLIENT_URL="http://localhost:3000"

   # AI Integration
   GEMINI_API_KEY="your-gemini-api-key"
   GROQ_API_KEY="your-groq-fallback-key"

   # Visual Assets & Caching
   UNSPLASH_ACCESS_KEY="your-unsplash-access-key"
   UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

   # Optional: Sentry error monitoring
   SENTRY_DSN="your-sentry-dsn"
   ```

5. Push the schema to your database and generate the Prisma Client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```
   *The server runs by default on `http://localhost:5001`.*

---

### 3. Frontend Setup (`/client`)

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   VITE_SENTRY_DSN="your-sentry-client-dsn"
   VITE_POSTHOG_KEY="your-posthog-key"
   VITE_POSTHOG_HOST="https://us.i.posthog.com"
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The client runs by default on `http://localhost:3000` with hot-module reloading.*

---

## 🌍 Production Deployment

### Backend (Render / Railway / Fly.io)
* **Build Command:** `npm install && npx prisma generate`
* **Start Command:** `node index.js`
* **Root Directory:** `server`
* Add all environment variables from `server/.env` into your hosting dashboard.

### Frontend (Vercel)
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Root Directory:** `client`
* Configure `vercel.json` with reverse proxy rules so `/api/*` routes are seamlessly forwarded to your deployed backend domain without CORS issues.

---

## 🔒 Security & Data Integrity

* **Row-Level Security (RLS):** All Supabase tables have RLS enabled, ensuring users cannot access or tamper with data belonging to other accounts.
* **HTTP-Only Cookies:** Authentication tokens are stored in secure, `SameSite=Lax` HTTP-only cookies to protect against XSS token theft.
* **Privacy Focused:** Personal health metrics, meal entries, and hydration logs are never shared or sold to third-party ad networks.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
