import React, { useState, useEffect } from 'react'
import { useUserStore } from '../../store/userStore'
import { useTrackingStore } from '../../store/trackingStore'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Timetable.module.css'
import { Dumbbell, Droplet, Wheat, Flame, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { getFoodImage, FALLBACK_IMAGE, MealImage } from '../Home/Home'
import { useUiStore } from '../../store/uiStore'
import TimetableSkeleton from './TimetableSkeleton'
import { getDynamicCalorieAndMacroGoals } from '../../utils/goals.js'
import { useTranslation } from 'react-i18next'

export default function Timetable() {
  const { t } = useTranslation()
  const { user } = useUserStore()
  const { language } = useUiStore()
  const currentCulture = language === 'fr' ? 'fr' : 'en'
  const navigate = useNavigate()
  const displayUser = user

  const {
    meals, setMeals,
    aiMealPlan, setAiMealPlan,
    lastFetchedDate, setLastFetchedDate
  } = useTrackingStore()

  const todayStr = new Date().toDateString()
  const isPlanLoaded = aiMealPlan !== null && lastFetchedDate === todayStr

  const [logSuggestedLoading, setLogSuggestedLoading] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isPlanLoading, setIsPlanLoading] = useState(!isPlanLoaded)
  const [activeFilter, setActiveFilter] = useState('all')

  const aiPlan = React.useMemo(() => {
    if (!aiMealPlan) return null
    const isGainGoal = displayUser?.goal === 'gain'
    const snacks = aiMealPlan.snacks || []
    
    const slotLabels = currentCulture === 'fr'
      ? { breakfast: 'Petit-déjeuner', snackMorning: 'Collation matinée', lunch: 'Déjeuner', snackAfternoon: 'Collation après-midi', dinner: 'Dîner', snackEvening: 'Collation nocturne' }
      : { breakfast: 'Breakfast', snackMorning: 'Mid-Morning Snack', lunch: 'Lunch', snackAfternoon: 'Mid-Afternoon Snack', dinner: 'Dinner', snackEvening: 'Bedtime Snack' }

    const formattedPlan = []
    formattedPlan.push({ ...aiMealPlan.light, slotType: 'breakfast', slotLabel: slotLabels.breakfast, time: '8:00 AM' })
    if (isGainGoal && snacks[0]) {
      formattedPlan.push({ ...snacks[0], slotType: 'snack', slotLabel: slotLabels.snackMorning, time: '11:00 AM' })
    }
    formattedPlan.push({ ...aiMealPlan.heavy, slotType: 'lunch', slotLabel: slotLabels.lunch, time: '1:30 PM' })
    if (isGainGoal && snacks[1]) {
      formattedPlan.push({ ...snacks[1], slotType: 'snack', slotLabel: slotLabels.snackAfternoon, time: '4:30 PM' })
    } else if (snacks[0]) {
      formattedPlan.push({ ...snacks[0], slotType: 'snack', slotLabel: slotLabels.snackAfternoon, time: '4:30 PM' })
    }
    formattedPlan.push({ ...aiMealPlan.medium, slotType: 'dinner', slotLabel: slotLabels.dinner, time: '7:30 PM' })
    if (isGainGoal && snacks[2]) {
      formattedPlan.push({ ...snacks[2], slotType: 'snack', slotLabel: slotLabels.snackEvening, time: '10:00 PM' })
    }
    
    return {
      plan: formattedPlan,
      totalCalories: formattedPlan.reduce((s, m) => s + (m.calories || 0), 0),
      totalProtein: formattedPlan.reduce((s, m) => s + (m.protein || 0), 0),
      totalCarbs: formattedPlan.reduce((s, m) => s + (m.carbs || 0), 0),
      totalFat: formattedPlan.reduce((s, m) => s + (m.fat || 0), 0),
      budgetTier: displayUser?.budgetPreference || 'moderate'
    }
  }, [aiMealPlan, displayUser?.budgetPreference, displayUser?.goal, currentCulture])

  useEffect(() => {
    const todayStr = new Date().toDateString()
    const isPlanLoaded = aiMealPlan !== null && lastFetchedDate === todayStr

    if (!isPlanLoaded) {
      setIsPlanLoading(true)
    }
    fetchMeals()
    fetchAiPlan()
  }, [])

  const fetchMeals = async () => {
    try {
      const response = await axios.get('/api/meal/today', { withCredentials: true })
      if (response.data.success) {
        setMeals(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch meals:', err)
    }
  }

  const fetchAiPlan = async () => {
    try {
      const culture = language === 'fr' ? 'fr' : 'en'
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      const response = await axios.get(`/api/meal/recommendations?lang=${culture}&date=${dateStr}`, { withCredentials: true })
      if (response.data.success && response.data.data) {
        setAiMealPlan(response.data.data)
        setLastFetchedDate(new Date().toDateString())
      }
    } catch (err) {
      console.error('Failed to fetch AI meal plan:', err)
    } finally {
      setIsPlanLoading(false)
    }
  }

  const isMealLogged = (mealName) => meals.some(m => m.name?.toLowerCase() === mealName?.toLowerCase())

  const handleLogSuggestedMeal = async (meal, slotIndex) => {
    setLogSuggestedLoading(slotIndex)
    try {
      const response = await axios.post('/api/meal/log', {
        foodName: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        type: meal.slotType || 'snack'
      }, {
        withCredentials: true
      })
      
      if (response.data.success) {
        setMeals(prev => [response.data.data, ...prev])
        setToastMessage(`Logged: ${meal.name}! 🥗`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
    } catch (err) {
      console.error('Failed to log suggested meal:', err)
      alert('Could not log suggested meal. Please try again.')
    } finally {
      setLogSuggestedLoading(null)
    }
  }

  const goals = getDynamicCalorieAndMacroGoals(displayUser)

  const filterTabs = [
    { id: 'all', label: currentCulture === 'fr' ? 'Tous les repas' : 'All Meals' },
    { id: 'breakfast', label: currentCulture === 'fr' ? 'Petit-déjeuner' : 'Breakfast' },
    { id: 'lunch', label: currentCulture === 'fr' ? 'Déjeuner' : 'Lunch' },
    { id: 'dinner', label: currentCulture === 'fr' ? 'Dîner' : 'Dinner' },
    { id: 'snack', label: currentCulture === 'fr' ? 'Collations' : 'Snacks' },
  ]

  const filteredPlan = React.useMemo(() => {
    if (!aiPlan?.plan) return []
    if (activeFilter === 'all') return aiPlan.plan
    if (activeFilter === 'snack') return aiPlan.plan.filter(m => m.slotType === 'snack')
    return aiPlan.plan.filter(m => m.slotType === activeFilter)
  }, [aiPlan, activeFilter])

  if (isPlanLoading || !aiPlan) {
    return <TimetableSkeleton />
  }

  const dailyPlan = aiPlan

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {showToast && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} color="#4CAF50" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fixed Non-Scrollable Top Controls Header */}
      <div className={styles.fixedHeader}>
        {/* Sleek Header Bar */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/home')}>
            <ChevronLeft size={20} />
          </button>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>{t('suggestedFoodTimetable')}</h2>
            <p className={styles.subtitle}>
              {t('suggestedFoodTimetableSub')}
            </p>
          </div>
          <div className={styles.headerSpacer}></div>
        </div>

        {/* User Parameter Chips */}
        <div className={styles.parameterRow}>
          <div className={styles.paramChip}>🌍 {displayUser?.tribe || displayUser?.country || (currentCulture === 'fr' ? 'Général' : 'General')}</div>
          <div className={styles.paramChip}>🎯 {displayUser?.goal === 'lose' ? (currentCulture === 'fr' ? 'Perte de poids' : 'Weight Loss') : displayUser?.goal === 'gain' ? (currentCulture === 'fr' ? 'Prise de poids' : 'Weight Gain') : (currentCulture === 'fr' ? 'Maintien' : 'Maintain')}</div>
          <div className={styles.paramChip}>💰 {dailyPlan.budgetTier === 'low' ? (currentCulture === 'fr' ? 'Économique' : 'Economy') : dailyPlan.budgetTier === 'flexible' ? (currentCulture === 'fr' ? 'Premium' : 'Premium') : (currentCulture === 'fr' ? 'Standard' : 'Standard')}</div>
          <div className={styles.paramChip}>🔥 {goals.calorieGoal} kcal {currentCulture === 'fr' ? 'objectif' : 'target'}</div>
        </div>

        {/* Filter Pills Category Row (Matches the reference image header layout!) */}
        <div className={styles.filterPillsRow}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.filterPill} ${activeFilter === tab.id ? styles.activeFilterPill : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Bottom List Section */}
      <div className={styles.scrollContent}>
        <div className={styles.mealList}>
          {filteredPlan.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{currentCulture === 'fr' ? 'Aucun repas trouvé pour cette catégorie.' : 'No meals found for this category.'}</p>
            </div>
          ) : (
            filteredPlan.map((slot, idx) => {
              const logged = isMealLogged(slot.name)
              const isLoading = logSuggestedLoading === idx
              return (
                <div key={idx} className={`${styles.mealCard} ${logged ? styles.mealCardLogged : ''}`}>
                  {/* Left Meal Image Thumbnail */}
                  <MealImage
                    mealName={slot.name}
                    imageUrl={slot.image}
                    className={styles.mealCardImg}
                  />

                  {/* Right Meal Info Content */}
                  <div className={styles.mealCardInfo}>
                    <div className={styles.mealMetaRow}>
                      <span className={`${styles.slotBadge} ${styles[`slotBadge_${slot.slotType}`]}`}>
                        {slot.slotLabel || slot.label}
                      </span>
                      <span className={styles.mealTime}>{slot.time}</span>
                    </div>

                    <h4 className={styles.mealName}>{slot.name}</h4>
                    <p className={styles.mealDesc}>{slot.description}</p>

                    {/* Nutrient Macro Chips */}
                    <div className={styles.nutrientRow}>
                      <div className={styles.nutrientChip}>
                        <Flame size={11} color="#FF4500" />
                        <span>{slot.calories} kcal</span>
                      </div>
                      <div className={styles.nutrientChip}>
                        <Dumbbell size={11} color="#27AE60" />
                        <span>{slot.protein}g {currentCulture === 'fr' ? 'prot' : 'prot'}</span>
                      </div>
                      <div className={styles.nutrientChip}>
                        <Wheat size={11} color="#2F80ED" />
                        <span>{slot.carbs}g {currentCulture === 'fr' ? 'gluc' : 'carbs'}</span>
                      </div>
                      <div className={styles.nutrientChip}>
                        <Droplet size={11} color="#F2C94C" />
                        <span>{slot.fat}g {currentCulture === 'fr' ? 'lip' : 'fat'}</span>
                      </div>
                    </div>

                    {/* Log Button */}
                    <button
                      className={`${styles.logBtn} ${logged ? styles.logBtnLogged : ''}`}
                      onClick={() => !logged && handleLogSuggestedMeal(slot, idx)}
                      disabled={isLoading || logged}
                    >
                      {logged
                        ? (currentCulture === 'fr' ? '✓ Enregistré' : '✓ Logged')
                        : isLoading
                          ? (currentCulture === 'fr' ? 'Enregistrement...' : 'Logging...')
                          : (currentCulture === 'fr' ? 'Enregistrer ce repas 🍽️' : 'Log This Meal 🍽️')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Daily totals plan summary card at bottom of scroll area */}
        <div className={styles.timetableTotalCard}>
          <span className={styles.timetableTotalLabel}>{currentCulture === 'fr' ? 'Total journalier recommandé' : 'Daily Recommended Total'}</span>
          <div className={styles.timetableTotalRow}>
            <div className={styles.totalChip}><strong>{dailyPlan.totalCalories}</strong> kcal</div>
            <div className={styles.totalChip}><strong>{dailyPlan.totalProtein}g</strong> {currentCulture === 'fr' ? 'protéines' : 'protein'}</div>
            <div className={styles.totalChip}><strong>{dailyPlan.totalCarbs}g</strong> {currentCulture === 'fr' ? 'glucides' : 'carbs'}</div>
            <div className={styles.totalChip}><strong>{dailyPlan.totalFat}g</strong> {currentCulture === 'fr' ? 'lipides' : 'fat'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
