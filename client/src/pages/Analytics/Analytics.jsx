import React, { useState, useEffect } from 'react'
import styles from './Analytics.module.css'
import axios from 'axios'
import { 
  Loader2, 
  Calendar, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Droplet, 
  Footprints 
} from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useUiStore } from '../../store/uiStore'
import { useTranslation } from 'react-i18next'
import { MEAL_RECOMMENDATIONS, SNACKS_DATA } from '../Home/Home'

export default function Analytics() {
  const { user } = useUserStore()
  const { language } = useUiStore()
  const { t } = useTranslation()
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Calendar Modal States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [monthData, setMonthData] = useState([])
  const [monthLoading, setMonthLoading] = useState(false)
  const [dayDetails, setDayDetails] = useState(null)
  const [dayLoading, setDayLoading] = useState(false)

  const calorieGoal = user?.calorieGoal || 2000
  const isFrancophoneCountry = ['côte d\'ivoire', 'cote d\'ivoire', 'ivory coast', 'senegal', 'sénégal', 'benin', 'bénin', 'togo', 'cameroon', 'cameroun', 'guinea', 'guinée', 'mali', 'niger', 'burkina faso'].includes(user?.country?.toLowerCase() || '')
  const currentCulture = (language === 'fr' || isFrancophoneCountry) ? 'fr' : 'en'

  const generateEmptyWeeklyData = () => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
      data.push({
        day: dayName,
        calories: 0,
        water: 0
      })
    }
    return data
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/analytics/weekly', {
          withCredentials: true
        })
        if (response.data.success) {
          setChartData(response.data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch analytics, falling back to empty charts:', err)
        setChartData(generateEmptyWeeklyData())
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [])

  // Fetch month aggregate scores when calendar is open or currentMonth changes
  useEffect(() => {
    if (isCalendarOpen) {
      fetchMonthData(currentMonth)
    }
  }, [isCalendarOpen, currentMonth])

  const fetchMonthData = async (dateObj) => {
    setMonthLoading(true)
    try {
      const y = dateObj.getFullYear()
      const m = dateObj.getMonth() + 1
      const response = await axios.get(`/api/analytics/history/month?year=${y}&month=${m}`, {
        withCredentials: true
      })
      if (response.data.success) {
        setMonthData(response.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch month data, falling back to empty calendar:', err)
      const y = dateObj.getFullYear()
      const m = dateObj.getMonth()
      const numDays = new Date(y, m + 1, 0).getDate()
      const emptyMonth = Array.from({ length: numDays }).map((_, idx) => {
        const d = idx + 1
        return {
          date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          calories: 0,
          waterMl: 0,
          stepGoalHit: null,
          loggedMealNames: [],
          hasData: false
        }
      })
      setMonthData(emptyMonth)
    } finally {
      setMonthLoading(false)
    }
  }


  const fetchDayDetails = async (dateStr) => {
    setDayLoading(true)
    setDayDetails(null)
    try {
      const response = await axios.get(`/api/analytics/history/day/${dateStr}`, {
        withCredentials: true
      })
      if (response.data.success) {
        setDayDetails(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch day details:', err)
    } finally {
      setDayLoading(false)
    }
  }

  // Calculate daily completion score using the weighted PRD formula
  const calculateDailyScore = (dayObj) => {
    if (!dayObj || !dayObj.hasData) return 0

    const displayUser = user || {}
    
    // 1. Calorie Progress (35%)
    const calorieGoal = displayUser.calorieGoal || 2000
    const calorieProgress = Math.min(((dayObj.calories || 0) / calorieGoal) * 100, 100)

    // 2. Hydration Progress (25%)
    const waterPreference = displayUser.waterPreference || 'sachet'
    const waterItemCapacity = waterPreference === 'sachet' ? 500 : 750
    const storedWaterUnits = displayUser.waterGoal
    const waterGoalMl = (storedWaterUnits || 8) * waterItemCapacity
    const hydrationProgress = Math.min(((dayObj.waterMl || 0) / waterGoalMl) * 100, 100)

    // 3. Step Progress (25%)
    const stepProgress = dayObj.stepGoalHit === true ? 100 : 0

    // 4. Movement Progress (15%)
    let recommendationKey = 'General_Fallback'
    const userTribe = displayUser.tribe
    const userCountry = displayUser.country
    
    if (userCountry === 'Nigeria' && userTribe && MEAL_RECOMMENDATIONS[`Nigeria_${userTribe}`]) {
      recommendationKey = `Nigeria_${userTribe}`
    } else if (userCountry && MEAL_RECOMMENDATIONS[userCountry]) {
      recommendationKey = userCountry
    } else if (userCountry === 'Nigeria') {
      recommendationKey = 'Nigeria_General'
    }
    
    let budgetTier = displayUser.budgetPreference || 'moderate'
    if (budgetTier !== 'low' && budgetTier !== 'flexible') budgetTier = 'moderate'
    
    const countryData = MEAL_RECOMMENDATIONS[recommendationKey] || MEAL_RECOMMENDATIONS['General_Fallback']
    const budgetData = countryData[budgetTier] || countryData['moderate']
    const isGainGoal = displayUser.goal === 'gain'
    const snacksKey = SNACKS_DATA[recommendationKey] ? recommendationKey : 'General_Fallback'
    const snacks = SNACKS_DATA[snacksKey]?.[budgetTier] || SNACKS_DATA['General_Fallback']['moderate']

    const plan = []
    plan.push(budgetData.light)
    if (isGainGoal) plan.push(snacks[0])
    plan.push(budgetData.heavy)
    if (isGainGoal) {
      plan.push(snacks[1])
    } else {
      plan.push(snacks[0])
    }
    plan.push(budgetData.medium)
    if (isGainGoal) plan.push(snacks[2])

    const isMealLogged = (mealName) => (dayObj.loggedMealNames || []).some(m => m.toLowerCase() === mealName?.toLowerCase())
    const movementProgress = plan.some(meal => isMealLogged(meal.name)) ? 100 : 0

    const totalScore = Math.round(
      (calorieProgress * 0.35) +
      (hydrationProgress * 0.25) +
      (stepProgress * 0.25) +
      (movementProgress * 0.15)
    )

    return totalScore
  }

  const getScoreColor = (score) => {
    if (score <= 30) return 'var(--color-text-secondary)' // Grey / Neutral
    if (score <= 60) return 'var(--color-tertiary)' // Medium Green
    if (score <= 85) return 'var(--color-secondary)' // Green / On Track
    return 'var(--color-primary)' // Rich Forest Green / Excellent
  }

  const getCompletionMessage = (score) => {
    if (score <= 30) return t('scoreMsgFresh')
    if (score <= 60) return t('scoreMsgNice')
    if (score <= 85) return t('scoreMsgTrack')
    return t('scoreMsgExcel')
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    setSelectedDate(null)
    setDayDetails(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    setSelectedDate(null)
    setDayDetails(null)
  }

  const isCurrentMonthOrFuture = (dateObj) => {
    const now = new Date()
    return dateObj.getFullYear() >= now.getFullYear() && dateObj.getMonth() >= now.getMonth()
  }

  // Generate Calendar Grid
  const year = currentMonth.getFullYear()
  const monthIndex = currentMonth.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const firstDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Adjusted for Mon-first
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()

  const waterPreference = user?.waterPreference || 'sachet'
  const waterItemCapacity = waterPreference === 'sachet' ? 500 : 750

  // Calculate scales and averages for weekly chart
  const maxCalories = chartData.length > 0 ? Math.max(...chartData.map(item => item.calories), 2500) : 2500
  const maxWater = chartData.length > 0 ? Math.max(...chartData.map(item => item.water), 10) : 10

  const avgCalories = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, item) => sum + item.calories, 0) / chartData.length) 
    : 0

  const avgWater = chartData.length > 0 
    ? (chartData.reduce((sum, item) => sum + item.water, 0) / chartData.length).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
        <p>{currentCulture === 'fr' ? 'Chargement des tendances hebdomadaires...' : 'Loading weekly trends...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    )
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{currentCulture === 'fr' ? 'Analytiques' : 'Analytics'}</h1>
          <p className={styles.subtitle}>{currentCulture === 'fr' ? 'Votre progression sur les 7 derniers jours' : 'Your progress over the last 7 days'}</p>
        </div>
        <div className={styles.calendarIconWrapper} onClick={() => setIsCalendarOpen(true)}>
          <Calendar size={22} className={styles.calendarIcon} />
        </div>
      </header>

      {/* Calorie Intake Chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{currentCulture === 'fr' ? 'Apport calorique' : 'Calorie Intake'}</h3>
          <span className={styles.cardAction}>{currentCulture === 'fr' ? `Objectif : ${calorieGoal.toLocaleString()} kcal` : `Goal: ${calorieGoal.toLocaleString()} kcal`}</span>
        </div>
        
        <div className={styles.chartArea}>
          <div className={styles.chart}>
            {chartData.map(item => {
              const barHeight = Math.min(((item.calories || 0) / maxCalories) * 100, 100)
              return (
                <div key={item.day} className={styles.barContainer}>
                  <div 
                    className={styles.bar} 
                    style={{ height: `${barHeight}%` }}
                  >
                    <div className={styles.tooltip}>{item.calories || 0} kcal</div>
                  </div>
                  <span className={styles.barLabel}>{item.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hydration History Chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{currentCulture === 'fr' ? "Historique d'hydratation" : 'Hydration History'}</h3>
          <span className={styles.cardAction}>
            {currentCulture === 'fr'
              ? `Objectif : ${user?.waterGoal || (waterPreference === 'sachet' ? 8 : 6)} ${waterPreference === 'sachet' ? 'sachets' : 'bouteilles'}`
              : `Goal: ${user?.waterGoal || (waterPreference === 'sachet' ? 8 : 6)} ${waterPreference === 'sachet' ? 'sachets' : 'bottles'}`}
          </span>
        </div>
        
        <div className={styles.chartArea}>
          <div className={styles.chart}>
            {chartData.map(item => {
              const barHeight = Math.min(((item.water || 0) / maxWater) * 100, 100)
              return (
                <div key={item.day} className={styles.barContainer}>
                  <div 
                    className={styles.bar} 
                    style={{ 
                       height: `${barHeight}%`,
                       background: 'linear-gradient(to top, var(--color-hydration-soft), var(--color-hydration))'
                    }}
                  >
                     <div className={styles.tooltip}>{item.water || 0} {currentCulture === 'fr' ? 'unités' : 'units'}</div>
                  </div>
                  <span className={styles.barLabel}>{item.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dynamic aggregates */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>{currentCulture === 'fr' ? 'Calories journalières moy.' : 'Avg. Daily Calories'}</span>
          <span className={styles.statValue}>{avgCalories} kcal</span>
          <span className={styles.statSub}>{avgCalories >= 1800 && avgCalories <= 2200 ? (currentCulture === 'fr' ? 'Plage idéale' : 'Perfect range') : (currentCulture === 'fr' ? 'Ajustez vos repas' : 'Adjust calorie logs')}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>{currentCulture === 'fr' ? 'Hydratation journalière moy.' : 'Avg. Daily Hydration'}</span>
          <span className={styles.statValue}>{avgWater} {currentCulture === 'fr' ? 'unités' : 'units'}</span>
          <span className={styles.statSub}>{currentCulture === 'fr' ? 'Sachet / Bouteille' : 'Sachet/Bottle preference'}</span>
        </div>
      </div>

      {/* Calendar History Modal overlay */}
      {isCalendarOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <button 
                className={styles.closeBtn} 
                onClick={() => { 
                  setIsCalendarOpen(false)
                  setSelectedDate(null)
                  setDayDetails(null)
                }}
              >
                <X size={24} />
              </button>
              <h2 className={styles.modalTitle}>{currentCulture === 'fr' ? "Historique du calendrier" : 'Calendar History'}</h2>
              <div style={{ width: 24 }}></div>
            </div>

            {/* Month Navigator */}
            <div className={styles.monthNav}>
              <button onClick={handlePrevMonth} className={styles.monthNavBtn}>
                <ChevronLeft size={20} />
              </button>
              <span className={styles.monthLabel}>
                {currentMonth.toLocaleDateString(currentCulture === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={handleNextMonth} 
                className={styles.monthNavBtn} 
                disabled={isCurrentMonthOrFuture(currentMonth)}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className={styles.calendarContainer}>
              <div className={styles.calendarGrid}>
                {/* Weekday headers */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className={styles.weekdayHeader}>{day}</div>
                ))}

                {/* Empty offsets */}
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className={styles.emptyDay}></div>
                ))}

                {/* Calendar Days */}
                {Array.from({ length: totalDays }).map((_, idx) => {
                  const d = idx + 1
                  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const dayStats = monthData.find(item => item.date === dateStr)
                  const score = dayStats ? calculateDailyScore(dayStats) : 0
                  const hasData = dayStats ? dayStats.hasData : false
                  const isSelected = selectedDate === dateStr
                  const isFuture = new Date(year, monthIndex, d) > new Date()

                  return (
                    <button
                      key={d}
                      className={`${styles.calendarDay} ${isSelected ? styles.selectedDay : ''} ${isFuture ? styles.futureDay : ''}`}
                      onClick={() => {
                        if (!isFuture) {
                          setSelectedDate(dateStr)
                          fetchDayDetails(dateStr)
                        }
                      }}
                      disabled={isFuture}
                    >
                      <span className={styles.dayNumber}>{d}</span>
                      {hasData && (
                        <span 
                          className={styles.scoreDot} 
                          style={{ backgroundColor: getScoreColor(score) }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Details Panel */}
            <div className={styles.detailsContainer}>
              {selectedDate ? (
                dayLoading ? (
                  <div className={styles.detailsLoading}>
                    <Loader2 className={styles.spinner} size={24} />
                    <p>{currentCulture === 'fr' ? 'Chargement des détails...' : 'Loading details...'}</p>
                  </div>
                ) : dayDetails ? (
                  <div className={styles.dayDetailsContent}>
                    <h3 className={styles.detailsDate}>
                      {new Date(selectedDate).toLocaleDateString(currentCulture === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    
                    {/* Completion Score */}
                    {(() => {
                      const dayStats = monthData.find(item => item.date === selectedDate)
                      const score = dayStats ? calculateDailyScore(dayStats) : 0
                      return (
                        <div className={styles.scoreCard} style={{ borderLeft: `4px solid ${getScoreColor(score)}` }}>
                          <span className={styles.scoreValue}>{score}%</span>
                          <span className={styles.scoreMessage}>{getCompletionMessage(score)}</span>
                        </div>
                      )
                    })()}

                    {/* Stats Metrics Row */}
                    <div className={styles.metricsRow}>
                      <div className={styles.metricItem}>
                        <Flame size={18} className={styles.metricIconCalorie} />
                        <div className={styles.metricText}>
                          <span className={styles.metricVal}>
                            {dayDetails.meals.reduce((sum, m) => sum + m.calories, 0)} kcal
                          </span>
                          <span className={styles.metricLabel}>{t('caloriesIntake')}</span>
                        </div>
                      </div>
                      <div className={styles.metricItem}>
                        <Droplet size={18} className={styles.metricIconHydration} />
                        <div className={styles.metricText}>
                          <span className={styles.metricVal}>
                            {Math.round((dayDetails.waterLogs.reduce((sum, w) => sum + w.amount, 0) / waterItemCapacity) * 10) / 10} {waterPreference === 'sachet' ? t('sachets') : t('bottles')}
                          </span>
                          <span className={styles.metricLabel}>{t('waterIntake')}</span>
                        </div>
                      </div>
                      <div className={styles.metricItem}>
                        <Footprints size={18} className={styles.metricIconSteps} />
                        <div className={styles.metricText}>
                          <span className={styles.metricVal}>{dayDetails.totalSteps.toLocaleString()}</span>
                           <span className={styles.metricLabel}>{currentCulture === 'fr' ? 'Pas' : 'Steps'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Logged Meals List */}
                    <h4 className={styles.subTitle}>{t('whatIAteToday')}</h4>
                    {dayDetails.meals.length === 0 ? (
                      <p className={styles.emptyText}>{currentCulture === 'fr' ? 'Aucun repas enregistré ce jour.' : 'No meals logged on this day.'}</p>
                    ) : (
                      <div className={styles.dayMealsList}>
                        {dayDetails.meals.map(meal => (
                          <div key={meal.id} className={styles.dayMealItem}>
                            <div className={styles.dayMealInfo}>
                              <span className={styles.dayMealName}>{meal.name}</span>
                              <div className={styles.dayMealMacros}>
                                <span>🔥 {meal.calories} kcal</span>
                                <span>🥩 {meal.protein || 0}g</span>
                                <span>🍞 {meal.carbs || 0}g</span>
                                <span>💧 {meal.fat || 0}g</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.emptyText}>{currentCulture === 'fr' ? 'Aucun journal trouvé pour cette date.' : 'No logs found for this date.'}</p>
                )
              ) : (
                <div className={styles.selectPrompt}>
                  <Calendar size={32} className={styles.selectPromptIcon} />
                  <p>{currentCulture === 'fr' ? 'Sélectionnez un jour pour voir le bilan de votre journée bien-être' : 'Select a day to view your wellness history breakdown'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
