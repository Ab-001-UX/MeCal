import React, { useState, useEffect } from 'react'
import { useUserStore } from '../../store/userStore'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Activity.module.css'
import { ChevronLeft, Footprints, Flame, Dumbbell, Clock, Plus, CheckCircle2, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../../i18n'
import { getDynamicStepsGoal } from '../../utils/goals.js'

export default function Activity() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // State Management
  const [activities, setActivities] = useState([])
  const [todaySteps, setTodaySteps] = useState(0)
  const [todayActiveCal, setTodayActiveCal] = useState(0)
  const [todayActiveMinutes, setTodayActiveMinutes] = useState(0)
  
  const [selectedExercise, setSelectedExercise] = useState('Steps')
  const [syncInputValue, setSyncInputValue] = useState(5000)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    fetchTodayActivities()
  }, [])

  const fetchTodayActivities = async () => {
    try {
      const response = await axios.get('/api/activity/today', {
        withCredentials: true
      })
      if (response.data.success) {
        setActivities(response.data.data.activities || [])
        setTodaySteps(response.data.data.totalSteps || 0)
        setTodayActiveCal(response.data.data.totalCaloriesBurned || 0)
        setTodayActiveMinutes(response.data.data.totalActiveMinutes || 0)
      }
    } catch (err) {
      console.error('Failed to fetch today\'s activities:', err)
    }
  }

  const stepsGoal = getDynamicStepsGoal(user)
  const stepProgress = Math.min((todaySteps / stepsGoal) * 100, 100)

  // Handlers
  const handleSyncActivity = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let calBurn = 0
      const valueInt = parseInt(syncInputValue) || 0
      
      if (selectedExercise === 'Steps') {
        calBurn = valueInt * 0.04
      } else if (selectedExercise === 'Dancing') {
        calBurn = valueInt * 6.5
      } else if (selectedExercise === 'Jogging') {
        calBurn = valueInt * 8.0
      } else if (selectedExercise === 'Workout') {
        calBurn = valueInt * 5.0
      }
      
      const response = await axios.post('/api/activity/log', {
        type: selectedExercise,
        value: valueInt,
        calories: calBurn
      }, {
        withCredentials: true
      })
      
      if (response.data.success) {
        setToastMessage(t('syncedSuccess', { exercise: getExerciseLabel(selectedExercise) }))
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        
        // Trigger congratulations confetti
        if (window.confetti) {
          const duration = 2.5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

          const randomInRange = (min, max) => Math.random() * (max - min) + min;

          const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
              return clearInterval(interval);
            }
            const particleCount = 40 * (timeLeft / duration);
            window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 200);
        }

        // Reset sync fields
        setSyncInputValue(selectedExercise === 'Steps' ? 5000 : 30)
        fetchTodayActivities()
      }
    } catch (err) {
      console.error('Failed to log activity:', err)
      alert('Could not sync activity. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getExerciseLabel = (type) => {
    if (type === 'Steps') return t('stepsSync')
    if (type === 'Dancing') return t('afrobeatsDance')
    if (type === 'Jogging') return t('joggingRun')
    if (type === 'Workout') return t('homeWorkout')
    return type
  }

  // Format activity timing nicely
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return t('today') || 'Today'
    }
  }

  // Ring circular calculations
  const strokeDasharray = 339.29; // 2 * PI * 54
  const strokeDashoffset = strokeDasharray * (1 - stepProgress / 100)

  return (
    <div className={styles.container}>
      {/* Toast message alert */}
      {showToast && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} color="#4CAF50" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/home')}>
            <ChevronLeft size={20} />
          </button>
          <h2 className={styles.title}>{t('activityPageTitle')}</h2>
        </div>
        <p className={styles.subtitle}>{t('activityPageSub')}</p>
      </div>

      <div className={styles.pageGrid}>
        
        {/* Left Column: Stats & Progress */}
        <div className={styles.statsColumn}>
          
          {/* Circular Step Progress Card */}
          <div className={styles.circularCard}>
            <div className={styles.progressCircleContainer}>
              <svg width="140" height="140" viewBox="0 0 140 140" className={styles.progressSvg}>
                {/* Background Ring */}
                <circle cx="70" cy="70" r="54" fill="none" stroke="var(--color-outline-variant)" strokeWidth="10" opacity="0.25" />
                {/* Active Ring */}
                <circle 
                  cx="70" 
                  cy="70" 
                  r="54" 
                  fill="none" 
                  stroke="var(--color-primary)" 
                  strokeWidth="10" 
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 70 70)"
                  strokeLinecap="round"
                />
              </svg>
              <div className={styles.progressCenter}>
                <Footprints size={28} className={styles.stepFootprintsIcon} />
                <span className={styles.progressPercentage}>{Math.round(stepProgress)}%</span>
                <span className={styles.progressCenterLabel}>{t('ofGoal')}</span>
              </div>
            </div>
            
            <div className={styles.stepsStatsBox}>
              <h3 className={styles.todayStepsText}>{todaySteps.toLocaleString()}</h3>
              <p className={styles.stepsGoalText}>{t('goalLabel')}: {stepsGoal.toLocaleString()} {t('steps')}</p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className={styles.metricsGrid}>
            
            {/* Active Cal Burn */}
            <div className={styles.metricCard}>
              <div className={`${styles.metricIconBox} ${styles.iconFire}`}>
                <Flame size={20} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{todayActiveCal} kcal</span>
                <span className={styles.metricLabel}>{t('energyBurned')}</span>
              </div>
            </div>

            {/* Active Duration */}
            <div className={styles.metricCard}>
              <div className={`${styles.metricIconBox} ${styles.iconClock}`}>
                <Clock size={20} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricValue}>{todayActiveMinutes} {t('minutes')}</span>
                <span className={styles.metricLabel}>{t('activeDuration')}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Sync & Log */}
        <div className={styles.formColumn}>
          
          {/* Sync Activity Form Card */}
          <div className={styles.syncCard}>
            <h3 className={styles.sectionTitle}>{t('syncPhysicalActivity')}</h3>
            <p className={styles.sectionIntro}>{t('syncIntro')}</p>
            
            <form onSubmit={handleSyncActivity} className={styles.syncForm}>
              
              {/* Category Options Grid */}
              <div className={styles.exerciseGrid}>
                
                {/* Steps Sync */}
                <div 
                  className={`${styles.exerciseCard} ${selectedExercise === 'Steps' ? styles.exerciseActive : ''}`}
                  onClick={() => { setSelectedExercise('Steps'); setSyncInputValue(5000); }}
                >
                  <span className={styles.exerciseIcon}>🚶‍♂️</span>
                  <span className={styles.exerciseLabel}>{t('stepsSync')}</span>
                  <span className={styles.exerciseRate}>{t('stepsSyncRate')}</span>
                </div>

                {/* Afrobeats Dance */}
                <div 
                  className={`${styles.exerciseCard} ${selectedExercise === 'Dancing' ? styles.exerciseActive : ''}`}
                  onClick={() => { setSelectedExercise('Dancing'); setSyncInputValue(30); }}
                >
                  <span className={styles.exerciseIcon}>💃</span>
                  <span className={styles.exerciseLabel}>{t('afrobeatsDance')}</span>
                  <span className={styles.exerciseRate}>6.5 kcal/min</span>
                </div>

                {/* Jogging */}
                <div 
                  className={`${styles.exerciseCard} ${selectedExercise === 'Jogging' ? styles.exerciseActive : ''}`}
                  onClick={() => { setSelectedExercise('Jogging'); setSyncInputValue(30); }}
                >
                  <span className={styles.exerciseIcon}>🏃‍♂️</span>
                  <span className={styles.exerciseLabel}>{t('joggingRun')}</span>
                  <span className={styles.exerciseRate}>8.0 kcal/min</span>
                </div>

                {/* Home Workout */}
                <div 
                  className={`${styles.exerciseCard} ${selectedExercise === 'Workout' ? styles.exerciseActive : ''}`}
                  onClick={() => { setSelectedExercise('Workout'); setSyncInputValue(30); }}
                >
                  <span className={styles.exerciseIcon}>🏋️‍♂️</span>
                  <span className={styles.exerciseLabel}>{t('homeWorkout')}</span>
                  <span className={styles.exerciseRate}>5.0 kcal/min</span>
                </div>

              </div>

              {/* Input Group */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  {selectedExercise === 'Steps' ? t('totalStepsTaken') : t('durationInMinutes')}
                </label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="number"
                    value={syncInputValue}
                    onChange={(e) => setSyncInputValue(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder={selectedExercise === 'Steps' ? 'e.g. 5000' : 'e.g. 30'}
                    className={styles.syncInput}
                    required
                  />
                  <span className={styles.inputSuffix}>
                    {selectedExercise === 'Steps' ? t('steps') : t('minutes')}
                  </span>
                </div>
              </div>

              {/* Sync Button */}
              <button type="submit" className={styles.syncSubmitBtn} disabled={isSubmitting}>
                {isSubmitting ? t('syncing') : t('syncTodayActivity')}
              </button>

            </form>
          </div>

          {/* Today's Activity Log List */}
          <div className={styles.historyCard}>
            <h3 className={styles.sectionTitle}>{t('todaysLoggedActivities')}</h3>
            
            {activities.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🏃‍♂️</span>
                <h4 className={styles.emptyTitle}>{t('noActivitiesSynced')}</h4>
                <p className={styles.emptyDesc}>{t('noActivitiesDesc')}</p>
              </div>
            ) : (
              <div className={styles.activityList}>
                {activities.map((act) => {
                  let actIcon = '🏃‍♂️'
                  if (act.type === 'Steps') actIcon = '🚶‍♂️'
                  else if (act.type === 'Dancing') actIcon = '💃'
                  else if (act.type === 'Workout') actIcon = '🏋️‍♂️'
                  
                  return (
                    <div key={act.id} className={styles.activityItem}>
                      <div className={styles.activityItemLeft}>
                        <div className={styles.activityIconCircle}>{actIcon}</div>
                        <div className={styles.activityMeta}>
                          <span className={styles.activityTypeName}>
                            {act.type === 'Steps' ? t('stepsSyncedText') : getExerciseLabel(act.type)}
                          </span>
                          <span className={styles.activityTime}>{formatTime(act.createdAt)}</span>
                        </div>
                      </div>
                      <div className={styles.activityItemRight}>
                        <span className={styles.activityValueDetail}>
                          {act.type === 'Steps' ? `${act.value.toLocaleString()} ${t('steps')}` : `${act.value} ${t('minutes')}`}
                        </span>
                        <span className={styles.activityKcalBurn}>
                          +{Math.round(act.calories)} kcal
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
