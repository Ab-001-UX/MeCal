import React, { useState } from 'react'
import styles from './Onboarding.module.css'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { useUserStore } from '../../store/userStore'
import { getWellnessSummary } from '../../services/auth.service.js'
import { Eye, EyeOff, ChevronLeft, User, Phone, Lock } from 'lucide-react'

import { useTranslation } from 'react-i18next'
import '../../i18n'

export default function Onboarding() {
  const { t } = useTranslation()
  
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('onboardingStep')
    const savedTime = localStorage.getItem('onboardingTimestamp')
    const now = Date.now()
    
    // If it's been more than 5 minutes (5 * 60 * 1000 ms), reset everything
    if (savedTime && now - parseInt(savedTime) > 300000) {
      localStorage.removeItem('onboardingStep')
      localStorage.removeItem('onboardingData')
      localStorage.removeItem('onboardingTimestamp')
      return 1
    }
    
    return savedStep ? parseInt(savedStep) : 1
  })
  
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('onboardingData')
    const savedTime = localStorage.getItem('onboardingTimestamp')
    const now = Date.now()
    
    if (savedTime && now - parseInt(savedTime) > 300000) {
      return {
        name: '',
        phoneNumber: '',
        password: '',
        age: '',
        height: '',
        weight: '',
        goal: '',
        targetWeight: '',
        targetDuration: '',
        country: '',
        tribe: '',
        lifestyleType: '',
        budgetPreference: '',
        foodAvailability: '',
        activityLevel: '',
        waterPreference: '',
        allergies: [],
        gender: ''
      }
    }
    
    return savedData ? JSON.parse(savedData) : {
      name: '',
      phoneNumber: '',
      password: '',
      age: '',
      height: '',
      weight: '',
      goal: '',
      targetWeight: '',
      targetDuration: '',
      country: '',
      tribe: '',
      lifestyleType: '',
      budgetPreference: '',
      foodAvailability: '',
      activityLevel: '',
      waterPreference: '',
      allergies: [],
      gender: ''
    }
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [unitSystem, setUnitSystem] = useState('metric')
  const [wellnessSummary, setWellnessSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const navigate = useNavigate()
  const { setLoading, setError, error, isLoading: loading, language } = useUiStore()

  React.useEffect(() => {
    if (currentStep !== 8) return

    let cancelled = false
    const fetchSummary = async () => {
      setSummaryLoading(true)
      setError('')
      try {
        const response = await getWellnessSummary({
          ...formData,
          age: formData.age ? parseInt(formData.age, 10) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
          unitPreference: unitSystem,
        }, language)
        if (!cancelled && response.data.success) {
          setWellnessSummary(response.data.data)
        }
      } catch (err) {
        console.error('Wellness summary failed:', err)
        if (!cancelled) setError(t('onboarding.generatingSummary'))
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }

    fetchSummary()
    return () => { cancelled = true }
  }, [currentStep, language])


  // Save progress and timestamp to localStorage
  React.useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep.toString())
    localStorage.setItem('onboardingData', JSON.stringify(formData))
    localStorage.setItem('onboardingTimestamp', Date.now().toString())
  }, [currentStep, formData])
  // Clear any stale errors when the page first loads
  React.useEffect(() => {
    setError('')
    setLoading(false)
  }, [])


  const getTribesForCountry = () => {
    const tribesMap = {
      Nigeria: ['Yoruba', 'Igbo', 'Hausa', 'Fulani', 'Tiv', 'Ijaw', 'Kanuri', 'Urhobo'],
      Ghana: ['Akan', 'Ewe', 'Ga', 'Dagomba', 'Guan'],
      Senegal: ['Wolof', 'Pulaar', 'Serer', 'Jola', 'Mandinka'],
      'Sierra Leone': ['Temne', 'Mende', 'Limba', 'Kono'],
      Mali: ['Bambara', 'Mandinka', 'Fula', 'Songhai'],
      'Burkina Faso': ['Mossi', 'Fulani', 'Gourmantche', 'Bobo'],
      Guinea: ['Fula', 'Mandinka', 'Susu'],
    }
    const country = formData.country
    return tribesMap[country] || [
      'Yoruba', 'Igbo', 'Hausa', 'Fulani', 'Akan', 'Wolof', 'Ewe', 'Ga', 'Mandinka', 'Mende', 'Temne', 'Bambara'
    ]
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    if (id === 'country') {
      setFormData(prev => ({ ...prev, country: value, tribe: '' }))
    } else {
      setFormData(prev => ({ ...prev, [id]: value }))
    }
    setError('') // Clear error on type
  }

  const handlePillSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.phoneNumber || !formData.password) {
        setError(language === 'fr' 
          ? 'Veuillez remplir tous les champs pour créer votre compte.'
          : 'Please fill in all fields to create your account.')
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await axios.post('/api/auth/check-phone', {
          phoneNumber: formData.phoneNumber
        }, {
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.data.success && response.data.exists) {
          const alertMsg = language === 'fr'
            ? "Ce compte existe déjà. Veuillez vous connecter."
            : "This account already exists. Please log in.";
          setError(alertMsg);
          
          setTimeout(() => {
            setLoading(false)
            navigate('/login', { 
              state: { 
                phoneNumber: formData.phoneNumber, 
                accountExists: true 
              } 
            })
          }, 3000)
          return
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Phone check failed:', err)
        const errMsg = err.response?.data?.message || err.message || 'Failed to verify phone number.'
        setError(errMsg)
        setLoading(false)
        return
      }
    }

    if (currentStep === 2) {
      if (!formData.gender || !formData.age || !formData.weight || !formData.height) {
        setError(language === 'fr'
          ? 'Veuillez remplir tous les champs (genre, âge, poids, taille).'
          : 'Please fill in all fields (gender, age, weight, height).')
        return
      }
      setError('')
    }

    if (currentStep === 3) {
      if (!formData.goal || !formData.targetDuration) {
        setError(language === 'fr'
          ? 'Veuillez sélectionner un objectif et une durée.'
          : 'Please select a goal and target duration.')
        return
      }
      if (formData.goal === 'lose' || formData.goal === 'gain') {
        if (!formData.targetWeight) {
          setError(language === 'fr'
            ? 'Veuillez sélectionner un poids cible.'
            : 'Please select a target weight.')
          return
        }
        const currentW = parseFloat(formData.weight)
        const targetW = parseFloat(formData.targetWeight)
        
        if (formData.goal === 'lose' && targetW >= currentW) {
          setError(language === 'fr'
            ? 'Le poids cible doit être inférieur au poids actuel.'
            : 'Target weight must be less than current weight.')
          return
        }
        if (formData.goal === 'gain' && targetW <= currentW) {
          setError(language === 'fr'
            ? 'Le poids cible doit être supérieur au poids actuel.'
            : 'Target weight must be greater than current weight.')
          return
        }
      }
      setError('')
    }
    
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSkip = () => {
    if (currentStep < 8) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit(new Event('submit'))
    }
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    setError('')
    
    const dataToSend = {
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
      unitPreference: unitSystem,
      calorieGoal: wellnessSummary?.calorieGoal ?? null,
      waterGoal: wellnessSummary?.waterGoal ?? null,
      stepGoal: wellnessSummary?.stepGoal ?? null,
    }
    
    try {
      const response = await axios.post('/api/auth/onboard', dataToSend, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
      
      if (response.data.success) {
        useUserStore.getState().setUser(response.data.data)
        localStorage.setItem('hasAccount', 'true')
        localStorage.removeItem('onboardingStep')
        localStorage.removeItem('onboardingData')
        localStorage.removeItem('onboardingTimestamp')
        navigate('/home', { state: { showWelcomeModal: true } })
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const serverError = err.response?.data?.message
      const generalError = err.message
      const errorMessage = serverError || generalError || 'Failed to complete onboarding'
      
      const isPhoneError = errorMessage.toLowerCase().includes('phone') || 
                           errorMessage.toLowerCase().includes('already in use') ||
                           err.response?.status === 400;

      if (isPhoneError) {
        const alertMsg = language === 'fr'
          ? "Ce compte existe déjà. Veuillez vous connecter."
          : "This account already exists. Please log in.";
        setError(alertMsg);
        
        setTimeout(() => {
          setLoading(false)
          navigate('/login', { 
            state: { 
              phoneNumber: formData.phoneNumber, 
              accountExists: true 
            } 
          })
        }, 3000)
      } else {
        setError(errorMessage)
        setLoading(false)
      }
    }
  }

  const getStepHeader = () => {
    switch (currentStep) {
      case 1:
        return { title: "", subtitle: t('onboarding.joinMeCal') }
      case 2:
        return { title: t('onboarding.step3Title'), subtitle: t('onboarding.step3Sub') }
      case 3:
        return { title: t('onboarding.step4Title'), subtitle: t('onboarding.step4Sub') }
      case 4:
        return { title: t('onboarding.step5Title'), subtitle: t('onboarding.step5Sub') }
      case 5:
        return { title: t('onboarding.step6Title'), subtitle: t('onboarding.step6Sub') }
      case 6:
        return { title: t('onboarding.step7Title'), subtitle: t('onboarding.step7Sub') }
      case 7:
        return { title: t('onboarding.step8Title'), subtitle: t('onboarding.step8Sub') }
      case 8:
        return { title: t('onboarding.step9Title'), subtitle: t('onboarding.step9Sub') }
      default:
        return { title: "Welcome", subtitle: "" }
    }
  }

  const headerInfo = getStepHeader()

  return (
    <div className={styles.container}>
      {/* SVG Wave ClipPath */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="waveClip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.8 C 0.7,0.6 0.3,1 0,0.85 Z" />
          </clipPath>
        </defs>
      </svg>
      {/* Top Image for Step 1 */}
      {currentStep === 1 && (
        <div className={styles.imageHeader}>
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className={styles.floatingBackButton}
            aria-label="Back to welcome screen"
          >
            <ChevronLeft size={24} />
          </button>
          <div className={styles.imageWrapper}>
            <img src="/Images/keep fit.jpg" alt="Keep Fit" className={styles.headerImg} />
            <div className={styles.waveOverlay}></div>
          </div>
        </div>
      )}

      {/* Top Navigation - Progress Bar and Back Button */}
      {currentStep > 1 && (
        <div className={styles.topNav}>
          {/* Row 1: Back Button (Allowed on all steps) */}
          <button type="button" onClick={prevStep} className={styles.backButton}>
            <ChevronLeft size={24} />
          </button>
          
          {/* Row 2: Segmented Progress Bar (Full Width) */}
          <div className={styles.progressWrapper}>
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={`${styles.progressSegment} ${i < currentStep - 1 ? styles.segmentActive : ''}`} 
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={currentStep === 1 ? styles.step1HeadingGroup : styles.headingGroup}>
          {headerInfo.title && <h1 className={`${styles.mainHeading} ${currentStep === 1 ? styles.step1Title : ''}`}>{headerInfo.title}</h1>}
          <p className={styles.mainSubtitle}>{headerInfo.subtitle}</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={currentStep === 8 ? handleSubmit : (e) => e.preventDefault()} className={styles.form}>
          
          {/* Step 1: Create Account (New Visual Layout) */}
          {currentStep === 1 && (
            <>
              <div className={styles.inputWithIcon}>
                <User size={20} className={styles.inputIcon} />
                <input type="text" id="name" value={formData.name} onChange={handleInputChange} placeholder={t('onboarding.fullName')} className={styles.premiumInput} required />
              </div>
              
              <div className={styles.inputWithIcon}>
                <Phone size={20} className={styles.inputIcon} />
                <input type="tel" id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder={t('onboarding.phoneNumber')} className={styles.premiumInput} required inputMode="tel" autoComplete="tel" />
              </div>
              
              <div className={styles.inputWithIcon}>
                <Lock size={20} className={styles.inputIcon} />
                <input type={showPassword ? "text" : "password"} id="password" value={formData.password} onChange={handleInputChange} placeholder={t('onboarding.password')} className={styles.premiumInput} required />
                <button type="button" className={styles.premiumEyeButton} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              
              <div className={styles.buttonAndFooter} style={{ marginTop: 'var(--space-3)' }}>
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className={`${styles.step1Button} ${loading ? 'btn-loading' : ''}`}
                  disabled={loading}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{t('onboarding.createAccount')}</span>
                    {loading && <div className="mini-spinner"></div>}
                  </div>
                </button>
                
                <p className={styles.footer}>
                  {t('onboarding.alreadyHaveAccount')} <Link to="/login" className={styles.link}>{t('onboarding.logIn')}</Link>
                </p>
              </div>
            </>
          )}
          {/* Step 2: Gender */}
          {currentStep === 2 && (
            <>
              {/* Unit Toggle */}
              <div className={styles.topUnitToggle} style={{ marginTop: '0', marginBottom: 'var(--space-4)' }}>
                <div className={`${styles.toggleIndicator} ${unitSystem === 'imperial' ? styles.slideRight : ''}`} />
                <button 
                  type="button" 
                  className={`${styles.toggleBtn} ${unitSystem === 'metric' ? styles.toggleBtnActive : ''}`}
                  onClick={() => { setUnitSystem('metric'); setFormData(prev => ({ ...prev, height: '', weight: '' })); }}
                >
                  cm/kg
                </button>
                <button 
                  type="button" 
                  className={`${styles.toggleBtn} ${unitSystem === 'imperial' ? styles.toggleBtnActive : ''}`}
                  onClick={() => { setUnitSystem('imperial'); setFormData(prev => ({ ...prev, height: '', weight: '' })); }}
                >
                  ft/lbs
                </button>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="gender" className={styles.sectionLabelSmall}>{t('onboarding.gender')}</label>
                <select id="gender" value={formData.gender} onChange={handleInputChange} className={`${styles.wheelInput} ${!formData.gender ? styles.placeholderColor : ''}`}>
                  <option value="">{t('onboarding.selectGender')}</option>
                  <option value="Male">{t('onboarding.male')}</option>
                  <option value="Female">{t('onboarding.female')}</option>
                  <option value="Other">{t('onboarding.other')}</option>
                </select>
              </div>
              
              <div className={styles.formGroup} style={{ marginTop: 'var(--space-2)' }}>
                <label htmlFor="age" className={styles.sectionLabelSmall}>{t('onboarding.age')}</label>
                <input type="number" id="age" value={formData.age} onChange={handleInputChange} placeholder="e.g. 25" className={styles.wheelInput} />
              </div>
              
              <div className={styles.sideBySide} style={{ marginTop: 'var(--space-2)' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="weight" className={styles.sectionLabelSmall}>{t('onboarding.weight')}</label>
                  <select id="weight" value={formData.weight} onChange={handleInputChange} className={`${styles.wheelInput} ${!formData.weight ? styles.placeholderColor : ''}`}>
                    <option value="">{unitSystem === 'metric' ? "e.g. 60kg" : "e.g. 132lbs"}</option>
                    {unitSystem === 'metric' ? (
                      [...Array(171)].map((_, i) => (
                        <option key={30 + i} value={30 + i}>{30 + i} kg</option>
                      ))
                    ) : (
                      [...Array(341)].map((_, i) => (
                        <option key={60 + i} value={60 + i}>{60 + i} lbs</option>
                      ))
                    )}
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="height" className={styles.sectionLabelSmall}>{t('onboarding.height')}</label>
                  <select id="height" value={formData.height} onChange={handleInputChange} className={`${styles.wheelInput} ${!formData.height ? styles.placeholderColor : ''}`}>
                    <option value="">{unitSystem === 'metric' ? "e.g. 172cm" : "e.g. 5 ft 8 in"}</option>
                    {unitSystem === 'metric' ? (
                      [...Array(151)].map((_, i) => (
                        <option key={100 + i} value={100 + i}>{100 + i} cm</option>
                      ))
                    ) : (
                      (() => {
                        const opts = [];
                        for (let f = 4; f <= 7; f++) {
                          for (let inch = 0; inch <= 11; inch++) {
                            const val = parseFloat((f + inch / 12).toFixed(3));
                            opts.push(
                              <option key={val} value={val}>
                                {f} ft {inch} in
                              </option>
                            );
                          }
                        }
                        opts.push(
                          <option key={8.0} value={8.0}>
                            8 ft 0 in
                          </option>
                        );
                        return opts;
                      })()
                    )}
                  </select>
                </div>
              </div>
              
              <div className={styles.bottomNav}>
                <button type="button" onClick={nextStep} className={styles.continueButton}>{t('onboarding.continue')}</button>
              </div>
            </>
          )}

          {/* Step 3: Goals */}
          {currentStep === 3 && (
            <>
              <div className={styles.pillsGroup}>
                {[
                  { value: 'lose', label: t('onboarding.loseWeight') },
                  { value: 'gain', label: t('onboarding.gainWeight') },
                  { value: 'maintain', label: t('onboarding.maintain') }
                ].map(opt => (
                  <button 
                    key={opt.value}
                    type="button"
                    className={`${styles.pill} ${formData.goal === opt.value ? styles.pillActive : ''}`}
                    onClick={() => handlePillSelect('goal', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              <div className={styles.formGroup} style={{ marginTop: 'var(--space-4)' }}>
                <label htmlFor="targetDuration">{t('onboarding.targetDuration')}</label>
                <select id="targetDuration" value={formData.targetDuration} onChange={handleInputChange} className={`${styles.wheelInput} ${!formData.targetDuration ? styles.placeholderColor : ''}`}>
                  <option value="">{t('onboarding.selectDuration')}</option>
                  <option value="3 months">{t('onboarding.threeMonths')}</option>
                  <option value="6 months">{t('onboarding.sixMonths')}</option>
                  <option value="1 year">{t('onboarding.oneYear')}</option>
                  <option value="Custom">{t('onboarding.custom')}</option>
                </select>
                
                {formData.targetDuration === 'Custom' && (
                  <input 
                    type="text" 
                    id="targetDuration" 
                    value={formData.customTargetDuration || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, customTargetDuration: e.target.value }))} 
                    placeholder={t('onboarding.enterCustomDuration')} 
                    className={styles.wheelInput} 
                    style={{ marginTop: 'var(--space-2)' }} 
                  />
                )}
              </div>

              {(formData.goal === 'lose' || formData.goal === 'gain') && (
                <div className={styles.formGroup} style={{ marginTop: 'var(--space-4)' }}>
                  <label htmlFor="targetWeight">{t('onboarding.targetWeight')}</label>
                  <select 
                    id="targetWeight" 
                    value={formData.targetWeight || ''} 
                    onChange={handleInputChange} 
                    className={`${styles.wheelInput} ${!formData.targetWeight ? styles.placeholderColor : ''}`}
                  >
                    <option value="">{unitSystem === 'metric' ? "Select target weight (kg)" : "Select target weight (lbs)"}</option>
                    {unitSystem === 'metric' ? (
                      [...Array(171)].map((_, i) => (
                        <option key={30 + i} value={30 + i}>{30 + i} kg</option>
                      ))
                    ) : (
                      [...Array(341)].map((_, i) => (
                        <option key={60 + i} value={60 + i}>{60 + i} lbs</option>
                      ))
                    )}
                  </select>
                </div>
              )}
              
              <div className={styles.bottomNav}>
                <button type="button" onClick={nextStep} className={styles.continueButton}>{t('onboarding.continue')}</button>
              </div>
            </>
          )}

          {/* Step 4: Background */}
          {currentStep === 4 && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="country">{t('onboarding.country')}</label>
                <select id="country" value={formData.country} onChange={handleInputChange} className={`${styles.wheelInput} ${!formData.country ? styles.placeholderColor : ''}`}>
                  <option value="">{t('onboarding.selectCountry')}</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Ivory Coast">Ivory Coast</option>
                  <option value="Gambia">Gambia</option>
                  <option value="Sierra Leone">Sierra Leone</option>
                  <option value="Liberia">Liberia</option>
                  <option value="Mali">Mali</option>
                  <option value="Niger">Niger</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Benin">Benin</option>
                  <option value="Togo">Togo</option>
                  <option value="Guinea">Guinea</option>
                  <option value="Mauritania">Mauritania</option>
                  <option value="Cape Verde">Cape Verde</option>
                  <option value="Guinea-Bissau">Guinea-Bissau</option>
                </select>
              </div>
              <div className={styles.formGroup} style={{ marginTop: 'var(--space-4)' }}>
                <label htmlFor="tribe">{t('onboarding.tribe')}</label>
                <select id="tribe" value={formData.tribe} onChange={handleInputChange} className={`${styles.wheelInput} ${!formData.tribe ? styles.placeholderColor : ''}`}>
                  <option value="">{t('onboarding.selectTribe')}</option>
                  {getTribesForCountry().map((tName) => (
                    <option key={tName} value={tName}>{tName}</option>
                  ))}
                  <option value="Other">{t('onboarding.other')}</option>
                </select>
              </div>
              <div className={styles.bottomNav}>
                <button type="button" onClick={nextStep} className={styles.continueButton}>{t('onboarding.continue')}</button>
              </div>
            </>
          )}

          {/* Step 5: Lifestyle */}
          {currentStep === 5 && (
            <>
              <div className={styles.sectionLabel}>{t('onboarding.lifestyle')}</div>
              <div className={styles.pillsGroup}>
                {[
                  { value: 'student', label: t('onboarding.student') },
                  { value: 'professional', label: t('onboarding.professional') },
                  { value: 'mixed', label: t('onboarding.mixed') }
                ].map(opt => (
                  <button 
                    key={opt.value}
                    type="button"
                    className={`${styles.pill} ${formData.lifestyleType === opt.value ? styles.pillActive : ''}`}
                    onClick={() => handlePillSelect('lifestyleType', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className={styles.sectionLabel} style={{ marginTop: 'var(--space-4)' }}>{t('onboarding.budget')}</div>
              <div className={styles.pillsGroup}>
                {[
                  { value: 'low', label: t('onboarding.low') },
                  { value: 'moderate', label: t('onboarding.moderate') },
                  { value: 'flexible', label: t('onboarding.flexible') }
                ].map(opt => (
                  <button 
                    key={opt.value}
                    type="button"
                    className={`${styles.pill} ${formData.budgetPreference === opt.value ? styles.pillActive : ''}`}
                    onClick={() => handlePillSelect('budgetPreference', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className={styles.bottomNav}>
                <button type="button" onClick={nextStep} className={styles.continueButton}>{t('onboarding.continue')}</button>
              </div>
            </>
          )}

          {/* Step 6: Activity & Water */}
          {currentStep === 6 && (
            <>
              <div className={styles.sectionLabel}>{t('onboarding.activityLevel')}</div>
              <div className={styles.pillsGroup}>
                {[
                  { value: 'low', label: t('onboarding.lowSedentary') },
                  { value: 'moderate', label: t('onboarding.moderateActivity') },
                  { value: 'active', label: t('onboarding.active') }
                ].map(opt => (
                  <button 
                    key={opt.value}
                    type="button"
                    className={`${styles.pill} ${formData.activityLevel === opt.value ? styles.pillActive : ''}`}
                    onClick={() => handlePillSelect('activityLevel', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className={styles.sectionLabel} style={{ marginTop: 'var(--space-4)' }}>{t('onboarding.waterPreference')}</div>
              <div className={styles.squaresGroup}>
                <button 
                  type="button" 
                  className={`${styles.squarePill} ${formData.waterPreference === 'sachet' ? styles.squarePillActive : ''}`}
                  onClick={() => handlePillSelect('waterPreference', 'sachet')}
                >
                  <span style={{ fontSize: '2rem', marginBottom: '8px' }}>💧</span>
                  <span>{t('onboarding.sachet')}</span>
                </button>
                <button 
                  type="button" 
                  className={`${styles.squarePill} ${formData.waterPreference === 'bottle' ? styles.squarePillActive : ''}`}
                  onClick={() => handlePillSelect('waterPreference', 'bottle')}
                >
                  <div className="streamline-ultimate-color:water-bottle-glass" style={{ position: 'relative', width: '40px', height: '40px', marginBottom: '8px' }}>
                    {/* Vector 1 (Cap) */}
                    <div style={{ position: 'absolute', left: '36.07%', right: '36.04%', top: '4.17%', bottom: '83.88%', background: '#E3E3E3', border: '1px solid #191919' }}></div>
                    {/* Vector 2 (Body Top) */}
                    <div style={{ position: 'absolute', left: '28.09%', right: '28.07%', top: '16.12%', bottom: '4.18%', background: '#C2F3FF' }}></div>
                    {/* Vector 3 (Body Bottom) */}
                    <div style={{ position: 'absolute', left: '28.09%', right: '28.07%', top: '59.77%', bottom: '4.17%', background: '#66E1FF' }}></div>
                    {/* Vector 4 (Border) */}
                    <div style={{ position: 'absolute', left: '28.09%', right: '28.07%', top: '16.12%', bottom: '4.18%', border: '1px solid #191919' }}></div>
                  </div>
                  <span>{t('onboarding.bottle')}</span>
                </button>
              </div>
              
              <div className={styles.checkboxWrapper}>
                <input 
                  type="checkbox" 
                  id="selectBothWater" 
                  checked={formData.waterPreference === 'both'} 
                  onChange={(e) => handlePillSelect('waterPreference', e.target.checked ? 'both' : '')}
                />
                <label htmlFor="selectBothWater" className={styles.checkboxLabel}>
                  {t('onboarding.bothWater')}
                </label>
              </div>
              
              <p className={styles.explanationText}>
                {t('onboarding.waterExpl')}
              </p>

              <div className={styles.bottomNav}>
                <button type="button" onClick={nextStep} className={styles.continueButton}>{t('onboarding.continue')}</button>
              </div>
            </>
          )}

          {/* Step 7: Allergies */}
          {currentStep === 7 && (
            <>
              <div className={styles.allergyGrid}>
                {[
                  { value: 'groundnuts', label: t('onboarding.groundnuts'), emoji: '🥜' },
                  { value: 'crayfish', label: t('onboarding.crayfish'), emoji: '🦐' },
                  { value: 'milk', label: t('onboarding.milk'), emoji: '🥛' },
                  { value: 'wheat', label: t('onboarding.wheat'), emoji: '🌾' },
                  { value: 'fish', label: t('onboarding.fish'), emoji: '🐟' },
                  { value: 'eggs', label: t('onboarding.eggs'), emoji: '🥚' }
                ].map(opt => (
                  <button 
                    key={opt.value}
                    type="button"
                    className={`${styles.allergyCard} ${formData.allergies.includes(opt.value) ? styles.allergyCardActive : ''}`}
                    onClick={() => {
                      const current = formData.allergies
                      const withoutNone = current.filter(item => item !== 'none')
                      const updated = withoutNone.includes(opt.value)
                        ? withoutNone.filter(item => item !== opt.value)
                        : [...withoutNone, opt.value]
                      handlePillSelect('allergies', updated)
                    }}
                  >
                    <div className={styles.allergyImagePlaceholder}>
                      <span style={{ fontSize: '2.5rem' }}>{opt.emoji}</span>
                    </div>
                    <span className={styles.allergyLabel}>{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.formGroup} style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <label htmlFor="otherAllergies" className={styles.sectionLabel}>{t('onboarding.otherAllergies')}</label>
                <input 
                  type="text" 
                  id="otherAllergies" 
                  value={formData.otherAllergies || ''} 
                  onChange={handleInputChange} 
                  placeholder={t('onboarding.otherAllergies')} 
                  className={styles.wheelInput} 
                />
              </div>

              <div className={styles.toggleWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <span className={styles.toggleLabel} style={{ fontSize: 'var(--font-size-md)', color: '#121212' }}>{t('onboarding.noAllergies')}</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={formData.allergies.includes('none')} 
                    onChange={(e) => {
                      const checked = e.target.checked
                      handlePillSelect('allergies', checked ? ['none'] : [])
                    }}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <p className={styles.explanationText} style={{ fontSize: 'var(--font-size-sm)', color: '#757575', marginBottom: 'var(--space-4)' }}>
                {t('onboarding.allergyExpl')}
              </p>

              <div className={styles.bottomNav}>
                <button type="button" onClick={nextStep} className={styles.continueButton}>{t('onboarding.continue')}</button>
              </div>
            </>
          )}

          {/* Step 8: AI Wellness Summary */}
          {currentStep === 8 && (
            <>
              {summaryLoading && (
                <p className={styles.explanationText}>{t('onboarding.generatingSummary')}</p>
              )}
              {wellnessSummary && (
                <div className={styles.wellnessSummary}>
                  <p className={styles.wellnessText}>{wellnessSummary.summary}</p>
                  <div className={styles.wellnessStats}>
                    <div><strong>{t('onboarding.calorieTarget')}</strong><span>{wellnessSummary.calorieGoal} kcal</span></div>
                    <div><strong>{t('onboarding.waterTarget')}</strong><span>{wellnessSummary.waterGoal}</span></div>
                    <div><strong>{t('onboarding.stepTarget')}</strong><span>{wellnessSummary.stepGoal}</span></div>
                  </div>
                  <p className={styles.sectionLabel}>{t('onboarding.yourTips')}</p>
                  <ul className={styles.tipsList}>
                    {wellnessSummary.tips?.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.bottomNav}>
                <button 
                  type="submit" 
                  className={`${styles.continueButton} ${loading ? 'btn-loading' : ''}`} 
                  disabled={loading || summaryLoading}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{loading ? t('onboarding.submitting') : t('onboarding.goToDashboard')}</span>
                    {loading && <div className="mini-spinner"></div>}
                  </div>
                </button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  )
}
