# MeCal — Product Requirements Document (PRD)

**Product Name:** MeCal  
**Tagline:** Cultural Nutritional Intelligence & Wellness Platform for West Africa  
**Version:** 2.0 (Post-Scanning Re-architecture)  
**Status:** Active Production  
**Target Regions:** Nigeria, Ghana, Côte d'Ivoire, Senegal, Cameroon, Benin, Togo, Mali, and the West African Diaspora  
**Languages:** English (`en`) & French (`fr`)  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Mainstream nutritional and fitness applications (e.g., MyFitnessPal, Lifesum, Noom) are built around Western dietary habits, packaged barcode scans, and generic metrics. When West African users try to log traditional meals, they encounter:
1. **Severe Food Blindspots:** Inability to log composite local meals (e.g., *Pounded Yam with Egusi & Goat Meat*, *Jollof Rice with Fried Plantain & Smoked Chicken*, *Attiéké with Grilled Tilapia & Pepper Sauce*, *Ndolé*, *Thieboudienne*).
2. **Missing Local Metric Systems:** Universal water trackers count 8 oz glasses or liters, failing to accommodate West Africa's primary packaged drinking water: the **500ml pure water sachet** alongside standard 750ml bottles.
3. **Impersonal, Impractical Advice:** Generic recommendations suggest inaccessible ingredients (kale, blueberries, quinoa) rather than culturally available, nutrient-dense local superfoods (garden eggs, pawpaw, agbalumo, soursop, moringa, local greens).
4. **Language Barriers:** Francophone West Africa (Côte d'Ivoire, Senegal, Benin, Cameroon) is largely ignored by regional nutrition platforms.

### 1.2 The MeCal Solution
MeCal is an emotionally intelligent, culturally grounded wellness companion that accurately tracks West African nutrition, optimizes hydration through local packaging measures, gamifies movement, and generates daily AI-driven meal blueprints tailored to user goals, budget, tribe, and lifestyle.

---

## 2. Core Personas

| Persona | Profile | Core Need |
| :--- | :--- | :--- |
| **Amina (Busy Professional, Lagos)** | 28-year-old marketing manager working in Victoria Island; eats out at bukas and corporate canteens. | Quick composite meal logging; hydration tracking via pure water sachets; weight loss guidance that doesn't ban traditional soups. |
| **Kouamé (Student, Abidjan)** | 22-year-old university student in Côte d'Ivoire on a modest budget; speaks French. | Budget-friendly meal recommendations (garba, alloco, rice); metric tracking in French; weekly meal planning. |
| **Chidi (Fitness Enthusiast, Abuja)** | 34-year-old civil servant targeting clean muscle gain and 10,000 daily steps. | High-protein West African food options (boiled eggs, suya, fish, beans); macro breakdown; daily activity logging. |

---

## 3. Product Features & Functional Requirements

### 3.1 Onboarding & Cultural Profiling
* **Body Metrics:** Age, biological gender, current weight (kg/lbs), height (cm/ft), target weight.
* **Fitness Goals:** Weight Loss (`lose`), Weight Maintenance (`maintain`), Muscle/Weight Gain (`gain`).
* **Duration Commitment:** 1 month (30 days), 3 months (90 days, recommended), 6 months (180 days), or custom duration.
* **Regional & Cultural Calibration:** Country selection (Nigeria, Ghana, Senegal, Côte d'Ivoire, etc.) and Culinary Tribe (Yoruba, Igbo, Hausa, Akan, Wolof, Baoulé, General/Mixed).
* **Lifestyle & Budget Filters:** Student (quick & budget-friendly), Professional (desk & commute), Mixed/Flexible; Budget level (Low/Market staples, Moderate, Flexible/Premium).
* **Hydration Preference:** Default unit selection between **Sachet Pure Water (500ml)** and **Water Bottle (750ml)**.
* **Allergy Exclusions:** Groundnuts, crayfish, dairy, wheat, fish, eggs, or custom ingredients.

### 3.2 Personalized AI Blueprint & Plan Recalibration Wizard
* **7-Step Multi-Step Wizard:** Accessible anytime from the user profile to recalibrate goals.
* **Live Blueprint Generation:** Powered by **Google Gemini 3.8 Flash** with immediate fallback to dynamic Mifflin-St Jeor + WHO formulas.
* **Vertical Metric Cards Display:** High-visibility stacked cards showcasing Calorie Target (kcal/day), Daily Hydration (sachets or bottles), and Daily Step Goal.
* **Day 1 Timeline Reset:** Activating a new plan resets the tracking cycle to Day 1, updates the user's progress timeline, clears stale recommendation caches, and refreshes the dashboard.

### 3.3 Authentic Food Logging & Nutritional Intelligence
* **Composite Meal Engine:** Seamlessly combines base dishes (swallow/rice), soups/sauces, proteins (beef, fish, chicken, eggs), and oil preparation levels (light, standard, heavy palm/vegetable oil).
* **Portion Scaling:** Accurate measurement by local portions (wraps, cups, ladles, pieces, spoons).
* **Personal Food Library:** Save favorite and frequent meals for single-tap logging in under 3 seconds.
* **Manual Custom Meal Entry:** Full manual entry with macro breakdown (Calories, Protein, Carbs, Fats) and meal period assignment (Breakfast, Lunch, Dinner, Snack).

### 3.4 Daily AI Recommendations & Fruit Rotation
* **Dynamic Daily Blueprints:** Rotates 3 culturally grounded meals (Light, Medium, Heavy) and 3 light local snacks daily so users never see repetitive menus.
* **Goal-Aligned Fruit Recommendations:**
  * *Weight Loss:* Low-calorie, high-fiber, hydrating fruits (Watermelon, Garden Eggs & Cucumber, Grapefruit, Papaya, Agbalumo).
  * *Weight Gain:* Nutrient-dense fruits (Bananas, Avocado, Dates, Fresh Coconut, Mango).
* **Bilingual Support:** All recommendations natively generated in English or French according to user locale.

### 3.5 Localized Hydration Tracker
* **Sachet & Bottle Units:** Switch on-the-fly between 500ml sachets and 750ml bottles.
* **Dynamic Hydration Target:** Auto-calculated using standard body weight formulas (35ml/kg) adjusted for physical activity levels.
* **Quick Log Controls:** Incremental `+1` / `-1` logging with animated visual liquid progress.

### 3.6 Movement & Step Check-in
* **Daily Movement Tracking:** Log daily step counts against calibrated goals (5,000 to 10,000+ steps).
* **Active Minutes & Calorie Burn Calculation:** Record workout duration and calculate energy expenditure.
* **Device Guidance:** Visual instructions for tracking steps via built-in phone sensors (Apple Health, Google Fit, Samsung Health).

### 3.7 Weekly Timetable & Meal Planner
* **Weekly Grid:** Schedule planned meals across Monday through Sunday.
* **Meal Categorization:** Breakfast, Lunch, Dinner, and Afternoon Snack slots.
* **Direct Kitchen Execution:** Keeps users consistent with their weekly grocery budget and schedule.

### 3.8 Health Articles & Curated Wellness Tips
* **Daily Rotating Articles:** Evidence-backed wellness advice tailored to West African lifestyles (managing palm oil, portion control at events, hydration in tropical heat, salt reduction).
* **Bookmark Library:** Save helpful tips to personal library for offline reference.

### 3.9 Progress Analytics & Milestones
* **Day Selector Bar:** Visual horizontal date bar tracking progress from Day 1 to goal completion.
* **Single-Ring Calorie Visualizer:** Clean, high-contrast circular progress tracker.
* **Milestone Chips:** Achievement badges unlocked through daily consistency (e.g. *First Meal Logged*, *Hydration Target Hit*, *Active Dance Rhythm*).

---

## 4. Technical Architecture

```
                       ┌─────────────────────────────────────────┐
                       │            React.js Client              │
                       │     Vite • Zustand • Vanilla CSS        │
                       │     i18next (EN/FR) • Lucide Icons      │
                       └────────────────────┬────────────────────┘
                                            │ HTTP / JSON (Axios)
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │          Node.js / Express API          │
                       │      JWT Auth • Upstash RateLimiter     │
                       │         Sentry Error Telemetry          │
                       └─────┬─────────────────────────────┬─────┘
                             │                             │
                  Prisma ORM │                             │ REST Fetch
                             ▼                             ▼
        ┌───────────────────────────────┐   ┌───────────────────────────────┐
        │     PostgreSQL (Supabase)     │   │      External AI & APIs       │
        │   Row-Level Security (RLS)    │   │  • Gemini 3.8 Flash (Primary) │
        │ Tables: User, Meal, SavedMeal │   │  • Groq LLaMA-3 (Fallback)    │
        │         WaterLog, Activity    │   │  • Upstash Redis (Cache)      │
        └───────────────────────────────┘   │  • Unsplash (Food Visuals)    │
                                            └───────────────────────────────┘
```

---

## 5. Security & Privacy Non-Negotiables

1. **Row-Level Security (RLS):** Enabled and enforced across all database tables (`User`, `Meal`, `SavedMeal`, `WaterLog`, `Activity`). Users can only query and mutate their own data.
2. **Encrypted Authentication:** Passwords hashed with `bcrypt` (12 rounds); session tokens handled via HTTP-only, secure, SameSite cookies.
3. **No Invasive Third-Party Trackers:** No third-party ad networks or data brokering; health metrics remain private.
4. **Resilient Offline / Fallback Operation:** Dynamic formulas and deterministic local rotation ensure 100% app functionality even during cloud AI outages.

---

## 6. Deprecated & Removed Features (v2.0)

* ❌ **Camera & Barcode Scanning:** Removed in favor of rapid, accurate composite manual logging and the cultural food database (due to high error rates of computer vision on complex African soups and stews).
* ❌ **Cloudinary Photo Uploads:** Replaced with curated high-resolution visual food assets from Unsplash and local SVGs.
* ❌ **Blue Case Study Palette:** Restored to the original, brand-authentic **Forest Emerald Green** palette (`--color-primary-hsl: 142, 72%, 29%`).
