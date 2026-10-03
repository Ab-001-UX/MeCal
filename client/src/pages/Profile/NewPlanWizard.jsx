import React, { useState, useEffect } from 'react'
import styles from './NewPlanWizard.module.css'
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { getWellnessSummary, updateProfile } from '../../services/auth.service.js'
import { useTrackingStore } from '../../store/trackingStore.js'

export default function NewPlanWizard({ isOpen, onClose, user, currentCulture, onPlanActivated }) {
  if (!isOpen) return null

  const isFr = currentCulture === 'fr'
  const [step, setStep] = useState(1)
  const totalSteps = 7

  const [form, setForm] = useState({
    goal: user?.goal || 'lose',
    targetWeight: user?.targetWeight ?? '',
    targetDuration: user?.targetDuration || '3 months',
    customTargetDuration: user?.customTargetDuration || '',
    unitPreference: user?.unitPreference || 'metric',
    weight: user?.weight ?? '',
    height: user?.height ?? '',
    age: user?.age ?? '',
    gender: user?.gender || 'Male',
    country: user?.country || 'Nigeria',
    tribe: user?.tribe || 'Yoruba',
    lifestyleType: user?.lifestyleType || 'mixed',
    budgetPreference: user?.budgetPreference || 'moderate',
    activityLevel: user?.activityLevel || 'moderate',
    waterPreference: user?.waterPreference || 'sachet',
    allergies: Array.isArray(user?.allergies) ? user.allergies : [],
    otherAllergies: user?.otherAllergies || ''
  })

  const [summaryData, setSummaryData] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // When step 7 is reached, fetch the AI tailored blueprint
  useEffect(() => {
    if (step === 7) {
      fetchBlueprint()
    }
  }, [step])

  const fetchBlueprint = async () => {
    setLoadingSummary(true)
    setErrorMsg('')
    try {
      const response = await getWellnessSummary({
        ...form,
        age: form.age ? parseInt(form.age, 10) : null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : null,
        lang: isFr ? 'fr' : 'en'
      })
      if (response.data.success && response.data.data) {
        setSummaryData(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch wellness blueprint:', err)
      // Fallback targets if API fails
      setSummaryData({
        calorieGoal: form.goal === 'lose' ? 1800 : form.goal === 'gain' ? 2600 : 2200,
        waterGoal: form.waterPreference === 'bottle' ? 4 : 6,
        stepGoal: form.activityLevel === 'active' ? 10000 : 8000,
        summary: isFr 
          ? "Votre nouveau plan personnalisé a été calibré avec succès en fonction de vos nouvelles préférences et métriques corporelles."
          : "Your new personalized blueprint has been calibrated based on your refreshed goal and body metrics."
      })
    } finally {
      setLoadingSummary(false)
    }
  }

  const validateCurrentStep = () => {
    setErrorMsg('')
    if (step === 1) {
      if ((form.goal === 'lose' || form.goal === 'gain') && !form.targetWeight) {
        setErrorMsg(isFr ? 'Veuillez saisir votre poids cible.' : 'Please enter a target weight.')
        return false
      }
      if (form.weight && form.targetWeight) {
        const cur = parseFloat(form.weight)
        const tgt = parseFloat(form.targetWeight)
        if (form.goal === 'lose' && tgt >= cur) {
          setErrorMsg(isFr ? 'Le poids cible doit être inférieur à votre poids actuel.' : 'Target weight must be less than your current weight.')
          return false
        }
        if (form.goal === 'gain' && tgt <= cur) {
          setErrorMsg(isFr ? 'Le poids cible doit être supérieur à votre poids actuel.' : 'Target weight must be greater than your current weight.')
          return false
        }
      }
    }
    if (step === 2) {
      if (form.targetDuration === 'custom' && !form.customTargetDuration.trim()) {
        setErrorMsg(isFr ? 'Veuillez préciser la durée personnalisée (ex: 45 jours).' : 'Please enter your custom duration (e.g. 45 days).')
        return false
      }
    }
    if (step === 3) {
      if (!form.weight || parseFloat(form.weight) <= 0) {
        setErrorMsg(isFr ? 'Veuillez entrer un poids valide.' : 'Please enter a valid weight.')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return
    if (step < totalSteps) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setErrorMsg('')
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const handleActivateNewPlan = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      const calcCalories = summaryData?.calorieGoal || (form.goal === 'lose' ? 1800 : form.goal === 'gain' ? 2500 : 2075)
      const calcWater = summaryData?.waterGoal || (form.waterPreference === 'bottle' ? 4 : 5)
      const calcSteps = summaryData?.stepGoal || (form.activityLevel === 'active' ? 10000 : form.activityLevel === 'low' ? 5000 : 7500)

      const payload = {
        ...form,
        targetDuration: form.targetDuration === 'custom' ? form.customTargetDuration : form.targetDuration,
        age: form.age ? parseInt(form.age, 10) : null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : null,
        calorieGoal: calcCalories,
        waterGoal: calcWater,
        stepGoal: calcSteps,
        resetPlan: true // Tells backend to reset createdAt to now & invalidate recommendations cache!
      }

      const response = await updateProfile(payload)
      if (response.data.success) {
        // Clear local tracking plan cache
        useTrackingStore.getState().setAiMealPlan(null)
        useTrackingStore.getState().setLastFetchedDate(null)
        onPlanActivated(response.data.data)
      } else {
        setErrorMsg(isFr ? 'Impossible d’activer le nouveau plan.' : 'Could not activate new plan. Please try again.')
      }
    } catch (err) {
      console.error('Failed to activate new plan:', err)
      setErrorMsg(isFr ? 'Erreur lors de l’activation du plan.' : 'Failed to activate new plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.stepIndicator}>
              {isFr ? `Étape ${step} sur ${totalSteps}` : `Step ${step} of ${totalSteps}`}
            </span>
            <h2 className={styles.modalTitle}>
              {isFr ? 'Nouveau Plan & Objectif' : 'Start a New Plan'}
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className={styles.modalBody}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', background: 'rgba(235, 87, 87, 0.1)', color: '#eb5757', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1: GOAL & TARGET WEIGHT */}
          {step === 1 && (
            <div>
              <h3 className={styles.stepHeading}>{isFr ? 'Quel est votre nouvel objectif ?' : 'What is your new goal?'}</h3>
              <p className={styles.stepSubtitle}>{isFr ? 'Choisissez votre direction pour cette nouvelle étape.' : 'Select what you would like to achieve in this new cycle.'}</p>

              <div className={styles.cardGrid}>
                {[
                  { value: 'lose', icon: '🥗', title: isFr ? 'Perdre du poids' : 'Lose Weight', desc: isFr ? 'Déficit calorique durable et aliments rassasiants' : 'Calorie deficit with filling fiber-rich local meals' },
                  { value: 'maintain', icon: '⚖️', title: isFr ? 'Maintenir mon poids' : 'Maintain Weight', desc: isFr ? 'Stabilisation de l’énergie, vitalité et micronutriments' : 'Balanced nutrition to sustain energy and vitality' },
                  { value: 'gain', icon: '💪', title: isFr ? 'Prendre du poids / muscle' : 'Gain Weight / Muscle', desc: isFr ? 'Surplus énergétique propre avec protéines locales' : 'Clean calorie surplus with protein-rich staples' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.optionCard} ${form.goal === opt.value ? styles.optionCardActive : ''}`}
                    onClick={() => setForm({ ...form, goal: opt.value })}
                  >
                    <span className={styles.optionIcon}>{opt.icon}</span>
                    <div className={styles.optionContent}>
                      <div className={styles.optionTitle}>{opt.title}</div>
                      <div className={styles.optionDesc}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {(form.goal === 'lose' || form.goal === 'gain') && (
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label>
                    {isFr ? 'Poids cible souhaité' : 'Target Weight'}{' '}
                    ({form.unitPreference === 'imperial' ? 'lbs' : 'kg'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    className={styles.formInput}
                    placeholder={form.unitPreference === 'imperial' ? 'e.g. 150' : 'e.g. 68'}
                    value={form.targetWeight}
                    onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DURATION */}
          {step === 2 && (
            <div>
              <h3 className={styles.stepHeading}>{isFr ? 'Durée du programme' : 'Plan Timeline'}</h3>
              <p className={styles.stepSubtitle}>{isFr ? 'Combien de temps souhaitez-vous dédier à cet objectif ?' : 'How long will you commit to this goal?'}</p>

              <div className={styles.cardGrid}>
                {[
                  { value: '1 month', icon: '⚡', title: isFr ? '1 Mois (30 Jours)' : '1 Month (30 Days)', desc: isFr ? 'Idéal pour relancer votre métabolisme' : 'Quick boost and habit kickstart' },
                  { value: '3 months', icon: '🌟', title: isFr ? '3 Mois (90 Jours) — Recommandé' : '3 Months (90 Days) — Recommended', desc: isFr ? 'Résultats profonds, visibles et durables' : 'Sustainable, lasting lifestyle transformation' },
                  { value: '6 months', icon: '🏆', title: isFr ? '6 Mois (180 Jours)' : '6 Months (180 Days)', desc: isFr ? 'Transformation complète à long terme' : 'Long-term metabolic mastery' },
                  { value: 'custom', icon: '⏱️', title: isFr ? 'Durée personnalisée' : 'Custom Duration', desc: isFr ? 'Définissez votre propre nombre de jours/semaines' : 'Set your own custom number of days or weeks' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.optionCard} ${form.targetDuration === opt.value ? styles.optionCardActive : ''}`}
                    onClick={() => setForm({ ...form, targetDuration: opt.value })}
                  >
                    <span className={styles.optionIcon}>{opt.icon}</span>
                    <div className={styles.optionContent}>
                      <div className={styles.optionTitle}>{opt.title}</div>
                      <div className={styles.optionDesc}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {form.targetDuration === 'custom' && (
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label>{isFr ? 'Votre durée personnalisée' : 'Specify custom duration'}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder={isFr ? 'ex: 45 jours, 2 mois' : 'e.g. 45 days, 8 weeks'}
                    value={form.customTargetDuration}
                    onChange={(e) => setForm({ ...form, customTargetDuration: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CURRENT BODY METRICS */}
          {step === 3 && (
            <div>
              <h3 className={styles.stepHeading}>{isFr ? 'Recalibration de votre corps' : 'Recalibrate Body Metrics'}</h3>
              <p className={styles.stepSubtitle}>{isFr ? 'Votre poids actuel nous aide à calculer des calories précises.' : 'Your current weight ensures accurate calorie and macro calculations.'}</p>

              <div className={styles.unitToggleRow}>
                <button
                  type="button"
                  className={`${styles.unitBtn} ${form.unitPreference === 'metric' ? styles.unitBtnActive : ''}`}
                  onClick={() => setForm({ ...form, unitPreference: 'metric' })}
                >
                  kg / cm
                </button>
                <button
                  type="button"
                  className={`${styles.unitBtn} ${form.unitPreference === 'imperial' ? styles.unitBtnActive : ''}`}
                  onClick={() => setForm({ ...form, unitPreference: 'imperial' })}
                >
                  lbs / ft
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Poids actuel' : 'Current Weight'} ({form.unitPreference === 'imperial' ? 'lbs' : 'kg'})</label>
                <input
                  type="number"
                  step="any"
                  className={styles.formInput}
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Taille' : 'Height'} ({form.unitPreference === 'imperial' ? 'ft' : 'cm'})</label>
                <input
                  type="number"
                  step="any"
                  className={styles.formInput}
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Âge' : 'Age'}</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 4: REGIONAL CULTURE */}
          {step === 4 && (
            <div>
              <h3 className={styles.stepHeading}>{isFr ? 'Cuisine régionale & culture' : 'Regional Cuisine'}</h3>
              <p className={styles.stepSubtitle}>{isFr ? 'Assurez-vous que les repas recommandés correspondent à vos goûts.' : 'Ensure daily recommendations feature local foods you love.'}</p>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Pays' : 'Country'}</label>
                <select 
                  className={styles.formSelect}
                  value={form.country} 
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Ivory Coast">Côte d'Ivoire</option>
                  <option value="Cameroon">Cameroon</option>
                  <option value="Benin">Benin</option>
                  <option value="Togo">Togo</option>
                  <option value="Mali">Mali</option>
                  <option value="Other">{isFr ? 'Autre' : 'Other'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Tribu ou style culinaire' : 'Tribe or Culinary Style'}</label>
                <select 
                  className={styles.formSelect}
                  value={form.tribe} 
                  onChange={(e) => setForm({ ...form, tribe: e.target.value })}
                >
                  <option value="Yoruba">Yoruba</option>
                  <option value="Igbo">Igbo</option>
                  <option value="Hausa">Hausa</option>
                  <option value="Akan">Akan / Ghanaian</option>
                  <option value="Wolof">Wolof / Senegalese</option>
                  <option value="Baoule">Baoulé / Ivorian</option>
                  <option value="General">{isFr ? 'Général ou Mixte' : 'General or Mixed'}</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: LIFESTYLE, BUDGET & ACTIVITY */}
          {step === 5 && (
            <div>
              <h3 className={styles.stepHeading}>{isFr ? 'Mode de vie & activité' : 'Lifestyle & Activity'}</h3>
              <p className={styles.stepSubtitle}>{isFr ? 'Nous adaptons la complexité des repas à votre emploi du temps.' : 'We tailor meal preparation complexity to your routine.'}</p>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Mode de vie' : 'Lifestyle Type'}</label>
                <select 
                  className={styles.formSelect}
                  value={form.lifestyleType} 
                  onChange={(e) => setForm({ ...form, lifestyleType: e.target.value })}
                >
                  <option value="student">{isFr ? 'Étudiant (repas rapides et simples)' : 'Student (Quick & simple meals)'}</option>
                  <option value="professional">{isFr ? 'Professionnel (bureau et déplacements)' : 'Professional (Workday pacing)'}</option>
                  <option value="mixed">{isFr ? 'Mixte / Flexible' : 'Mixed / Flexible'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Budget repas' : 'Meal Budget Preference'}</label>
                <select 
                  className={styles.formSelect}
                  value={form.budgetPreference} 
                  onChange={(e) => setForm({ ...form, budgetPreference: e.target.value })}
                >
                  <option value="low">{isFr ? 'Économique / Ingrédients du marché' : 'Budget-friendly / Local market staples'}</option>
                  <option value="moderate">{isFr ? 'Modéré' : 'Moderate'}</option>
                  <option value="flexible">{isFr ? 'Flexible / Plats premium' : 'Flexible / Premium variety'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Niveau d’activité physique' : 'Daily Activity Level'}</label>
                <select 
                  className={styles.formSelect}
                  value={form.activityLevel} 
                  onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
                >
                  <option value="low">{isFr ? 'Sédentaire / Faible (bureau)' : 'Low / Sedentary (mostly sitting)'}</option>
                  <option value="moderate">{isFr ? 'Modéré (marche régulière)' : 'Moderate (regular walking)'}</option>
                  <option value="active">{isFr ? 'Très actif (entraînement quotidien)' : 'Active (daily training / manual work)'}</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 6: WATER & ALLERGIES */}
          {step === 6 && (
            <div>
              <h3 className={styles.stepHeading}>{isFr ? 'Hydratation & Allergies' : 'Hydration & Allergies'}</h3>
              <p className={styles.stepSubtitle}>{isFr ? 'Sélectionnez les ingrédients à exclure de vos repas.' : 'Select ingredients to strictly exclude from recommendations.'}</p>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Préférence d’eau' : 'Water Container Preference'}</label>
                <select 
                  className={styles.formSelect}
                  value={form.waterPreference} 
                  onChange={(e) => setForm({ ...form, waterPreference: e.target.value })}
                >
                  <option value="sachet">{isFr ? 'Sachet (Eau pure 500ml)' : 'Sachet Pure Water (500ml)'}</option>
                  <option value="bottle">{isFr ? 'Bouteille (750ml)' : 'Bottle (750ml)'}</option>
                  <option value="both">{isFr ? 'Les deux' : 'Both'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{isFr ? 'Allergies à éviter' : 'Allergies to avoid'}</label>
                <div className={styles.allergyGrid}>
                  {[
                    { value: 'groundnuts', label: isFr ? 'Arachides 🥜' : 'Groundnuts 🥜' },
                    { value: 'crayfish', label: isFr ? 'Écrevisses 🦐' : 'Crayfish 🦐' },
                    { value: 'milk', label: isFr ? 'Lait 🥛' : 'Dairy / Milk 🥛' },
                    { value: 'wheat', label: isFr ? 'Blé 🌾' : 'Wheat 🌾' },
                    { value: 'fish', label: isFr ? 'Poisson 🐟' : 'Fish 🐟' },
                    { value: 'eggs', label: isFr ? 'Œufs 🥚' : 'Eggs 🥚' },
                    { value: 'none', label: isFr ? 'Aucune' : 'None' }
                  ].map(opt => {
                    const active = form.allergies.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.allergyBtn} ${active ? styles.allergyBtnActive : ''}`}
                        onClick={() => {
                          let updated = [...form.allergies]
                          if (opt.value === 'none') {
                            updated = active ? [] : ['none']
                          } else {
                            updated = updated.filter(a => a !== 'none')
                            if (active) {
                              updated = updated.filter(a => a !== opt.value)
                            } else {
                              updated.push(opt.value)
                            }
                          }
                          setForm({ ...form, allergies: updated })
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: AI BLUEPRINT PREVIEW & CONFIRM */}
          {step === 7 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={20} color="var(--color-primary)" />
                <h3 className={styles.stepHeading} style={{ margin: 0 }}>
                  {isFr ? 'Votre Nouveau Plan IA' : 'Your New AI Blueprint'}
                </h3>
              </div>
              <p className={styles.stepSubtitle}>
                {isFr ? 'Calibré spécialement pour votre nouvel objectif.' : 'Calibrated specifically for your refreshed fitness journey.'}
              </p>

              {loadingSummary ? (
                <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div className={styles.loaderSpinner} style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                    {isFr ? 'Génération de votre nouveau plan en cours...' : 'Calculating your new calorie targets and meal blueprint...'}
                  </span>
                </div>
              ) : (
                <div className={styles.summaryBox}>
                  <div className={styles.summaryTargetsGrid}>
                    <div className={styles.summaryTargetCard}>
                      <div className={styles.targetCardLeft}>
                        <span className={styles.targetIcon}>🔥</span>
                        <div className={styles.targetCardInfo}>
                          <span className={styles.targetLabel}>{isFr ? 'Calories cibles' : 'Calories'}</span>
                          <span className={styles.targetSub}>{isFr ? 'Dépense quotidienne calibrée' : 'Daily energy target'}</span>
                        </div>
                      </div>
                      <div className={styles.targetCardRight}>
                        <span className={styles.targetVal}>{summaryData?.calorieGoal || 2000}</span>
                        <span className={styles.targetUnit}>kcal / {isFr ? 'jour' : 'day'}</span>
                      </div>
                    </div>

                    <div className={styles.summaryTargetCard}>
                      <div className={styles.targetCardLeft}>
                        <span className={styles.targetIcon}>💧</span>
                        <div className={styles.targetCardInfo}>
                          <span className={styles.targetLabel}>{isFr ? 'Hydratation' : 'Hydration'}</span>
                          <span className={styles.targetSub}>{form.waterPreference === 'bottle' ? (isFr ? 'Bouteilles d’eau (750ml)' : 'Water bottles (750ml)') : (isFr ? 'Sachets d’eau pure (500ml)' : 'Pure water sachets (500ml)')}</span>
                        </div>
                      </div>
                      <div className={styles.targetCardRight}>
                        <span className={styles.targetVal}>{summaryData?.waterGoal || 6}</span>
                        <span className={styles.targetUnit}>{form.waterPreference === 'bottle' ? (isFr ? 'bouteilles / jour' : 'bottles / day') : (isFr ? 'sachets / jour' : 'sachets / day')}</span>
                      </div>
                    </div>

                    <div className={styles.summaryTargetCard}>
                      <div className={styles.targetCardLeft}>
                        <span className={styles.targetIcon}>👟</span>
                        <div className={styles.targetCardInfo}>
                          <span className={styles.targetLabel}>{isFr ? 'Objectif de pas' : 'Steps'}</span>
                          <span className={styles.targetSub}>{isFr ? 'Activité physique quotidienne' : 'Daily walking activity'}</span>
                        </div>
                      </div>
                      <div className={styles.targetCardRight}>
                        <span className={styles.targetVal}>{(summaryData?.stepGoal || 8000).toLocaleString()}</span>
                        <span className={styles.targetUnit}>{isFr ? 'pas / jour' : 'steps / day'}</span>
                      </div>
                    </div>
                  </div>

                  {summaryData?.summary && (
                    <p className={styles.summaryText}>
                      💡 {summaryData.summary}
                    </p>
                  )}

                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                    ℹ️ {isFr ? 'L’activation redémarrera votre compteur de progression au Jour 1.' : 'Activating this plan resets your tracking timeline to Day 1 of your new goal.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          {step > 1 && (
            <button 
              type="button" 
              className={styles.backBtnAction} 
              onClick={handleBack}
              disabled={saving}
            >
              {isFr ? 'Précédent' : 'Back'}
            </button>
          )}

          {step < totalSteps ? (
            <button 
              type="button" 
              className={styles.nextBtnAction} 
              onClick={handleNext}
            >
              <span>{isFr ? 'Continuer' : 'Next'}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              type="button" 
              className={styles.nextBtnAction} 
              onClick={handleActivateNewPlan}
              disabled={saving || loadingSummary}
              style={{ background: 'var(--color-primary)' }}
            >
              {saving ? (
                <>
                  <div className={styles.loaderSpinner} />
                  <span>{isFr ? 'Activation...' : 'Activating Plan...'}</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>{isFr ? 'Activer mon nouveau plan 🚀' : 'Activate New Plan 🚀'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
