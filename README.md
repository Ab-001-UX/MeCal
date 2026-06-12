# MeCal 💧🥣🏃‍♂️
### *Private AI Wellness Companion for West African Meals, Hydration, and Movement*

MeCal is a personalized, AI-powered health and wellness application designed specifically with West African dietary patterns, lifestyles, and preferences in mind. It helps users track their nutrition, water intake, daily activity, and receive customized health insights.

---

## 🌟 Key Features

- **AI-Powered Meal Analyzer:** Snap a picture of local West African dishes (e.g., Jollof rice, Suya, Edikaikong, Fufu) and get instant estimations of calories, protein, carbs, and fats powered by Gemini and Groq AI.
- **Regional Personalization:** Tailors calorie and lifestyle goals based on your country, tribe, budget preference, and local food availability.
- **Flexible Water Tracker:** Log hydration in standard glasses, bottles, or local **sachet water** (pure water) measures.
- **Activity & Movement Logging:** Track your steps and active minutes to calculate calories burned.
- **Dual Language Support:** Fully localized in **English** and **French** to serve diverse West African communities.
- **Secure & Private:** Row-Level Security (RLS) enabled on all database levels to protect personal health metrics.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework:** React.js (Vite)
- **State Management:** Zustand
- **Internationalization:** i18next
- **APIs:** Axios, Lucide Icons, Canvas Confetti
- **Hosting:** Vercel

### Backend (Server)
- **Framework:** Node.js, Express.js
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Supabase)
- **Rate Limiting & Security:** Upstash Redis, Cookie Parser, JWT Auth
- **Telemetry:** Sentry (Performance and Error Monitoring)
- **Hosting:** Render

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **git** installed.

### 2. Backend Setup (`/server`)
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your keys:
   ```env
   DATABASE_URL="your-postgresql-url"
   DIRECT_URL="your-postgresql-direct-url"
   JWT_SECRET="your-secret"
   GEMINI_API_KEY="your-gemini-key"
   CLOUDINARY_URL="your-cloudinary-url"
   TERMII_API_KEY="your-termii-key"
   GROQ_API_KEY="your-groq-key"
   UNSPLASH_ACCESS_KEY="your-unsplash-key"
   UPSTASH_REDIS_REST_URL="your-upstash-url"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
   ```
4. Generate Prisma client & Start the server:
   ```bash
   npx prisma generate
   npm run dev
   ```

### 3. Frontend Setup (`/client`)
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_SENTRY_DSN="your-sentry-dsn"
   VITE_POSTHOG_KEY="your-posthog-key"
   VITE_POSTHOG_HOST="https://us.i.posthog.com"
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

---

## 🌍 Deployment Configuration

### Backend (Render)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** `server`
- Configure all environment variables in the Render dashboard.

### Frontend (Vercel)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `client`
- API requests hitting `/api/*` are dynamically proxy-forwarded to your Render URL via `vercel.json`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
