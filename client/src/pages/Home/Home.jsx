import React, { useState, useEffect, useRef } from 'react'
import { useUserStore } from '../../store/userStore'
import { useTrackingStore } from '../../store/trackingStore'
import styles from './Home.module.css'
import HomeSkeleton from './HomeSkeleton.jsx'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dumbbell, Droplet, Wheat, Flame, Footprints, ChevronRight, ChevronDown, Calendar, Zap, ThumbsUp, Leaf, Trash2, Pencil, MoreVertical, Camera, CheckCircle2, Lightbulb, Sparkles, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getRecommendations } from '../../services/meal.service.js'
import { logStepGoalReport } from '../../services/activity.service.js'
import { queueOrExecute } from '../../utils/syncQueue.js'
import { getDynamicCalorieAndMacroGoals, getDynamicWaterGoal, getDynamicStepsGoal } from '../../utils/goals.js'
import { useUiStore } from '../../store/uiStore'
import '../../i18n'

// ─────────────────────────────────────────────
// Curated African food image lookup
// Maps common meal keywords → accurate image URL
// ─────────────────────────────────────────────
const FOOD_IMAGE_MAP = [
  // Swallows and staples (Eba, Fufu, Tuwo, Masa, etc.)
  { keys: ['eba', 'garri', 'gari', 'fufu', 'fufuo', 'banku', 'kenkey', 'tuwo', 'masa', 'foutou', 'plakali', 'swallow'], url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop' },
  // Soups and Sauces (Egusi, Okra, Oha, Miyan, Ewedu, etc.)
  { keys: ['egusi', 'soup', 'sauce', 'okra', 'okro', 'ewedu', 'oha', 'kuka', 'taushe', 'stew', 'kedjenou'], url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop' },
  // Amala & Ewedu specifically
  { keys: ['amala'], url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop' },
  // Rice dishes (Jollof, Waakye, Thieboudienne, Garba, etc.)
  { keys: ['jollof', 'rice', 'waakye', 'thiéboudienne', 'thieboudienne', 'ceebu', 'yassa', 'maffé', 'maffe', 'garba', 'attiéké', 'attieke'], url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
  // Pounded Yam
  { keys: ['pounded yam', 'poundo'], url: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=400&h=300&fit=crop' },
  // Bean pudding and fritters (Moi Moi, Akara, Okpa)
  { keys: ['moi moi', 'moimoi', 'akara', 'okpa'], url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop' },
  // Porridge and Breakfast pap (Ogi, Pap, Akamu, Kunun, Custard)
  { keys: ['ogi', 'pap', 'akamu', 'kunun', 'gyada', 'custard'], url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop' },
  // Grilled Meats (Suya, Kilishi, Nkwobi, Gizzard, Beef, Lamb)
  { keys: ['suya', 'kilishi', 'nkwobi', 'gizzard', 'beef', 'lamb', 'goat', 'meat', 'dambu'], url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop' },
  // Plantains, Tubers & Fries (Dodo, Boli, Sweet Potato, Yam)
  { keys: ['plantain', 'boli', 'dodo', 'sweet potato', 'yam', 'tuber', 'chips'], url: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=400&h=300&fit=crop' },
  // Poultry & Seafood (Chicken, Fish, Tilapia, Prawns, Catfish, Crab)
  { keys: ['chicken', 'poulet', 'fish', 'tilapia', 'seafood', 'prawn', 'crab', 'mackerel'], url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=300&fit=crop' },
  // Salad, Fruits and light greens (Abacha, Fruits, Salad)
  { keys: ['abacha', 'fruit', 'salad', 'vegetable', 'ugu', 'garden egg'], url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
  // Eggs
  { keys: ['egg', 'eggs', 'omelette'], url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop' },
  // Fura & Dairy
  { keys: ['fura', 'nono', 'yogurt', 'milk', 'dairy'], url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
  // Fritters and light snacks (Chin chin, Puff puff, Peanuts, Groundnuts, Dates)
  { keys: ['chin chin', 'puff puff', 'peanut', 'peanuts', 'groundnut', 'groundnuts', 'dates', 'trail'], url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop' }
]

export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23F3F4F6"/><g transform="translate(188, 100)" stroke="%239CA3AF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><circle cx="12" cy="13" r="3"/></g><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="%239CA3AF">Meal photo unavailable</text></svg>`

export function getFoodImage(mealName) {
  if (!mealName) return null
  const lower = mealName.toLowerCase()
  for (const entry of FOOD_IMAGE_MAP) {
    if (entry.keys.some(k => lower.includes(k))) {
      return entry.url
    }
  }
  return null
}

export function MealImage({ mealName, imageUrl, className, lang }) {
  const [hasError, setHasError] = useState(false)
  const [retryWithLocal, setRetryWithLocal] = useState(false)
  const isFr = lang === 'fr'

  if (hasError) {
    return (
      <div className={`${styles.imagePlaceholder} ${className}`}>
        <Camera size={20} className={styles.placeholderIcon} />
        <span className={styles.placeholderText}>{isFr ? 'Photo indisponible' : 'Meal photo unavailable'}</span>
        <span className={styles.placeholderSubtext}>{isFr ? "L'IA n'a pas pu obtenir l'image" : 'AI could not get image'}</span>
      </div>
    )
  }

  let src = imageUrl || `/api/image/generate?q=${encodeURIComponent(mealName)}`
  if (retryWithLocal) {
    const local = getFoodImage(mealName)
    if (local) {
      src = local
    } else {
      return (
        <div className={`${styles.imagePlaceholder} ${className}`}>
          <Camera size={20} className={styles.placeholderIcon} />
          <span className={styles.placeholderText}>{isFr ? 'Photo indisponible' : 'Meal photo unavailable'}</span>
          <span className={styles.placeholderSubtext}>{isFr ? "L'IA n'a pas pu obtenir l'image" : 'AI could not get image'}</span>
        </div>
      )
    }
  }

  return (
    <img
      src={src}
      alt={mealName}
      className={className}
      loading="lazy"
      onError={() => {
        if (!retryWithLocal) {
          setRetryWithLocal(true)
        } else {
          setHasError(true)
        }
      }}
    />
  )
}

export const MEAL_RECOMMENDATIONS = {
  'Nigeria_Yoruba': {
    low: {
      heavy: {
        name: "Eba & Ewedu Soup with Akra (Fish)",
        description: "Standard Yoruba swallow. Economical, high satiety, and low in fats.",
        calories: 850, protein: 32, carbs: 105, fat: 18, emoji: "🍲"
      },
      medium: {
        name: "Ogi (Pap) & Akara (Bean Cakes)",
        description: "Light Yoruba staple, rich in protein, budget-friendly and gentle on the stomach.",
        calories: 450, protein: 18, carbs: 65, fat: 12, emoji: "🍘"
      },
      light: {
        name: "Boiled Yam with Garden Egg Stew & Egg",
        description: "Economical and high-protein local breakfast, packed with fiber.",
        calories: 390, protein: 14, carbs: 60, fat: 8, emoji: "🍠"
      }
    },
    moderate: {
      heavy: {
        name: "Pounded Yam & Egusi Soup with Beef",
        description: "Traditional pounded yam classic with rich melon seed soup and lean beef.",
        calories: 950, protein: 45, carbs: 120, fat: 32, emoji: "🍲"
      },
      medium: {
        name: "Jollof Rice with Fried Chicken & Coleslaw",
        description: "Standard Nigerian celebration rice, savory and perfectly seasoned.",
        calories: 680, protein: 28, carbs: 85, fat: 18, emoji: "🍛"
      },
      light: {
        name: "Steamed Moi Moi & Custard",
        description: "Healthy steamed bean pudding paired with warm custard porridge.",
        calories: 380, protein: 15, carbs: 50, fat: 6, emoji: "🍮"
      }
    },
    flexible: {
      heavy: {
        name: "Seafood Okra Soup & Pounded Yam",
        description: "Extravagant premium okra soup with giant prawns, crabs, snails, and fresh fish.",
        calories: 1020, protein: 65, carbs: 130, fat: 25, emoji: "🦞"
      },
      medium: {
        name: "Ofada Rice with Ayamase Sauce & Assorted Meat",
        description: "Premium local brown rice topped with designer green pepper stew and assorted meat.",
        calories: 750, protein: 35, carbs: 90, fat: 28, emoji: "🍛"
      },
      light: {
        name: "Grilled Peppered Gizzard & Sweet Potato Wedges",
        description: "High-protein premium snack, light on fats, packed with local heat.",
        calories: 390, protein: 22, carbs: 45, fat: 10, emoji: "🍢"
      }
    }
  },
  'Nigeria_Igbo': {
    low: {
      heavy: {
        name: "Garri (Eba) with Okra Soup & Mackerel",
        description: "An economical, highly filling traditional cassava swallow with fresh okra.",
        calories: 820, protein: 35, carbs: 100, fat: 16, emoji: "🍲"
      },
      medium: {
        name: "Boiled Yam with Garden Egg Dip",
        description: "Economical high-fiber white yam slices served with a rich garden egg sauce.",
        calories: 480, protein: 10, carbs: 80, fat: 8, emoji: "🍠"
      },
      light: {
        name: "Abacha (African Salad) with Light Fish",
        description: "Light, flavorful shredded cassava salad tossed with palm oil, ugba, and fish.",
        calories: 350, protein: 12, carbs: 50, fat: 10, emoji: "🥗"
      }
    },
    moderate: {
      heavy: {
        name: "Pounded Yam with Oha Soup & Goat Meat",
        description: "Authentic luxury Oha soup cooked with tender goat meat and swallow.",
        calories: 940, protein: 42, carbs: 110, fat: 28, emoji: "🍲"
      },
      medium: {
        name: "Ukwa (African Breadfruit) with Dry Fish",
        description: "Highly nutritious native breadfruit porridge seasoned with dry fish.",
        calories: 600, protein: 22, carbs: 75, fat: 15, emoji: "🍲"
      },
      light: {
        name: "Okpa (Bambara Nut Pudding)",
        description: "High-protein native bean cake, extremely filling and traditional.",
        calories: 390, protein: 18, carbs: 55, fat: 10, emoji: "🥧"
      }
    },
    flexible: {
      heavy: {
        name: "Fisherman's Seafood Soup & Pounded Yam",
        description: "Premium broth featuring fresh crabs, prawns, catfish, and periwinkles.",
        calories: 1050, protein: 60, carbs: 125, fat: 26, emoji: "🦐"
      },
      medium: {
        name: "Yam Porridge with Premium Stockfish & Ugu",
        description: "Rich yam pottage loaded with stockfish, dry fish, and fresh pumpkin leaves.",
        calories: 720, protein: 30, carbs: 95, fat: 22, emoji: "🍲"
      },
      light: {
        name: "Nkwobi (Spicy Cow Foot) & Garden Eggs",
        description: "Premium high-protein Igbo delicacy simmered in a savory spicy palm oil sauce.",
        calories: 380, protein: 25, carbs: 15, fat: 24, emoji: "🥘"
      }
    }
  },
  'Nigeria_Hausa': {
    low: {
      heavy: {
        name: "Tuwo Shinkafa & Miyan Kuka with Beef",
        description: "Budget traditional Hausa rice swallow served with baobab leaf soup.",
        calories: 800, protein: 30, carbs: 105, fat: 15, emoji: "🍲"
      },
      medium: {
        name: "Kunun Gyada (Peanut Pap) & Masa",
        description: "Nutritious groundnut pap served with traditional fermented rice cakes.",
        calories: 490, protein: 14, carbs: 75, fat: 12, emoji: "🥞"
      },
      light: {
        name: "Fura da Nono (Millet & Yogurt)",
        description: "Traditional refreshing millet dough ball mashed into rich local yogurt.",
        calories: 340, protein: 12, carbs: 50, fat: 8, emoji: "🥛"
      }
    },
    moderate: {
      heavy: {
        name: "Tuwo Masara & Miyan Taushe with Goat Meat",
        description: "Standard maize swallow served with rich, aromatic pumpkin soup.",
        calories: 900, protein: 38, carbs: 110, fat: 24, emoji: "🍲"
      },
      medium: {
        name: "Shinkafa da Miyar Taushe",
        description: "Standard boiled rice served with pumpkin stew and beef chunks.",
        calories: 650, protein: 26, carbs: 85, fat: 16, emoji: "🍛"
      },
      light: {
        name: "Kosai (Hausa Akara) & Kunun Kanwa",
        description: "Crispy bean cakes paired with millet gruel spiced with ginger.",
        calories: 360, protein: 14, carbs: 55, fat: 8, emoji: "🍘"
      }
    },
    flexible: {
      heavy: {
        name: "Royal Tuwo Shinkafa with Rich Miyan Geda & Lamb",
        description: "Premium rice swallow served with rich peanut soup and slow-cooked lamb.",
        calories: 980, protein: 48, carbs: 115, fat: 32, emoji: "🍲"
      },
      medium: {
        name: "Traditional Suya (Beef) with Cabbage Salad",
        description: "Premium spicy grilled beef skewers generously seasoned with yaji spice.",
        calories: 620, protein: 42, carbs: 15, fat: 40, emoji: "🥩"
      },
      light: {
        name: "Kilishi (Spicy Beef Jerky) & Fresh Dates",
        description: "Premium sun-dried beef strips glazed with peanut yaji paste and sweet dates.",
        calories: 320, protein: 28, carbs: 35, fat: 6, emoji: "🥓"
      }
    }
  },
  'Nigeria_General': {
    low: {
      heavy: {
        name: "Eba with Ewedu & Fried Mackerel",
        description: "A budget Nigerian staple, high in satiety and low in fats.",
        calories: 840, protein: 34, carbs: 105, fat: 16, emoji: "🍲"
      },
      medium: {
        name: "Boiled Yam & Scrambled Eggs (No Butter)",
        description: "A light and nutritious Nigerian breakfast or dinner, perfect for high energy.",
        calories: 460, protein: 15, carbs: 70, fat: 10, emoji: "🍳"
      },
      light: {
        name: "Boiled Sweet Potatoes with Light Tomato Dip",
        description: "Low cost, highly filling sweet potato wedges.",
        calories: 310, protein: 5, carbs: 65, fat: 2, emoji: "🍠"
      }
    },
    moderate: {
      heavy: {
        name: "White Rice & Tomato Stew with Chicken",
        description: "Classic Nigerian home-cooked stew served over fluffy white rice.",
        calories: 880, protein: 35, carbs: 110, fat: 22, emoji: "🍛"
      },
      medium: {
        name: "Nigerian Jollof Rice with Fried Chicken & Plantains",
        description: "The nation's staple party rice, perfectly spiced and savory.",
        calories: 700, protein: 28, carbs: 90, fat: 20, emoji: "🍛"
      },
      light: {
        name: "Steamed Moi Moi & Custard",
        description: "High-protein steamed bean pudding with warm vanilla custard.",
        calories: 360, protein: 15, carbs: 50, fat: 6, emoji: "🍮"
      }
    },
    flexible: {
      heavy: {
        name: "Fried Rice with Barbecue Turkey & Coleslaw",
        description: "Premium fried rice tossed with mixed veggies, paired with rich turkey.",
        calories: 960, protein: 48, carbs: 120, fat: 28, emoji: "🍛"
      },
      medium: {
        name: "Coconut Rice with Grilled Croaker Fish & Plantain",
        description: "Rice infused with fresh coconut milk, served with grilled croaker fish.",
        calories: 750, protein: 38, carbs: 85, fat: 24, emoji: "🍛"
      },
      light: {
        name: "Grilled Chicken Breast with Stir-Fry Veggies",
        description: "A premium weight-conscious snack or dinner, very low in carbs.",
        calories: 350, protein: 32, carbs: 15, fat: 12, emoji: "🥗"
      }
    }
  },
  'Ivory Coast': {
    low: {
      heavy: {
        name: "Foutou Banane with Sauce Graine & Fish",
        description: "Traditional mashed plantain swallow served with palm nut soup and fresh fish.",
        calories: 920, protein: 28, carbs: 120, fat: 28, emoji: "🍲"
      },
      medium: {
        name: "Garba (Attiéké with Fried Tuna & Pepper)",
        description: "The ultimate classic Ivorian street food, very budget-friendly and rich in energy.",
        calories: 680, protein: 32, carbs: 95, fat: 20, emoji: "🍛"
      },
      light: {
        name: "Alloco (Fried Plantain) with Boiled Egg",
        description: "Sweet fried plantain cubes served with a hard-boiled egg.",
        calories: 350, protein: 8, carbs: 50, fat: 14, emoji: "🍌"
      }
    },
    moderate: {
      heavy: {
        name: "Plakali with Sauce Kopè (Okra) & Beef/Crabs",
        description: "Manioc gelatinous swallow served with rich slimy okra sauce, beef, and crabs.",
        calories: 890, protein: 38, carbs: 110, fat: 25, emoji: "🍲"
      },
      medium: {
        name: "Riz Gras (Fat Rice) with Chicken & Veggies",
        description: "Flavorful Ivorian spiced rice cooked in stock, topped with seasoned chicken.",
        calories: 650, protein: 25, carbs: 80, fat: 22, emoji: "🍛"
      },
      light: {
        name: "Attiéké with Grilled Mackerel & Onion Sauce",
        description: "Nutritious, light grated cassava couscous served with grilled mackerel.",
        calories: 380, protein: 22, carbs: 55, fat: 10, emoji: "🐟"
      }
    },
    flexible: {
      heavy: {
        name: "Kedjenou de Poulet with Foutou Yam",
        description: "Premium Ivorian slow-cooked chicken stew in clay pot served with mashed yam.",
        calories: 980, protein: 55, carbs: 115, fat: 24, emoji: "🍲"
      },
      medium: {
        name: "Kedjenou de Pintade & Attiéké",
        description: "Slow-cooked premium guinea fowl stew served with fluffy cassava couscous.",
        calories: 720, protein: 45, carbs: 80, fat: 18, emoji: "🍛"
      },
      light: {
        name: "Soupe du Pêcheur (Fisherman's Soup)",
        description: "Light, premium seafood broth loaded with giant prawns, calamari, and crabs.",
        calories: 340, protein: 38, carbs: 20, fat: 12, emoji: "🍲"
      }
    }
  },
  'Ghana': {
    low: {
      heavy: {
        name: "Banku with Tilapia & Hot Pepper Sauce",
        description: "Fermented corn and cassava dough swallow served with budget tilapia.",
        calories: 850, protein: 35, carbs: 105, fat: 16, emoji: "🍲"
      },
      medium: {
        name: "Kenkey with Fried Fish & Black Pepper (Shito)",
        description: "Fermented white corn dough balls wrapped in corn husks, served with shito pepper.",
        calories: 600, protein: 22, carbs: 75, fat: 15, emoji: "🍛"
      },
      light: {
        name: "Boiled Sweet Potatoes & Kontomire (Taro) Stew",
        description: "Simple boiled local sweet potatoes served with iron-rich cocoyam leaf stew.",
        calories: 380, protein: 8, carbs: 65, fat: 8, emoji: "🍠"
      }
    },
    moderate: {
      heavy: {
        name: "Fufu with Light Soup & Goat Meat",
        description: "Traditional plantain and cassava swallow pounded and served in clear spicy soup.",
        calories: 900, protein: 36, carbs: 110, fat: 20, emoji: "🍲"
      },
      medium: {
        name: "Ghanaian Jollof Rice with Fried Chicken & Salad",
        description: "Flavorful Ghanaian jollof rice served with seasoned fried chicken and salad.",
        calories: 680, protein: 28, carbs: 90, fat: 18, emoji: "🍛"
      },
      light: {
        name: "Boiled Plantains with Garden Egg Stew & Boiled Egg",
        description: "Traditional local garden egg stew paired with ripe boiled plantains and egg.",
        calories: 390, protein: 12, carbs: 60, fat: 8, emoji: "🍌"
      }
    },
    flexible: {
      heavy: {
        name: "Fufu with Royal Peanut Soup & Assorted Meats",
        description: "Traditional fufu served in rich peanut butter broth with lamb, beef, and fish.",
        calories: 980, protein: 48, carbs: 115, fat: 32, emoji: "🍲"
      },
      medium: {
        name: "Waakye with Wele, Meat, Egg & Fried Plantains",
        description: "Rice and beans cooked with sorghum leaves, served with shito, spaghetti, and meat.",
        calories: 750, protein: 32, carbs: 95, fat: 22, emoji: "🍛"
      },
      light: {
        name: "Kelewele & Roasted Peanuts",
        description: "Sweet, spicy ginger-fried plantain cubes served with premium peanuts.",
        calories: 360, protein: 8, carbs: 55, fat: 12, emoji: "🍌"
      }
    }
  },
  'Senegal': {
    low: {
      heavy: {
        name: "Thiéboudienne (Senegalese Fish Rice)",
        description: "Economical variant of Senegal's national dish, cooked in tomato paste.",
        calories: 880, protein: 34, carbs: 110, fat: 18, emoji: "🍛"
      },
      medium: {
        name: "Yassa Poulet (Onion Chicken)",
        description: "Rice topped with marinated chicken in a tangy lemon-caramelized onion sauce.",
        calories: 650, protein: 28, carbs: 80, fat: 16, emoji: "🍛"
      },
      light: {
        name: "Chere (Millet Couscous) with Light Yogurt",
        description: "Low cost millet couscous steamed and served in fresh local yogurt.",
        calories: 320, protein: 10, carbs: 55, fat: 6, emoji: "🥣"
      }
    },
    moderate: {
      heavy: {
        name: "Thiéboudienne Rouge (Red Royal Fish Rice)",
        description: "Senegalese classic red rice cooked with fish, cabbage, carrots, and cassava.",
        calories: 950, protein: 38, carbs: 115, fat: 24, emoji: "🍛"
      },
      medium: {
        name: "Maffé de Boeuf (Peanut Beef Stew) & Rice",
        description: "Thick savory peanut butter stew with tender beef chunks, carrots, and white rice.",
        calories: 720, protein: 32, carbs: 95, fat: 22, emoji: "🍛"
      },
      light: {
        name: "Grilled Mackerel with Tangy Yassa Onion Dressing",
        description: "Healthy grilled mackerel fish seasoned with Senegalese spices and onions.",
        calories: 380, protein: 25, carbs: 30, fat: 12, emoji: "🐟"
      }
    },
    flexible: {
      heavy: {
        name: "Thiéboudienne Penda Mbaye (Seafood Fish Rice)",
        description: "Premium royal fish rice garnished with dried fish, prawns, and luxury veggies.",
        calories: 1020, protein: 48, carbs: 120, fat: 26, emoji: "🦞"
      },
      medium: {
        name: "Royal Lamb Maffé & Jasmine Rice",
        description: "Premium peanut butter stew slow-cooked with tender baby lamb cuts and jasmine rice.",
        calories: 780, protein: 42, carbs: 90, fat: 28, emoji: "🍛"
      },
      light: {
        name: "Seafood Kedjenou with Steamed Millet Couscous",
        description: "Tangy slow-cooked seafood stew served over premium Senegalese millet grains.",
        calories: 350, protein: 35, carbs: 40, fat: 8, emoji: "🍲"
      }
    }
  },
  'General_Fallback': {
    low: {
      heavy: {
        name: "Brown Beans & Boiled Plantain",
        description: "A fiber and protein-rich local powerhouse, slow-cooked and high in satiety.",
        calories: 720, protein: 25, carbs: 110, fat: 12, emoji: "🍲"
      },
      medium: {
        name: "Warm Pap (Ogi) & Steamed Moi Moi",
        description: "Gentle and low-cost local meal made from corn meal and bean pudding.",
        calories: 450, protein: 18, carbs: 65, fat: 8, emoji: "🥣"
      },
      light: {
        name: "Boiled Eggs (2) & Roasted Groundnuts",
        description: "Quick, high-protein, and healthy fat local diet option.",
        calories: 320, protein: 16, carbs: 15, fat: 18, emoji: "🍳"
      }
    },
    moderate: {
      heavy: {
        name: "Jollof Rice with Grilled Tilapia & Veggies",
        description: "Flavorful West African party rice served with seasoned grilled fish and vegetables.",
        calories: 820, protein: 38, carbs: 95, fat: 18, emoji: "🍛"
      },
      medium: {
        name: "Spicy Swallow with Okra & Chicken",
        description: "Traditional okra soup loaded with lean chicken chunks, served with healthy swallow.",
        calories: 680, protein: 35, carbs: 70, fat: 15, emoji: "🍲"
      },
      light: {
        name: "Steamed Okpa (Bambara Pudding) & Garden Eggs",
        description: "Protein-dense native Bambara nut pudding paired with crisp garden eggs.",
        calories: 390, protein: 18, carbs: 50, fat: 10, emoji: "🥧"
      }
    },
    flexible: {
      heavy: {
        name: "Royal Swallow with Seafood Egusi Soup",
        description: "Premium melon seed soup loaded with fresh prawns, crabs, fish, served with soft pounded yam.",
        calories: 980, protein: 55, carbs: 115, fat: 28, emoji: "🍲"
      },
      medium: {
        name: "Grilled Suya Salad & Roasted Yam Wedges",
        description: "Tender yaji-spiced grilled beef tossed with mixed greens, paired with golden roasted white yam.",
        calories: 720, protein: 42, carbs: 65, fat: 24, emoji: "🥗"
      },
      light: {
        name: "Peppered Snail & Sweet Potato Wedges",
        description: "Spicy giant land snails sautéed in bell peppers, paired with baked sweet potato fries.",
        calories: 390, protein: 28, carbs: 45, fat: 12, emoji: "🐌"
      }
    }
  }
}

export const SNACKS_DATA = {
  'Nigeria_Yoruba': {
    low: [
      { name: "Roasted Plantain & Groundnuts", description: "Smoky roasted plantain with crunchy peanuts.", calories: 280, protein: 7, carbs: 45, fat: 8, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Puff Puff", description: "Light deep-fried dough balls dusted with sugar.", calories: 250, protein: 4, carbs: 38, fat: 9, image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Garri Soakings with Groundnut", description: "Cold garri soaked in water with sugar and groundnuts.", calories: 220, protein: 5, carbs: 42, fat: 4, image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    moderate: [
      { name: "Steamed Moi Moi", description: "Protein-rich steamed bean pudding with boiled egg.", calories: 320, protein: 18, carbs: 35, fat: 10, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Meat Pie & Juice", description: "Warm Nigerian meat pie with a glass of fruit juice.", calories: 380, protein: 12, carbs: 48, fat: 16, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Chin Chin & Yogurt", description: "Crunchy fried dough strips with chilled yogurt.", calories: 300, protein: 8, carbs: 42, fat: 12, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    flexible: [
      { name: "Peppered Gizzard & Sweet Potato", description: "Spiced gizzard with baked sweet potato wedges.", calories: 350, protein: 22, carbs: 38, fat: 12, image: "https://images.unsplash.com/photo-1432139509613-5c4255a1d277?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Smoothie Bowl & Granola", description: "Blended fruit smoothie topped with crunchy granola.", calories: 340, protein: 10, carbs: 52, fat: 10, image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Suya & Chapman", description: "Premium spicy beef skewers with Chapman cocktail.", calories: 420, protein: 28, carbs: 30, fat: 22, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ]
  },
  'Nigeria_Igbo': {
    low: [
      { name: "Abacha (African Salad)", description: "Light shredded cassava salad with palm oil and ugba.", calories: 290, protein: 8, carbs: 45, fat: 10, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Okpa (Bambara Nut Pudding)", description: "High-protein native bean cake, very filling.", calories: 310, protein: 16, carbs: 42, fat: 8, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Garden Egg & Groundnut", description: "Fresh garden eggs with roasted groundnuts.", calories: 180, protein: 6, carbs: 20, fat: 8, image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    moderate: [
      { name: "Ukwa (African Breadfruit)", description: "Nutritious native breadfruit porridge with dry fish.", calories: 350, protein: 14, carbs: 52, fat: 10, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Roasted Corn & Ube Pear", description: "Classic roasted corn paired with African pear.", calories: 300, protein: 6, carbs: 48, fat: 10, image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Agidi & Akara", description: "Corn starch gel with crispy bean cakes.", calories: 280, protein: 12, carbs: 40, fat: 8, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    flexible: [
      { name: "Nkwobi (Spicy Cow Foot)", description: "Premium spicy cow foot in savory palm oil sauce.", calories: 380, protein: 25, carbs: 15, fat: 24, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Premium Fruit Platter", description: "Assorted fresh tropical fruits with yogurt dip.", calories: 250, protein: 4, carbs: 55, fat: 3, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Peppered Snail & Plantain Chips", description: "Spicy giant snails with crispy plantain chips.", calories: 400, protein: 30, carbs: 28, fat: 18, image: "https://images.unsplash.com/photo-1432139509613-5c4255a1d277?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ]
  },
  'Nigeria_Hausa': {
    low: [
      { name: "Fura da Nono", description: "Traditional millet dough ball in rich local yogurt.", calories: 280, protein: 10, carbs: 42, fat: 8, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Kosai (Bean Cakes)", description: "Crispy Hausa-style bean cakes with pepper sauce.", calories: 260, protein: 12, carbs: 35, fat: 8, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Fresh Dates & Groundnuts", description: "Sweet dates paired with roasted groundnuts.", calories: 220, protein: 6, carbs: 38, fat: 6, image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    moderate: [
      { name: "Masa (Rice Cakes) & Honey", description: "Fermented rice cakes drizzled with natural honey.", calories: 320, protein: 6, carbs: 55, fat: 8, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Kilishi (Beef Jerky)", description: "Sun-dried beef strips glazed with peanut yaji paste.", calories: 280, protein: 24, carbs: 15, fat: 14, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Kunun Gyada & Masa", description: "Nutritious groundnut pap with fermented rice cakes.", calories: 340, protein: 10, carbs: 52, fat: 10, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    flexible: [
      { name: "Premium Suya Platter", description: "Generous spicy beef skewers with yaji spice.", calories: 420, protein: 35, carbs: 10, fat: 28, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Fruit & Nut Trail Mix", description: "Premium mixed nuts, dried fruits, and dark chocolate.", calories: 350, protein: 12, carbs: 38, fat: 18, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Dambu Nama & Kunu", description: "Shredded dried meat with spiced millet drink.", calories: 380, protein: 28, carbs: 35, fat: 14, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ]
  },
  'General_Fallback': {
    low: [
      { name: "Roasted Plantain & Peanuts", description: "Smoky roasted plantain with crunchy peanuts.", calories: 280, protein: 7, carbs: 45, fat: 8, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Akara (Bean Cakes)", description: "Crispy fried bean cakes packed with protein.", calories: 250, protein: 12, carbs: 35, fat: 8, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Garri Soakings with Groundnuts", description: "Chilled soaked garri with honey/sugar and peanuts.", calories: 220, protein: 5, carbs: 42, fat: 4, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    moderate: [
      { name: "Steamed Moi Moi Pudding", description: "Protein-rich bean pudding with egg slices.", calories: 300, protein: 18, carbs: 32, fat: 6, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Chin Chin & Sweet Yogurt", description: "Crunchy flour strips served with rich yogurt.", calories: 340, protein: 8, carbs: 48, fat: 12, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Roasted Corn & Pear (Ube)", description: "Traditional corn paired with roasted African pear.", calories: 290, protein: 6, carbs: 45, fat: 8, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ],
    flexible: [
      { name: "Spicy Beef Suya Skewer", description: "Thinly sliced grilled beef skewers in yaji hot spice.", calories: 390, protein: 32, carbs: 12, fat: 22, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "10:00 AM", label: "Mid-Morning Snack" },
      { name: "Dambu Nama (Shredded Jerky)", description: "Premium shredded fluffy dry beef snack.", calories: 350, protein: 28, carbs: 8, fat: 18, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "4:00 PM", label: "Afternoon Snack" },
      { name: "Peppered Gizzard & Yam Fries", description: "Spicy pan-fried gizzards with golden sweet potato fries.", calories: 380, protein: 25, carbs: 38, fat: 12, image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", time: "9:00 PM", label: "Evening Snack" }
    ]
  }
}

// Image URLs for main meals (breakfast=light, lunch=heavy, dinner=medium)
export const MEAL_IMAGES = {
  'Nigeria_Yoruba': {
    light: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'Nigeria_Igbo': {
    light: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'Nigeria_Hausa': {
    light: "https://images.pexels.com/photos/6260921/pexels-photo-6260921.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'Nigeria_General': {
    light: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'Ghana': {
    light: "https://images.pexels.com/photos/6260921/pexels-photo-6260921.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'Ivory Coast': {
    light: "https://images.pexels.com/photos/6260921/pexels-photo-6260921.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'Senegal': {
    light: "https://images.pexels.com/photos/6260921/pexels-photo-6260921.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  },
  'General_Fallback': {
    light: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    medium: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    heavy: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop"
  }
}

const getProgramDay = (createdAtStr) => {
  if (!createdAtStr) return 1
  const createdDate = new Date(createdAtStr)
  const createdMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate())
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffTime = todayMidnight.getTime() - createdMidnight.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

const formatDateLocal = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function Home() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { language, theme, toggleTheme } = useUiStore()

  // user is guaranteed to exist by AuthGate in App.jsx
  const displayUser = user || {}
  const isFrancophoneCountry = ['côte d\'ivoire', 'cote d\'ivoire', 'ivory coast', 'senegal', 'sénégal', 'benin', 'bénin', 'togo', 'cameroon', 'cameroun', 'guinea', 'guinée', 'mali', 'niger', 'burkina faso'].includes(user?.country?.toLowerCase() || '')
  const currentCulture = (language === 'fr' || isFrancophoneCountry) ? 'fr' : 'en'
  
  const {
    meals, setMeals,
    water, setWater,
    stepGoalHit, setStepGoalHit,
    todaySteps, setTodaySteps,
    todayActiveCal, setTodayActiveCal,
    todayActiveMinutes, setTodayActiveMinutes,
    aiMealPlan, setAiMealPlan,
    lastFetchedDate, setLastFetchedDate
  } = useTrackingStore()

  const todayStr = new Date().toDateString()
  const isDataLoadedForToday = lastFetchedDate === todayStr

  const [waterPreference, setWaterPreference] = useState(displayUser?.waterPreference || 'sachet')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const currentProgramDay = getProgramDay(user?.createdAt)
  const [selectedDay, setSelectedDay] = useState(currentProgramDay)
  const isPastDay = selectedDay < currentProgramDay

  useEffect(() => {
    if (user?.createdAt) {
      setSelectedDay(getProgramDay(user.createdAt))
    }
  }, [user?.createdAt])

  const [activeTooltip, setActiveTooltip] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(!isDataLoadedForToday)
  const [isRetrying, setIsRetrying] = useState(false)

  const loadedCount = useRef(0)

  const triggerConfetti = () => {
    if (window.confetti) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }

  const markLoaded = () => {
    loadedCount.current += 1
    if (loadedCount.current >= 4) {
      setIsPageLoading(false)
      setLastFetchedDate(new Date().toDateString())
    }
  }

  const getDateForDay = (dayNum) => {
    if (!user?.createdAt) return new Date()
    const createdDate = new Date(user.createdAt)
    const targetDate = new Date(createdDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000)
    return targetDate
  }

  useEffect(() => {
    loadedCount.current = 0
    setIsPageLoading(true)

    const targetDate = getDateForDay(selectedDay)
    const dateStr = formatDateLocal(targetDate)
    
    fetchMeals(dateStr)
    fetchWater(dateStr)
    fetchTodayActivities(dateStr)
    fetchAiRecommendations()
    
    if (location.state?.showWelcomeModal) {
      triggerConfetti()
      window.history.replaceState({}, document.title)
    }
  }, [location.state, language, selectedDay, user?.createdAt])

  const fetchAiRecommendations = async () => {
    try {
      const response = await getRecommendations(language)
      if (response.data.success && response.data.data) {
        setAiMealPlan(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch AI recommendations:', err)
    } finally {
      markLoaded()
    }
  }

  const handleRetryRecommendations = async () => {
    setIsRetrying(true)
    try {
      const response = await getRecommendations(language)
      if (response.data.success && response.data.data) {
        setAiMealPlan(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch AI recommendations:', err)
    } finally {
      setIsRetrying(false)
    }
  }

  const fetchMeals = async (dateStr) => {
    try {
      const response = await axios.get('/api/meal/today', {
        params: dateStr ? { date: dateStr } : undefined,
        withCredentials: true
      })
      if (response.data.success) {
        setMeals(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch meals:', err)
    } finally {
      markLoaded()
    }
  }

  const fetchWater = async (dateStr) => {
    try {
      const response = await axios.get('/api/water/today', {
        params: dateStr ? { date: dateStr } : undefined,
        withCredentials: true
      })
      if (response.data.success) {
        setWater(response.data.data.total)
      }
    } catch (err) {
      console.error('Failed to fetch water:', err)
    } finally {
      markLoaded()
    }
  }

  const [updatingWaterIndex, setUpdatingWaterIndex] = useState(null)

  const logWaterIntake = async (amount) => {
    setWater(prev => Math.max(0, prev + amount))
    await queueOrExecute('LOG_WATER', { amount })
  }

  const handleWaterClick = async (index) => {
    if (updatingWaterIndex !== null) return
    setUpdatingWaterIndex(index)
    
    const unit = waterPreference === 'sachet' ? 500 : 750
    const currentUnits = Math.round(water / unit)
    const amount = index < currentUnits ? -unit : unit
    
    try {
      await logWaterIntake(amount)
    } catch (err) {
      console.error('Failed to log water:', err)
    } finally {
      setUpdatingWaterIndex(null)
    }
  }

  const fetchTodayActivities = async (dateStr) => {
    try {
      const response = await axios.get('/api/activity/today', {
        params: dateStr ? { date: dateStr } : undefined,
        withCredentials: true
      })
      if (response.data.success) {
        setTodaySteps(response.data.data.totalSteps || 0)
        setTodayActiveCal(response.data.data.totalCaloriesBurned || 0)
        setTodayActiveMinutes(response.data.data.totalActiveMinutes || 0)
        if (response.data.data.stepGoalHit !== undefined && response.data.data.stepGoalHit !== null) {
          setStepGoalHit(response.data.data.stepGoalHit)
        } else {
          setStepGoalHit(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      markLoaded()
    }
  }



  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [logSuggestedLoading, setLogSuggestedLoading] = useState(null)
  const [pendingMealLog, setPendingMealLog] = useState(null) // { meal, slotIndex }

  const [editingMeal, setEditingMeal] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCalories, setEditCalories] = useState(0)
  const [editProtein, setEditProtein] = useState(0)
  const [editCarbs, setEditCarbs] = useState(0)
  const [editFat, setEditFat] = useState(0)
  const [editType, setEditType] = useState('breakfast')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingMealId, setDeletingMealId] = useState(null)

  useEffect(() => {
    if (editingMeal) {
      setEditName(editingMeal.name || '')
      setEditCalories(editingMeal.calories || 0)
      setEditProtein(editingMeal.protein || 0)
      setEditCarbs(editingMeal.carbs || 0)
      setEditFat(editingMeal.fat || 0)
      setEditType(editingMeal.type || 'breakfast')
    }
  }, [editingMeal])

  const isMealLogged = (mealName) => meals.some(m => m.name?.toLowerCase() === mealName?.toLowerCase())

  const getDailyMealPlan = () => {
    if (!aiMealPlan) return null

    const slotLabels = currentCulture === 'fr'
      ? { breakfast: 'Petit-déjeuner', snackMorning: 'Collation matinée', lunch: 'Déjeuner', snackAfternoon: 'Collation après-midi', dinner: 'Dîner', snackEvening: 'Collation nocturne' }
      : { breakfast: 'Breakfast', snackMorning: 'Mid-Morning Snack', lunch: 'Lunch', snackAfternoon: 'Mid-Afternoon Snack', dinner: 'Dinner', snackEvening: 'Bedtime Snack' }

    const plan = []
    plan.push({ ...aiMealPlan.light, slotType: 'breakfast', slotLabel: slotLabels.breakfast, time: '8:00 AM' })
    
    const isGainGoal = displayUser?.goal === 'gain'
    const snacks = aiMealPlan.snacks || []

    if (isGainGoal && snacks[0]) {
      plan.push({ ...snacks[0], slotType: 'snack', slotLabel: slotLabels.snackMorning, time: '11:00 AM' })
    }
    plan.push({ ...aiMealPlan.heavy, slotType: 'lunch', slotLabel: slotLabels.lunch, time: '13:30' })
    if (isGainGoal && snacks[1]) {
      plan.push({ ...snacks[1], slotType: 'snack', slotLabel: slotLabels.snackAfternoon, time: '16:30' })
    } else if (snacks[0]) {
      plan.push({ ...snacks[0], slotType: 'snack', slotLabel: slotLabels.snackAfternoon, time: '16:30' })
    }
    plan.push({ ...aiMealPlan.medium, slotType: 'dinner', slotLabel: slotLabels.dinner, time: '19:30' })
    if (isGainGoal && snacks[2]) {
      plan.push({ ...snacks[2], slotType: 'snack', slotLabel: slotLabels.snackEvening, time: '22:00' })
    }

    return {
      plan,
      isGainGoal,
      totalCalories: plan.reduce((s, m) => s + (m.calories || 0), 0),
      totalProtein: plan.reduce((s, m) => s + (m.protein || 0), 0),
      totalCarbs: plan.reduce((s, m) => s + (m.carbs || 0), 0),
      totalFat: plan.reduce((s, m) => s + (m.fat || 0), 0)
    }
  }

  const getFruitRecommendation = () => {
    return aiMealPlan?.fruitRecommendation || null
  }

  const handleLogSuggestedMeal = (meal, slotIndex) => {
    // Show confirmation sheet instead of logging immediately
    setPendingMealLog({ meal, slotIndex })
  }

  const confirmLogMeal = async () => {
    if (!pendingMealLog) return
    const { meal, slotIndex } = pendingMealLog
    setLogSuggestedLoading(slotIndex)
    const payload = {
      foodName: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      type: meal.slotType || 'snack'
    }

    try {
      setMeals(prev => [{
        id: `temp-${Date.now()}`,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        type: meal.slotType || 'snack'
      }, ...prev])

      const result = await queueOrExecute('LOG_MEAL', payload)
      if (result.synced) fetchMeals()

      triggerConfetti()
      setToastMessage(`Logged: ${meal.name}! 🥗`)
      setShowToast(true)
      setPendingMealLog(null)
      setTimeout(() => setShowToast(false), 3000)
    } catch (err) {
      console.error('Failed to log suggested meal:', err)
      alert('Could not log suggested meal. Please try again.')
    } finally {
      setLogSuggestedLoading(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMeal) return
    setIsSavingEdit(true)
    try {
      const response = await axios.put(`/api/meal/${editingMeal.id}`, {
        name: editName,
        calories: parseFloat(editCalories) || 0,
        protein: parseFloat(editProtein) || 0,
        carbs: parseFloat(editCarbs) || 0,
        fat: parseFloat(editFat) || 0,
        type: editType
      }, {
        withCredentials: true
      })
      if (response.data.success) {
        const updated = response.data.data
        setMeals(prev => prev.map(m => m.id === editingMeal.id ? updated : m))
        setEditingMeal(null)
        setToastMessage(currentCulture === 'fr' ? 'Repas mis à jour avec succès ! 🥗' : 'Meal updated successfully! 🥗')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      }
    } catch (err) {
      console.error('Failed to update meal:', err)
      const errorMsg = err.response?.data?.message || (currentCulture === 'fr' ? 'Impossible de modifier le repas.' : 'Failed to update meal.')
      alert(errorMsg)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteMeal = async (meal) => {
    if (isPastDay) {
      alert(currentCulture === 'fr' ? 'Impossible de supprimer les repas des jours passés.' : 'Cannot delete meals from past days.')
      return
    }

    const confirmText = currentCulture === 'fr' 
      ? 'Voulez-vous vraiment supprimer ce repas ?' 
      : 'Are you sure you want to delete this meal?'
    if (!window.confirm(confirmText)) return

    setDeletingMealId(meal.id)
    try {
      const response = await axios.delete(`/api/meal/${meal.id}`, {
        withCredentials: true
      })
      if (response.data.success) {
        setMeals(prev => prev.filter(m => m.id !== meal.id))
        setToastMessage(currentCulture === 'fr' ? 'Repas supprimé !' : 'Meal deleted!')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      }
    } catch (err) {
      console.error('Failed to delete meal:', err)
      const errorMsg = err.response?.data?.message || (currentCulture === 'fr' ? 'Impossible de supprimer le repas.' : 'Failed to delete meal.')
      alert(errorMsg)
    } finally {
      setDeletingMealId(null)
    }
  }

  const displayMeals = meals

  const totalCalories = displayMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalFat = displayMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0)
  const totalProtein = displayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
  const totalCarbs = displayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
  
  const dynamicGoals = getDynamicCalorieAndMacroGoals(displayUser)
  const calorieGoal = aiMealPlan?.calorieGoal || displayUser?.calorieGoal || dynamicGoals.calorieGoal
  const carbsGoal = Math.round((calorieGoal * 0.50) / 4)
  const proteinGoal = Math.round((calorieGoal * 0.25) / 4)
  const fatGoal = Math.round((calorieGoal * 0.25) / 9)

  const caloriesLeft = calorieGoal - totalCalories
  const dailyPlan = getDailyMealPlan()
  const fruitRec = getFruitRecommendation()
  const calorieProgress = Math.min((totalCalories / calorieGoal) * 100, 100)

  const fatProgress = Math.min((totalFat / fatGoal) * 100, 100)
  const proteinProgress = Math.min((totalProtein / proteinGoal) * 100, 100)
  const carbsProgress = Math.min((totalCarbs / carbsGoal) * 100, 100)
  
  // Single-color calorie ring circumference (r=55 → 2π×55 ≈ 345.58)
  const calorieRingCirc = 345.58
  const calorieRingOffset = calorieRingCirc * (1 - Math.min(calorieProgress, 100) / 100)

  const waterItemCapacity = waterPreference === 'sachet' ? 500 : 750
  const savedPreference = displayUser?.waterPreference || 'sachet'
  const savedCapacity = (savedPreference === 'bottle' || savedPreference === 'both') ? 750 : 500
  const waterGoal = aiMealPlan?.waterGoalMl 
    ? aiMealPlan.waterGoalMl 
    : (displayUser?.waterGoal ? displayUser.waterGoal * savedCapacity : getDynamicWaterGoal(displayUser))
  const waterTotalItemsNeeded = Math.ceil(waterGoal / waterItemCapacity)
  const hydrationProgress = Math.min((water / waterGoal) * 100, 100)

  const stepsGoal = aiMealPlan?.stepGoal || displayUser?.stepGoal || getDynamicStepsGoal(displayUser)
  const stepProgress = stepGoalHit === true ? 100 : 0

  const movementProgress = dailyPlan?.plan?.some((meal) => isMealLogged(meal.name)) ? 100 : 0

  const totalScore = Math.round(
    (calorieProgress * 0.35) +
    (hydrationProgress * 0.25) +
    (stepProgress * 0.25) +
    (movementProgress * 0.15)
  )

  const handleStepReport = async (hit) => {
    setStepGoalHit(hit)
    try {
      if (navigator.onLine) {
        await logStepGoalReport(hit)
      } else {
        await queueOrExecute('STEP_REPORT', { hit })
      }
    } catch (err) {
      console.error('Step report failed:', err)
    }
  }

  const getCompletionMessage = (score) => {
    if (score <= 30) return t('scoreMsgFresh')
    if (score <= 60) return t('scoreMsgNice')
    if (score <= 85) return t('scoreMsgTrack')
    return t('scoreMsgExcel')
  }

  // Score colour token — clean approach replacing the blob
  const getScoreColor = () => {
    if (totalScore <= 30) return 'var(--color-text-secondary)'
    if (totalScore <= 60) return 'var(--color-tertiary)'
    if (totalScore <= 85) return 'var(--color-secondary)'
    return 'var(--color-primary)'
  }

  if (isPageLoading) {
    return <HomeSkeleton />
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{t('greeting', { name: displayUser.name })}</h1>
          <p className={styles.subtitle}>{
            t('subtitles', { returnObjects: true })[new Date().getDay()]
          }</p>
        </div>
        <button 
          className={styles.themeToggleBtn} 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Program Day Selector */}
      <div className={styles.daySelectorCard}>
        <div className={styles.daysRow}>
          {[...Array(30)].map((_, i) => {
            const dayNum = i + 1;
            const isActive = dayNum === selectedDay;
            const isUnreached = dayNum > currentProgramDay;
            const isToday = dayNum === currentProgramDay;
            const isPast = dayNum < currentProgramDay;
            const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            const dayName = daysOfWeek[i % 7];
            
            const currentHour = new Date().getHours();
            const progress = isToday ? (currentHour / 24) : (isPast ? 1 : 0);
            const strokeDasharray = 138.2;
            const strokeDashoffset = strokeDasharray * (1 - progress);

            return (
              <div 
                key={i} 
                className={`${styles.dayItem} ${isActive ? styles.dayItemActive : ''} ${isUnreached ? styles.dayItemUnreached : ''}`}
                onClick={() => !isUnreached && setSelectedDay(dayNum)}
              >
                <div className={styles.dayCircleWrapper}>
                  <svg width="48" height="48" viewBox="0 0 48 48" className={styles.dayCircleSvg}>
                    <circle cx="24" cy="24" r="22" fill="none" stroke="#E0E0E0" strokeWidth="2.5" />
                    <circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-primary)" strokeWidth="2.5"
                      strokeDasharray="138.2" strokeDashoffset={138.2 * (1 - progress)}
                      transform="rotate(-90 24 24)" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={styles.dayCircleText}>
                    <span className={styles.dayLabelSmall}>{currentCulture === 'fr' ? 'Jour' : 'Day'}</span>
                    <span className={styles.dayCircleNumber}>{dayNum}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Calories Intake Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('caloriesIntake')}</h3>
        </div>

        {/* Nutrition Card (New Design) */}
        <div className={styles.nutritionCardNew}>
          <div className={styles.nutritionHeaderNew}>
            <div>
              <span className={styles.goalLabel}>{t('calorieGoal')}</span>
              <h3 className={styles.goalNumber}>{calorieGoal} kcal</h3>
              <p className={styles.goalMessage} dangerouslySetInnerHTML={{
                __html: t('calorieGoalMessage', { goal: calorieGoal })
              }} />
            </div>
          </div>
          
          <div className={styles.nutritionContentNew}>
            {/* Left Side: Donut Chart */}
            <div className={styles.donutChartWrapper}>
              <svg width="130" height="130" viewBox="0 0 130 130" className={styles.donutSvg}>
                {/* Track */}
                <circle cx="65" cy="65" r="55" fill="none" stroke="#F0F0F0" strokeWidth="8" />
                {/* Single calorie progress arc */}
                <circle
                  cx="65" cy="65" r="55"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="8"
                  strokeDasharray={calorieRingCirc}
                  strokeDashoffset={calorieRingOffset}
                  transform="rotate(-90 65 65)"
                  strokeLinecap="round"
                />
              </svg>
              <div className={styles.donutCenter}>
                <span className={styles.donutNumber}>{caloriesLeft}</span>
                <span className={styles.donutLabel}>{t('left')}</span>
              </div>
            </div>
            
            {/* Right Side: Macro Bars */}
            <div className={styles.macroBarsWrapper}>
              {/* Fat */}
              <div className={styles.macroBarItem}>
                <div className={styles.macroBarHeader}>
                  <span>💧 {t('fat')}</span>
                  <span>{totalFat}g / {fatGoal}g</span>
                </div>
                <div className={styles.macroBarBg}>
                  <div className={styles.macroBarFill} style={{ width: `${fatProgress}%`, backgroundColor: '#AEEA00' }}></div>
                </div>
              </div>
              
              {/* Protein */}
              <div className={styles.macroBarItem}>
                <div className={styles.macroBarHeader}>
                  <span>🥩 {t('protein')}</span>
                  <span>{totalProtein}g / {proteinGoal}g</span>
                </div>
                <div className={styles.macroBarBg}>
                  <div className={styles.macroBarFill} style={{ width: `${proteinProgress}%`, backgroundColor: '#FFD600' }}></div>
                </div>
              </div>
              
              {/* Carbs */}
              <div className={styles.macroBarItem}>
                <div className={styles.macroBarHeader}>
                  <span>🍞 {t('carbs')}</span>
                  <span>{totalCarbs}g / {carbsGoal}g</span>
                </div>
                <div className={styles.macroBarBg}>
                  <div className={styles.macroBarFill} style={{ width: `${carbsProgress}%`, backgroundColor: '#D500F9' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Daily Calorie Progress Bar */}
          <div className={styles.nutritionProgressWrapper}>
            <div className={styles.nutritionProgressBarBg}>
              <div 
                className={styles.nutritionProgressBarFill} 
                style={{ width: `${calorieProgress}%` }}
              ></div>
            </div>
            <div className={styles.nutritionProgressLabels} style={{ justifyContent: 'center', fontWeight: '600' }}>
              <span className={styles.nutritionProgressLeft} style={{ color: 'var(--color-primary)' }}>
                {t('completedTarget', { percent: Math.round(calorieProgress) })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Milestones Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('milestones')}</h3>
        </div>
        <p style={{ fontSize: '11.5px', color: '#666', paddingLeft: '4px', fontStyle: 'italic', margin: 0 }}>
          {t('milestonesSub')}
        </p>
        
        <div className={styles.milestonesRow}>
          {/* Hydration Hero */}
          <div className={`${styles.milestoneChip} ${water >= waterGoal ? styles.milestoneChipUnlocked : styles.milestoneChipLocked}`}>
            <span>{water >= waterGoal ? '💧 ' + t('hydrationHeroTitle') : '🔒 ' + t('hydrationHeroTitle')}</span>
            <div className={styles.milestoneTooltip}>
              {water >= waterGoal ? t('hydrationHeroCompleted') : t('hydrationHeroTooltip', { count: waterTotalItemsNeeded, unit: waterPreference === 'sachet' ? t('sachets') : t('bottles') })}
            </div>
          </div>

          {/* Dance Rhythm */}
          <div className={`${styles.milestoneChip} ${todayActiveMinutes >= 15 ? styles.milestoneChipUnlocked : styles.milestoneChipLocked}`}>
            <span>{todayActiveMinutes >= 15 ? '💃 ' + t('danceRhythmTitle') : '🔒 ' + t('danceRhythmTitle')}</span>
            <div className={styles.milestoneTooltip}>
              {todayActiveMinutes >= 15 ? t('danceRhythmCompleted') : t('danceRhythmTooltip')}
            </div>
          </div>

          {/* Mindful Scanner */}
          <div className={`${styles.milestoneChip} ${meals.length > 0 ? styles.milestoneChipUnlocked : styles.milestoneChipLocked}`}>
            <span>{meals.length > 0 ? '🥗 ' + t('mindfulScannerTitle') : '🔒 ' + t('mindfulScannerTitle')}</span>
            <div className={styles.milestoneTooltip}>
              {meals.length > 0 ? t('mindfulScannerCompleted') : t('mindfulScannerTooltip')}
            </div>
          </div>

          {/* Calorie Controller */}
          <div className={`${styles.milestoneChip} ${(totalCalories > 0 && totalCalories <= calorieGoal) ? styles.milestoneChipUnlocked : styles.milestoneChipLocked}`}>
            <span>{(totalCalories > 0 && totalCalories <= calorieGoal) ? '🎯 ' + t('caloriePerfectTitle') : '🔒 ' + t('caloriePerfectTitle')}</span>
            <div className={styles.milestoneTooltip}>
              {(totalCalories > 0 && totalCalories <= calorieGoal) ? t('caloriePerfectCompleted', { goal: calorieGoal }) : t('caloriePerfectTooltip', { goal: calorieGoal })}
            </div>
          </div>

          {/* Steps Pioneer */}
          <div className={`${styles.milestoneChip} ${stepGoalHit === true ? styles.milestoneChipUnlocked : styles.milestoneChipLocked}`}>
            <span>{stepGoalHit === true ? '🚶‍♂️ ' + t('stepsPioneerTitle') : '🔒 ' + t('stepsPioneerTitle')}</span>
            <div className={styles.milestoneTooltip}>
              {stepGoalHit === true ? t('stepsPioneerCompleted', { goal: stepsGoal.toLocaleString() }) : t('stepsPioneerTooltip', { goal: stepsGoal.toLocaleString() })}
            </div>
          </div>
        </div>
      </div>

      {/* Water Intake Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('waterIntake')}</h3>
        </div>
        
        <div className={styles.waterCardWhite}>
          {/* Top Header with small dropdown on the right */}
          <div className={styles.liquidsCardHeader}>
            <span className={styles.currentWaterText}>
              <strong>{water} ml</strong> / {waterGoal} ml
            </span>
            <div className={styles.customDropdownWrapper}>
              <div className={styles.customDropdownHeader} onClick={() => !isPastDay && setDropdownOpen(!dropdownOpen)} style={{ cursor: isPastDay ? 'default' : 'pointer' }}>
                <span>{waterPreference === 'sachet' ? t('pureWater') : t('bottled')}</span>
                {!isPastDay && <ChevronDown size={10} className={styles.selectorChevronSmall} />}
              </div>
              {dropdownOpen && (
                <ul className={styles.customDropdownList}>
                  <li onClick={() => { setWaterPreference('bottle'); setDropdownOpen(false); }}>{t('bottled')}</li>
                  <li onClick={() => { setWaterPreference('sachet'); setDropdownOpen(false); }}>{t('pureWater')}</li>
                </ul>
              )}
            </div>
          </div>

          {/* Glasses */}
          <div className={styles.glassesRowWhite} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {[...Array(waterTotalItemsNeeded)].map((_, i) => {
              const filled = Math.round(water / waterItemCapacity) >= i + 1;
              const isUpdating = updatingWaterIndex === i;
              
              return (
                <div 
                  key={i} 
                  className={`${styles.glassWhite} ${filled ? styles.glassFilledWhite : styles.glassEmptyWhite}`}
                  onClick={() => !isPastDay && handleWaterClick(i)}
                  style={{ width: '42px', height: '42px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isPastDay ? 'default' : 'pointer' }}
                >
                  {isUpdating ? (
                    <span className="mini-spinner" style={{ borderTopColor: 'var(--color-primary)' }} />
                  ) : (
                    <span>{filled ? '−' : '+'}</span>
                  )}
                </div>
              )
            })}
          </div>
          {updatingWaterIndex !== null && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '500', marginTop: '6px' }}>
              {currentCulture === 'fr' ? "Synchronisation de l'eau..." : "Syncing water log..."}
            </div>
          )}

          {/* Bottom: Progress Bar with Drop Handle */}
          <div className={styles.sliderContainer}>
            <span className={styles.sliderLabel}>0 ml</span>
            <div className={styles.waterSliderBg}>
              <div 
                className={styles.waterSliderFill} 
                style={{ 
                  width: `${Math.min(((Number(water) || 0) / waterGoal) * 100, 100)}%`,
                  backgroundColor: (Number(water) || 0) > 0 ? 'var(--color-hydration)' : 'transparent'
                }}
              >
                <div className={styles.waterDropHandleWhite}>💧</div>
              </div>
            </div>
            <span className={styles.sliderLabel}>{waterGoal} ml</span>
          </div>
        </div>
      </div>

      {/* Suggested Food Timetable Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>{t('suggestedFoodTimetable')}</h3>
          <button 
            className={styles.viewDetailedLink}
            onClick={() => navigate('/timetable')}
          >
            {t('seeFullPlan')}
          </button>
        </div>
        <p className={styles.suggestionSubtitle} style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', textAlign: 'left', margin: 0 }}>
          {t('suggestedFoodTimetableSub')}
        </p>

        {/* Horizontal Timeline Carousel */}
        {dailyPlan ? (
          <div className={styles.horizontalTimeline}>
            {dailyPlan.plan.map((slot, idx) => {
              const logged = isMealLogged(slot.name)
              const isLoading = logSuggestedLoading === idx
              return (
                <div 
                  key={idx} 
                  className={`${styles.horizontalCard} ${logged ? styles.horizontalCardLogged : ''}`}
                >
                  <div className={styles.horizontalCardImgWrapper}>
                    <MealImage
                      mealName={slot.name}
                      imageUrl={slot.image}
                      className={styles.horizontalCardImg}
                      lang={currentCulture}
                    />
                    <span className={styles.horizontalTimeOverlay}>{slot.time}</span>
                  </div>
                  <div className={styles.horizontalCardContent}>
                    <div className={styles.horizontalCardHeaderRow}>
                      <span className={`${styles.horizontalSlotBadge} ${styles[`slotBadge_${slot.slotType}`]}`}>
                        {slot.slotLabel || slot.label}
                      </span>
                      <span className={styles.horizontalKcalBadge}>
                        {slot.calories} kcal
                      </span>
                    </div>
                    <h4 className={styles.horizontalMealName} title={slot.name}>{slot.name}</h4>
                  </div>
                  <button
                    className={`${styles.horizontalLogBtn} ${logged ? styles.horizontalLogBtnLogged : ''}`}
                    onClick={() => !logged && !isPastDay && handleLogSuggestedMeal(slot, idx)}
                    disabled={isLoading || logged || isPastDay}
                  >
                    {logged ? '✓ ' + t('logged') : isPastDay ? (currentCulture === 'fr' ? 'Non modifiable' : 'Uneditable') : isLoading ? '...' : t('logMeal')}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyStateCard} style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', marginTop: '8px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {currentCulture === 'fr'
                ? "Impossible de charger votre emploi du temps repas IA. Vérifiez votre connexion et réessayez."
                : "Could not load your AI Daily Meal Timetable. Please check your network and try again."}
            </p>
            <button 
              onClick={handleRetryRecommendations} 
              disabled={isRetrying}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                background: 'var(--color-primary)', 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '12px', 
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                minWidth: '120px'
              }}
            >
              {isRetrying ? (
                <>
                  <span>{currentCulture === 'fr' ? 'Chargement...' : 'Loading...'}</span>
                  <div className="mini-spinner" style={{ borderTopColor: 'white', width: '12px', height: '12px', borderWidth: '2px' }}></div>
                </>
              ) : (
                currentCulture === 'fr' ? 'Réessayer' : 'Retry Loading'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Fruit of the Day Section */}
      {fruitRec && (
        <div className={styles.section}>
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Leaf className={styles.fruitIcon} size={18} />
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
              {currentCulture === 'fr' ? 'Fruit du jour' : 'Fruit of the Day'}
            </h3>
          </div>
          <p className={styles.suggestionSubtitle} style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', textAlign: 'left', margin: 0 }}>
            {currentCulture === 'fr'
              ? 'Recommandations de fruits locaux personnalisées pour votre objectif bien-être.'
              : 'Personalized local fruit recommendations for your wellness goal.'}
          </p>

          <div className={styles.fruitCard}>
            <div className={styles.fruitCardEmoji}>{fruitRec.emoji || '🍉'}</div>
            <div className={styles.fruitCardContent}>
              <div className={styles.fruitCardTopRow}>
                <h4 className={styles.fruitCardTitle}>{fruitRec.name}</h4>
                <span className={styles.fruitCardTimeBadge}>⏰ {fruitRec.bestTime}</span>
              </div>
              <div className={styles.fruitCardDetails}>
                <p className={styles.fruitCardText}>
                  <strong>{currentCulture === 'fr' ? 'Portion recommandée :' : 'Recommended Portion:'}</strong> {fruitRec.quantity}
                </p>
                <p className={styles.fruitCardText}>
                  <strong>{currentCulture === 'fr' ? '💡 Idée smoothie :' : '💡 Smoothie/Juice Idea:'}</strong> {fruitRec.idea}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily step goal (self-report) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('dailySteps')}</h3>
        </div>

        {stepGoalHit === true ? (
          <div className={`${styles.stepsEnergeticContainer} ${styles.stepsSuccessContainer}`}>
            <div className={styles.stepsIconWrapper}>
              <CheckCircle2 size={24} color="#27AE60" className={styles.successIconAnim} />
            </div>
            <div className={styles.stepsStatsColumn}>
              <h4 className={styles.stepsCompletedTitle}>{currentCulture === 'fr' ? 'Félicitations ! 🎉' : 'Awesome! 🎉'}</h4>
              <p className={styles.stepsSuccessMessage}>{t('stepGoalSuccess')}</p>
              {!isPastDay && (
                <button 
                  type="button" 
                  className={styles.changeResponseLink} 
                  onClick={() => handleStepReport(null)}
                >
                  {t('changeResponse')}
                </button>
              )}
            </div>
          </div>
        ) : stepGoalHit === false ? (
          <div className={`${styles.stepsEnergeticContainer} ${styles.stepsEncourageContainer}`}>
            <div className={styles.stepsIconWrapper}>
              <Sparkles size={24} color="#E056FD" className={styles.encourageIconAnim} />
            </div>
            <div className={styles.stepsStatsColumn}>
              <p className={styles.stepsEncourageMessage}>{t('stepGoalEncouragement')}</p>
              {!isPastDay && (
                <button 
                  type="button" 
                  className={styles.changeResponseLink} 
                  onClick={() => handleStepReport(null)}
                >
                  {t('changeResponse')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.stepsEnergeticContainer}>
            <div className={styles.stepsIconWrapper}>
              <Footprints size={24} className={styles.footprintsIconAnim} />
            </div>
            <div className={styles.stepsStatsColumn}>
              <p className={styles.stepsGoalProgressText}>{t('stepGoalTarget', { goal: stepsGoal.toLocaleString() })}</p>
              <p className={styles.stepsGuideText}>{t('stepCheckGuide')}</p>
              {isPastDay ? (
                <p className={styles.stepsGuideText} style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                  {currentCulture === 'fr' ? 'Aucun rapport de pas pour ce jour.' : 'No step goal report for this day.'}
                </p>
              ) : (
                <>
                  <p className={styles.stepCheckQuestion}>{t('stepCheckQuestion')}</p>
                  <div className={styles.stepReportRow}>
                    <button
                      type="button"
                      className={`${styles.stepReportBtn} ${stepGoalHit === true ? styles.stepReportBtnActive : ''}`}
                      onClick={() => handleStepReport(true)}
                    >
                      {t('stepCheckYes')}
                    </button>
                    <button
                      type="button"
                      className={`${styles.stepReportBtn} ${stepGoalHit === false ? styles.stepReportBtnMissed : ''}`}
                      onClick={() => handleStepReport(false)}
                    >
                      {t('stepCheckNotToday')}
                    </button>
                  </div>
                  <button type="button" className={styles.stepActivityLink} onClick={() => navigate('/activity')}>
                    {t('optionalActivityLog')} <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logged Meals */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('whatIAteToday')}</h3>
        </div>

        <div className={styles.loggedMealsGrid}>
          {displayMeals.length === 0 ? (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyStateIcon}>🍽️</div>
              <h4>{t('noMealsLoggedTitle')}</h4>
              <p>{t('noMealsLoggedText')}</p>
              {!isPastDay && (
                <div className={styles.emptyStateActionRow}>
                  <button className={styles.emptyStateBtn} onClick={() => navigate('/scan')}>
                    <Camera size={14} /> {t('scanWithCamera')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            displayMeals.map(meal => (
              <div key={meal.id} className={styles.loggedMealCard}>
                <div className={styles.loggedMealImageWrapper}>
                  <MealImage
                    mealName={meal.name}
                    imageUrl={meal.imageUrl || meal.image}
                    className={styles.loggedMealImage}
                    lang={currentCulture}
                  />
                  
                  {/* Intensity Badge */}
                  <div 
                    className={`${styles.intensityBadge} ${styles[`intensityBadge_${meal.intensity || 'low'}`]}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTooltip(meal.id);
                      setTimeout(() => setActiveTooltip(null), 10000);
                    }}
                  >
                    {meal.intensity === 'high' ? <Zap size={10} color="white" /> : meal.intensity === 'medium' ? <ThumbsUp size={10} color="white" /> : <Leaf size={10} color="white" />}
                  </div>

                  {/* Tooltip */}
                  {activeTooltip === meal.id && (
                    <div className={styles.explanationTooltip}>
                      {meal.intensity === 'high'
                        ? (currentCulture === 'fr' ? 'Repas riche en calories' : 'High calorie meal')
                        : meal.intensity === 'medium'
                          ? (currentCulture === 'fr' ? 'Repas modéré en calories' : 'Medium calorie meal')
                          : (currentCulture === 'fr' ? 'Repas léger en calories' : 'Low calorie meal')}
                    </div>
                  )}
                </div>
                <div className={styles.loggedMealContent}>
                  <div className={styles.loggedMealHeader}>
                    <div className={styles.timeAndType} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={styles.mealTime}>{meal.time || '12:00 PM'}</span>
                      {meal.type && (
                        <span className={styles[`dot_${meal.type.toLowerCase()}`]} style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }} />
                      )}
                      <span className={styles.mealType} style={{ textTransform: 'capitalize' }}>
                        {meal.type ? (currentCulture === 'fr' ? (meal.type === 'breakfast' ? 'petit-déjeuner' : meal.type === 'lunch' ? 'déjeuner' : meal.type === 'dinner' ? 'dîner' : 'collation') : meal.type) : t('meal')}
                      </span>
                    </div>
                  </div>
                  <h4>{meal.name}</h4>
                  <div className={styles.mealItemMacros}>
                    <div className={styles.macroItem}>
                      <Flame size={12} color="#FF4500" />
                      <span>{meal.calories} kcal</span>
                    </div>
                    <div className={styles.macroItem}>
                      <Dumbbell size={12} color="#FFD600" />
                      <span>{meal.protein || 0}g</span>
                    </div>
                    <div className={styles.macroItem}>
                      <Wheat size={12} color="#4A148C" />
                      <span>{meal.carbs || 0}g</span>
                    </div>
                    <div className={styles.macroItem}>
                      <Droplet size={12} color="#AEEA00" />
                      <span>{meal.fat || 0}g</span>
                    </div>
                  </div>
                </div>
                
                {/* Card Actions */}
                {!isPastDay && (
                  <div className={styles.mealActionsWrapper}>
                    <button 
                      className={styles.actionBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === meal.id ? null : meal.id);
                      }}
                      title="More actions"
                    >
                      <MoreVertical size={16} color="#666" />
                    </button>

                    {activeMenu === meal.id && (
                      <div className={styles.actionsDropdown}>
                        <button 
                          className={styles.dropdownItem} 
                          onClick={() => {
                            setActiveMenu(null);
                            if (isPastDay) {
                              alert(currentCulture === 'fr' ? 'Impossible de modifier les repas des jours passés.' : 'Cannot modify meals from past days.');
                            } else {
                              setEditingMeal(meal);
                            }
                          }}
                          title="Edit meal"
                        >
                          <Pencil size={12} color="#666" />
                          <span>{t('edit')}</span>
                        </button>
                        <button 
                          className={styles.dropdownItem} 
                          onClick={() => {
                            setActiveMenu(null);
                            handleDeleteMeal(meal);
                          }}
                          title="Delete meal"
                        >
                          <Trash2 size={12} color="#EB5757" />
                          <span>{t('delete')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Floating Wellness Tips Button */}
      <button className={styles.floatingScanBtn} title={currentCulture === 'fr' ? 'Astuces Bien-être' : 'Wellness Tips'} onClick={() => navigate('/wellness-tips')}>
        <Lightbulb size={24} color="white" />
      </button>


      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {/* Log Meal Confirmation Sheet */}
      {pendingMealLog && (
        <div className={styles.confirmOverlay} onClick={() => setPendingMealLog(null)}>
          <div className={styles.confirmSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmSheetHandle} />
            <h3 className={styles.confirmTitle}>
              {currentCulture === 'fr' ? 'Confirmer le repas' : 'Confirm Meal Log'}
            </h3>
            <p className={styles.confirmMealName}>{pendingMealLog.meal.name}</p>
            <div className={styles.confirmMacroRow}>
              <span className={styles.confirmMacroPill} style={{ background: '#FFF3E0', color: '#E65100' }}>
                🔥 {pendingMealLog.meal.calories} kcal
              </span>
              <span className={styles.confirmMacroPill} style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                🥩 {pendingMealLog.meal.protein}g
              </span>
              <span className={styles.confirmMacroPill} style={{ background: '#E3F2FD', color: '#1565C0' }}>
                🍞 {pendingMealLog.meal.carbs}g
              </span>
              <span className={styles.confirmMacroPill} style={{ background: '#F3E5F5', color: '#6A1B9A' }}>
                💧 {pendingMealLog.meal.fat}g
              </span>
            </div>
            <p className={styles.confirmNote}>
              {currentCulture === 'fr'
                ? 'Cette action ne peut pas être annulée. Voulez-vous continuer ?'
                : "This can't be undone. Are you sure you want to log this meal?"}
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setPendingMealLog(null)}
              >
                {currentCulture === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                className={styles.confirmLogBtn}
                onClick={confirmLogMeal}
                disabled={logSuggestedLoading !== null}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {logSuggestedLoading !== null ? (
                  <>
                    <span className="mini-spinner" />
                    <span>{currentCulture === 'fr' ? 'Enregistrement...' : 'Logging...'}</span>
                  </>
                ) : (
                  currentCulture === 'fr' ? 'Oui, enregistrer' : 'Yes, Log It'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className={styles.confirmOverlay} onClick={() => setEditingMeal(null)}>
          <div className={styles.confirmSheet} onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '95%', overflowY: 'auto' }}>
            <div className={styles.confirmSheetHandle} />
            <h3 className={styles.confirmTitle}>
              {currentCulture === 'fr' ? 'Modifier le repas' : 'Edit Logged Meal'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '12px', padding: '0 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>
                  {currentCulture === 'fr' ? 'Nom du repas' : 'Meal Name'}
                </label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  style={{ width: '100%', border: '1px solid #E0E0E0', background: '#F9F9F9', borderRadius: '10px', padding: '10px 12px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>
                  {currentCulture === 'fr' ? 'Type de repas / moment' : 'Meal Slot / Period'}
                </label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  style={{ width: '100%', border: '1px solid #E0E0E0', background: '#F9F9F9', borderRadius: '10px', padding: '10px 12px', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
                >
                  <option value="breakfast">{currentCulture === 'fr' ? '🍳 Petit-déjeuner' : '🍳 Breakfast'}</option>
                  <option value="lunch">{currentCulture === 'fr' ? '🍛 Déjeuner' : '🍛 Lunch'}</option>
                  <option value="dinner">{currentCulture === 'fr' ? '🍲 Dîner' : '🍲 Dinner'}</option>
                  <option value="snack">{currentCulture === 'fr' ? '🍎 Collation / Snack' : '🍎 Snack'}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 4px', borderRadius: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Kcal</label>
                  <input 
                    type="number" 
                    value={editCalories} 
                    onChange={e => setEditCalories(parseFloat(e.target.value) || 0)} 
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 4px', borderRadius: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Carbs</label>
                  <input 
                    type="number" 
                    value={editCarbs} 
                    onChange={e => setEditCarbs(parseFloat(e.target.value) || 0)} 
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 4px', borderRadius: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Prot</label>
                  <input 
                    type="number" 
                    value={editProtein} 
                    onChange={e => setEditProtein(parseFloat(e.target.value) || 0)} 
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 4px', borderRadius: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Fat</label>
                  <input 
                    type="number" 
                    value={editFat} 
                    onChange={e => setEditFat(parseFloat(e.target.value) || 0)} 
                    style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.confirmActions} style={{ marginTop: '20px' }}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setEditingMeal(null)}
                disabled={isSavingEdit}
              >
                {currentCulture === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                className={styles.confirmLogBtn}
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isSavingEdit ? (
                  <>
                    <span className="mini-spinner" />
                    <span>{currentCulture === 'fr' ? 'Enregistrement...' : 'Saving...'}</span>
                  </>
                ) : (
                  currentCulture === 'fr' ? 'Enregistrer' : 'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleting Meal Overlay Loader */}
      {deletingMealId && (
        <div className={styles.confirmOverlay} style={{ zIndex: 10000 }}>
          <div className={styles.confirmSheet} style={{ alignItems: 'center', padding: '40px 20px', gap: '15px' }}>
            <span className="mini-spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(235, 87, 87, 0.3)', borderTop: '3px solid #EB5757' }} />
            <p style={{ fontWeight: 'bold', color: '#333' }}>
              {currentCulture === 'fr' ? 'Suppression du repas...' : 'Deleting meal...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

