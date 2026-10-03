import React, { useState, useEffect } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useUserStore } from '../../store/userStore'
import styles from './Scan.module.css'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { queueOrExecute } from '../../utils/syncQueue.js'
import { getSavedMeals, saveMealToLibrary, removeSavedMeal } from '../../services/meal.service.js'
import '../../i18n'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Heart, X, BookOpen, Utensils, ArrowLeft } from 'lucide-react'

const i18n = {
  en: {
    nutrition: "Nutrition Breakdown",
    manual: "Manual Log",
    library: "Saved Foods",
    fetching: "Calculating nutritional report",
    logMeal: "Log Your Meal",
    manualInput: "Manual Meal Entry",
    whatDidYouEat: "What did you eat?",
    portion: "Portion",
    calculateLog: "Calculate Calories & Log",
    plate: "Plate(s)",
    bowl: "Bowl(s)",
    wrap: "Wrap(s)",
    piece: "Piece(s)",
    spoon: "Spoon(s)",
    gram: "Gram(s)",
    foodName: "Jollof Rice with Chicken",
    description: "1 Plate of Nigerian Jollof Rice with a piece of fried chicken.",
    calories: "Calories",
    carbs: "Carbs",
    protein: "Protein",
    fats: "Fats",
    fixResults: "Edit Values",
    save: "Confirm & Save Log",
    cancel: "Cancel",
    saveEdits: "Save Changes",
    editInstruction: "Edit the food name, calories and macros below:"
  },
  fr: {
    nutrition: "Détails Nutritionnels",
    manual: "Saisie Manuelle",
    library: "Plats Enregistrés",
    fetching: "Calcul du rapport nutritionnel",
    logMeal: "Enregistrer Votre Repas",
    manualInput: "Saisie Manuelle de Repas",
    whatDidYouEat: "Qu'avez-vous mangé ?",
    portion: "Portion",
    calculateLog: "Calculer les Calories & Enregistrer",
    plate: "Assiette(s)",
    bowl: "Bol(s)",
    wrap: "Emballage(s)",
    piece: "Morceau(x)",
    spoon: "Cuillère(s)",
    gram: "Gramme(s)",
    foodName: "Riz Jollof avec Poulet",
    description: "1 assiette de riz Jollof nigérian avec un morceau de poulet frit.",
    calories: "Calories",
    carbs: "Glucides",
    protein: "Protéines",
    fats: "Lipides",
    fixResults: "Modifier",
    save: "Confirmer & Enregistrer",
    cancel: "Annuler",
    saveEdits: "Enregistrer les modifications",
    editInstruction: "Modifiez le nom de l'aliment, les calories et les macros ci-dessous :"
  }
}

const CULTURAL_METADATA = {
  en: {
    categories: [
      { value: 'other', label: 'Other Foods & Snacks' },
      { value: 'swallow', label: 'Swallow (e.g., Eba, Amala, Pounded Yam, Fufu)' },
      { value: 'rice', label: 'Rice & Grains (e.g., Jollof, Fried Rice, Waakye)' },
      { value: 'soups', label: 'Soups & Stews (e.g., Egusi, Okra, Ewedu)' },
      { value: 'tubers', label: 'Tubers & Plantain (e.g., Dodo, Yam, Boli)' }
    ],
    units: ['Plate(s)', 'Bowl(s)', 'Wrap(s)', 'Piece(s)', 'Spoon(s)', 'Catering Spoon(s)', 'DeRica(s)', 'Mudu(s)', 'Gram(s)'],
    proteins: ['Beef', 'Chicken', 'Goat Meat', 'Ponmo / Shaki / Assorted', 'Fried Fish', 'Smoked Fish', 'Egg'],
    soupLabel: 'What soup or stew did you eat it with?',
    soupPlaceholder: 'e.g., Egusi, Okra, Ewedu, Pepper Soup',
    proteinLabel: 'What protein did you add?',
    oilLabel: 'How oily was the soup/stew?',
    oilOptions: ['Light Oil', 'Normal Oil', 'Floating / Heavy Oil']
  },
  fr: {
    categories: [
      { value: 'other', label: 'Autres aliments & snacks' },
      { value: 'swallow', label: 'Pâtes / Boules (e.g., Foutou, Plakali, Kabato, Eba)' },
      { value: 'rice', label: 'Riz & Céréales (e.g., Riz Gras, Thiéboudienne, Garba)' },
      { value: 'soups', label: 'Sauces (e.g., Sauce Graine, Sauce Arachide, Kopè)' },
      { value: 'tubers', label: 'Tubercules & Bananes (e.g., Alloco, Igname, Boli)' }
    ],
    units: ['Assiette(s)', 'Bol(s)', 'Morceau(x)', 'Cuillère(s)', 'Louche(s)', 'Poignée(s)', 'Gramme(s)'],
    proteins: ['Poisson frit (Fried fish)', 'Poisson fumé (Smoked fish)', 'Poulet bicyclette', 'Viande de bœuf', 'Viande de brousse', 'Œuf'],
    soupLabel: 'Avec quelle sauce l\'avez-vous mangé ?',
    soupPlaceholder: 'e.g., Sauce Graine, Sauce Arachide, Sauce Kopè',
    proteinLabel: 'Quelle protéine avez-vous ajouté ?',
    oilLabel: 'Quelle était la quantité d\'huile dans la sauce ?',
    oilOptions: ['Légère', 'Normale', 'Trés Huileuse / Lourde']
  }
}

const CATEGORY_UNITS = {
  en: {
    swallow: ['Wrap(s)', 'Mound(s)', 'Gram(s)'],
    rice: ['Plate(s)', 'Catering Spoon(s)', 'Spoon(s)', 'DeRica(s)', 'Gram(s)'],
    soups: ['Bowl(s)', 'Scoop(s)', 'Spoon(s)', 'Gram(s)'],
    tubers: ['Piece(s)', 'Plate(s)', 'Gram(s)'],
    other: ['Plate(s)', 'Piece(s)', 'Bowl(s)', 'Spoon(s)', 'Gram(s)', 'Bottle(s)', 'Can(s)', 'Cup(s)']
  },
  fr: {
    swallow: ['Boule(s)', 'Emballage(s)', 'Gramme(s)'],
    rice: ['Assiette(s)', 'Louche(s)', 'Cuillère(s)', 'Gramme(s)'],
    soups: ['Bol(s)', 'Louche(s)', 'Cuillère(s)', 'Gramme(s)'],
    tubers: ['Morceau(x)', 'Assiette(s)', 'Gramme(s)'],
    other: ['Assiette(s)', 'Morceau(x)', 'Bol(s)', 'Cuillère(s)', 'Gramme(s)', 'Bouteille(s)', 'Canette(s)', 'Tasse(s)']
  }
}

const TUBER_PREPARATIONS = {
  en: ['Fried', 'Boiled', 'Roasted', 'Pounded', 'Mashed'],
  fr: ['Frit', 'Bouilli', 'Grillé / Rôti', 'Pilé', 'En purée']
}

export default function Scan() {
  const { t } = useTranslation()
  const { language, error, setError, clearError } = useUiStore()
  const { user } = useUserStore()
  const navigate = useNavigate()
  
  const isFrancophoneCountry = ['côte d\'ivoire', 'cote d\'ivoire', 'ivory coast', 'senegal', 'sénégal', 'benin', 'bénin', 'togo', 'cameroon', 'cameroun', 'guinea', 'guinée', 'mali', 'niger', 'burkina faso'].includes(user?.country?.toLowerCase() || '')
  const currentCulture = (language === 'fr' || isFrancophoneCountry) ? 'fr' : 'en'

  const [activeTab, setActiveTab] = useState('manual')
  const [showResults, setShowResults] = useState(false)
  const [mealResult, setMealResult] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [savedMeals, setSavedMeals] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [animateCircles, setAnimateCircles] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [loadingActionText, setLoadingActionText] = useState('')

  // Inline edit states for fixing meal calculation results
  const [isEditingResults, setIsEditingResults] = useState(false)
  const [editedFoodName, setEditedFoodName] = useState('')
  const [editedCalories, setEditedCalories] = useState(0)
  const [editedCarbs, setEditedCarbs] = useState(0)
  const [editedProtein, setEditedProtein] = useState(0)
  const [editedFat, setEditedFat] = useState(0)

  // Manual entry states
  const [manualFoodName, setManualFoodName] = useState('')
  const [manualPortion, setManualPortion] = useState(1)
  const [manualPortionUnit, setManualPortionUnit] = useState(currentCulture === 'fr' ? 'Assiette(s)' : 'Plate(s)')
  const [manualCategory, setManualCategory] = useState('')
  const [manualSoup, setManualSoup] = useState('')
  const [selectedProteins, setSelectedProteins] = useState([])
  const [oilLevel, setOilLevel] = useState(currentCulture === 'fr' ? 'Normale' : 'Normal Oil')
  const [isCompositeDish, setIsCompositeDish] = useState(false)
  const [tuberPrep, setTuberPrep] = useState(currentCulture === 'fr' ? 'Frit' : 'Fried')
  const [manualAdditional, setManualAdditional] = useState('')
  const [manualMealType, setManualMealType] = useState('breakfast')
  const [resultMealType, setResultMealType] = useState('breakfast')

  useEffect(() => {
    if (mealResult) {
      setEditedFoodName(mealResult.foodName || '')
      setEditedCalories(mealResult.calories || 0)
      setEditedCarbs(mealResult.carbs || 0)
      setEditedProtein(mealResult.protein || 0)
      setEditedFat(mealResult.fat || 0)
    }
  }, [mealResult])

  useEffect(() => {
    const culture = currentCulture === 'fr' ? 'fr' : 'en'
    const allowedUnits = CATEGORY_UNITS[culture][manualCategory] || CATEGORY_UNITS[culture]['other']
    setManualPortionUnit(allowedUnits[0])
    setOilLevel(currentCulture === 'fr' ? 'Normale' : 'Normal Oil')
    setTuberPrep(currentCulture === 'fr' ? 'Frit' : 'Fried')
  }, [manualCategory, currentCulture])

  useEffect(() => {
    getSavedMeals()
      .then((res) => {
        if (res.data.success) setSavedMeals(res.data.data || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!mealResult?.foodName) return
    const match = savedMeals.some(
      (m) => m.name?.toLowerCase() === mealResult.foodName?.toLowerCase()
    )
    setIsFavorite(match)
  }, [mealResult?.foodName, savedMeals])

  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => setAnimateCircles(true), 300)
      return () => clearTimeout(timer)
    } else {
      setAnimateCircles(false)
    }
  }, [showResults])

  useEffect(() => {
    if (clearError) clearError()
  }, [activeTab])

  const handleFavorite = async () => {
    if (!mealResult?.foodName) return
    try {
      if (isFavorite) {
        const existing = savedMeals.find(
          (m) => m.name?.toLowerCase() === mealResult.foodName?.toLowerCase()
        )
        if (existing) await removeSavedMeal(existing.id)
        setSavedMeals((prev) => prev.filter((m) => m.id !== existing?.id))
        setIsFavorite(false)
        setToastMessage(currentCulture === 'fr' ? 'Plat retiré des favoris' : 'Meal removed from saved foods')
      } else {
        const res = await saveMealToLibrary({
          name: mealResult.foodName,
          calories: mealResult.calories,
          protein: mealResult.protein,
          carbs: mealResult.carbs,
          fat: mealResult.fat,
          imageUrl: mealResult.imageUrl
        })
        if (res.data.success) {
          setSavedMeals((prev) => [...prev, res.data.data])
          setIsFavorite(true)
          setToastMessage(currentCulture === 'fr' ? 'Plat sauvegardé dans votre bibliothèque' : 'Meal saved to your library')
        }
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch {
      setToastMessage(currentCulture === 'fr' ? 'Impossible de mettre à jour les favoris' : 'Could not update saved foods')
      setShowToast(true)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualCategory) {
      setError(currentCulture === 'fr' ? 'Veuillez sélectionner une catégorie.' : 'Please select what you ate.')
      return
    }
    if (!manualFoodName.trim()) {
      setError(currentCulture === 'fr' ? 'Veuillez entrer le nom de l\'aliment.' : 'Please enter what you ate.')
      return
    }

    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Calcul de la valeur nutritionnelle avec l'IA..." : "Calculating calorie and nutrition breakdown...")
    setError('')

    const payload = {
      foodName: manualFoodName,
      portion: manualPortion,
      portionUnit: manualPortionUnit,
      category: manualCategory,
      soup: manualCategory === 'swallow' || manualCategory === 'rice' ? manualSoup : '',
      proteins: (manualCategory === 'swallow' || manualCategory === 'rice' || manualCategory === 'soups') ? selectedProteins : [],
      oilLevel: (manualCategory === 'swallow' || manualCategory === 'soups') ? oilLevel : '',
      isCompositeDish: manualCategory === 'rice' ? isCompositeDish : false,
      preparation: manualCategory === 'tubers' ? tuberPrep : '',
      additional: manualAdditional,
      type: manualMealType
    }

    if (!navigator.onLine) {
      try {
        await queueOrExecute('LOG_MANUAL_MEAL', payload, () => {
          setToastMessage(currentCulture === 'fr' ? 'Repas enregistré hors ligne (sera synchronisé) 🥗' : 'Meal logged offline (will sync when online) 🥗')
          setShowToast(true)
          setTimeout(() => {
            setShowToast(false)
            navigate('/home')
          }, 2000)
        })
      } catch (err) {
        console.error('Failed to queue manual meal:', err)
        setError('Failed to log offline. Please try again.')
      } finally {
        setLocalLoading(false)
      }
      return
    }

    try {
      const response = await axios.post('/api/meal/manual', payload, {
        withCredentials: true
      })

      if (response.data.success) {
        const meal = response.data.data
        setMealResult({
          id: meal.id,
          foodName: meal.name,
          description: response.data.fallbackUsed ? 'Analyzed using regional nutritional values.' : 'Calculated via AI Nutrition Database.',
          imageUrl: meal.imageUrl,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat
        })
        setResultMealType(manualMealType)
        setShowResults(true)
      }
    } catch (err) {
      console.error('Manual log failed:', err)
      const errorMsg = err.response?.data?.message || 'Failed to calculate meal calories. Please try again.'
      setError(errorMsg)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleLogSavedMeal = async (savedMeal) => {
    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Enregistrement du repas..." : "Logging meal...")
    try {
      const response = await axios.post('/api/meal/manual', {
        foodName: savedMeal.name,
        calories: savedMeal.calories,
        protein: savedMeal.protein,
        carbs: savedMeal.carbs,
        fat: savedMeal.fat,
        imageUrl: savedMeal.imageUrl,
        type: manualMealType
      }, { withCredentials: true })

      if (response.data.success) {
        setToastMessage(currentCulture === 'fr' ? `Repas "${savedMeal.name}" enregistré ! 🥗` : `Logged "${savedMeal.name}" to your journal! 🥗`)
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
          navigate('/home')
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log saved meal.')
    } finally {
      setLocalLoading(false)
    }
  }

  const handleUpdateMeal = async () => {
    if (!editedFoodName.trim()) {
      setError('Food name cannot be empty')
      return
    }

    setLocalLoading(true)
    setError('')

    try {
      const response = await axios.put(`/api/meal/${mealResult.id}`, {
        name: editedFoodName,
        calories: parseFloat(editedCalories) || 0,
        protein: parseFloat(editedProtein) || 0,
        carbs: parseFloat(editedCarbs) || 0,
        fat: parseFloat(editedFat) || 0,
        type: resultMealType
      }, {
        withCredentials: true
      })

      if (response.data.success) {
        const updated = response.data.data
        setScanResult(prev => ({
          ...prev,
          foodName: updated.name,
          calories: updated.calories,
          carbs: updated.carbs,
          protein: updated.protein,
          fat: updated.fat
        }))
        setIsEditingResults(false)
        setToastMessage('Meal details updated successfully! 🥗')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      }
    } catch (err) {
      console.error('Update meal failed:', err)
      setError(err.response?.data?.message || 'Failed to save edits.')
    } finally {
      setLocalLoading(false)
    }
  }

  const handleSave = async () => {
    if (!mealResult?.id) {
      navigate('/home')
      return
    }

    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Enregistrement final..." : "Saving meal log...")
    setError('')

    try {
      const scale = parseFloat(quantity) || 1
      await axios.put(`/api/meal/${mealResult.id}`, {
        name: mealResult.foodName,
        calories: (mealResult.calories || 0) * scale,
        protein: (mealResult.protein || 0) * scale,
        carbs: (mealResult.carbs || 0) * scale,
        fat: (mealResult.fat || 0) * scale,
        type: resultMealType
      }, {
        withCredentials: true
      })
      navigate('/home')
    } catch (err) {
      console.error('Failed to save final meal log:', err)
      navigate('/home')
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} color="white" />
        </button>
        <span className={styles.topBarTitle}>
          {showResults ? i18n[currentCulture].nutrition : (currentCulture === 'fr' ? 'Enregistrer un Repas' : 'Log Your Meal')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showResults ? (
            <button className={styles.favoriteBtn} style={{ marginTop: '4px' }} onClick={handleFavorite}>
              <Heart size={24} fill={isFavorite ? "#EB5757" : "none"} color={isFavorite ? "#EB5757" : "white"} />
            </button>
          ) : (
            <div style={{ width: 24 }}></div>
          )}
        </div>
      </div>

      {/* Floating Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button className={styles.errorCloseBtn} onClick={clearError}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className={styles.contentArea}>
        {/* Tab Switcher */}
        {!showResults && !localLoading && (
          <div className={styles.tabsRow} style={{ margin: '12px 16px', display: 'flex', gap: '8px' }}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('manual')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Utensils size={16} />
              <span>{i18n[currentCulture].manual}</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'library' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('library')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <BookOpen size={16} />
              <span>{i18n[currentCulture].library}</span>
            </button>
          </div>
        )}

        {/* Manual Input Tab */}
        {activeTab === 'manual' && !showResults && (
          <div className={styles.fullPageManual}>
            <div className={styles.manualFormContent} style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 6px 0', marginBottom: '4px' }}>
                <button
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1)
                    } else {
                      navigate('/')
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    color: 'var(--color-text-primary)',
                    borderRadius: '50%'
                  }}
                  aria-label="Go back"
                >
                  <ArrowLeft size={26} color="currentColor" />
                </button>
                <h3 style={{
                  margin: 0,
                  fontSize: '26px',
                  fontWeight: '800',
                  textAlign: 'center',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  width: '100%',
                  padding: '0 40px'
                }}>
                  {currentCulture === 'fr' ? 'Enregistrer Votre Repas' : 'Log Your Meal'}
                </h3>
              </div>
              <p style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                margin: '4px 0 18px 0',
                padding: '0 16px',
                lineHeight: 1.4
              }}>
                {currentCulture === 'fr' ? 'Entrez ce que vous avez mangé et l\'IA calculera automatiquement vos calories et nutriments.' : 'Select your meal details below and AI will calculate your calories and macros.'}
              </p>
              
              <div className={styles.formGroup}>
                <label>{currentCulture === 'fr' ? "Moment du repas" : "Meal Slot / Period"}</label>
                <select 
                  className={styles.formSelect}
                  value={manualMealType}
                  onChange={(e) => setManualMealType(e.target.value)}
                >
                  <option value="breakfast">{currentCulture === 'fr' ? '🍳 Petit-déjeuner' : '🍳 Breakfast'}</option>
                  <option value="lunch">{currentCulture === 'fr' ? '🍛 Déjeuner' : '🍛 Lunch'}</option>
                  <option value="dinner">{currentCulture === 'fr' ? '🍲 Dîner' : '🍲 Dinner'}</option>
                  <option value="snack">{currentCulture === 'fr' ? '🍎 Collation / Snack' : '🍎 Snack'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{currentCulture === 'fr' ? "Qu'avez-vous mangé ?" : "What food category did you eat?"}</label>
                <select 
                  className={styles.formSelect}
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                >
                  <option value="">{currentCulture === 'fr' ? 'Sélectionnez une catégorie...' : 'Select a food category...'}</option>
                  {CULTURAL_METADATA[currentCulture].categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {manualCategory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {/* Category-specific Food Name Question */}
                  <div className={styles.formGroup}>
                    <label>
                      {manualCategory === 'swallow' && (currentCulture === 'fr' ? 'Quelle pâte/boule avez-vous mangée ?' : 'Which swallow did you eat?')}
                      {manualCategory === 'rice' && (currentCulture === 'fr' ? 'Quel type de riz ou de céréales avez-vous mangé ?' : 'Which rice or grain dish did you eat?')}
                      {manualCategory === 'soups' && (currentCulture === 'fr' ? 'Quelle sauce ou ragoût avez-vous mangé ?' : 'Which soup or stew did you eat?')}
                      {manualCategory === 'tubers' && (currentCulture === 'fr' ? 'Quel tubercule ou plat de banane avez-vous mangé ?' : 'Which tuber or plantain dish did you eat?')}
                      {manualCategory === 'other' && (currentCulture === 'fr' ? 'Quel aliment ou repas avez-vous mangé ?' : 'Which food or meal did you eat?')}
                    </label>
                    <input 
                      type="text" 
                      placeholder={
                        manualCategory === 'swallow' ? (currentCulture === 'fr' ? 'e.g. Foutou, Plakali, Eba, Amala' : 'e.g. Eba, Pounded Yam, Amala, Fufu') :
                        manualCategory === 'rice' ? (currentCulture === 'fr' ? 'e.g. Riz Gras, Thiéboudienne, Garba' : 'e.g. Jollof Rice, Fried Rice, Waakye') :
                        manualCategory === 'soups' ? (currentCulture === 'fr' ? 'e.g. Sauce Graine, Sauce Kopè, Egusi' : 'e.g. Egusi Soup, Okra Soup, Stew') :
                        manualCategory === 'tubers' ? (currentCulture === 'fr' ? 'e.g. Alloco, Igname bouillie, Boli' : 'e.g. Fried Plantain (Dodo), Boiled Yam, Boli') :
                        (currentCulture === 'fr' ? 'e.g. Beignets, Meat pie, Egg roll' : 'e.g. Meat Pie, Puff Puff, Egg Roll')
                      } 
                      className={styles.formInput} 
                      value={manualFoodName}
                      onChange={(e) => setManualFoodName(e.target.value)}
                    />
                  </div>

                  {/* Tuber Preparation Method */}
                  {manualCategory === 'tubers' && (
                    <div className={styles.formGroup}>
                      <label>{currentCulture === 'fr' ? 'Méthode de préparation' : 'Preparation Method'}</label>
                      <div className={styles.proteinPills}>
                        {TUBER_PREPARATIONS[currentCulture].map((prep) => (
                          <button
                            key={prep}
                            type="button"
                            className={`${styles.proteinPill} ${tuberPrep === prep ? styles.activeProteinPill : ''}`}
                            onClick={() => setTuberPrep(prep)}
                          >
                            {prep}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portion Question */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>{currentCulture === 'fr' ? 'Portion' : 'Portion Quantity & Unit'}</label>
                      <div className={styles.portionGroup}>
                        <input 
                          type="number" 
                          placeholder="1" 
                          className={styles.formInput} 
                          style={{ width: '80px' }} 
                          value={manualPortion}
                          onChange={(e) => setManualPortion(parseFloat(e.target.value) || 1)}
                        />
                        <select 
                          className={styles.formSelect}
                          value={manualPortionUnit}
                          onChange={(e) => setManualPortionUnit(e.target.value)}
                        >
                          {(CATEGORY_UNITS[currentCulture === 'fr' ? 'fr' : 'en'][manualCategory] || CATEGORY_UNITS[currentCulture === 'fr' ? 'fr' : 'en']['other']).map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Soup field */}
                  {(manualCategory === 'swallow' || manualCategory === 'rice') && (
                    <div className={styles.formGroup}>
                      <label>{CULTURAL_METADATA[currentCulture].soupLabel}</label>
                      <input 
                        type="text" 
                        placeholder={CULTURAL_METADATA[currentCulture].soupPlaceholder}
                        className={styles.formInput} 
                        value={manualSoup}
                        onChange={(e) => setManualSoup(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Oil Level Selector */}
                  {(manualCategory === 'swallow' || manualCategory === 'soups') && (
                    <div className={styles.formGroup}>
                      <label>{CULTURAL_METADATA[currentCulture].oilLabel}</label>
                      <div className={styles.oilSelector}>
                        {CULTURAL_METADATA[currentCulture].oilOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`${styles.oilBtn} ${oilLevel === opt ? styles.activeOilBtn : ''}`}
                            onClick={() => setOilLevel(opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proteins Selector */}
                  {(manualCategory === 'swallow' || manualCategory === 'rice' || manualCategory === 'soups') && (
                    <div className={styles.formGroup}>
                      <label>{CULTURAL_METADATA[currentCulture].proteinLabel}</label>
                      <div className={styles.proteinPills}>
                        {CULTURAL_METADATA[currentCulture].proteins.map((prot) => {
                          const isSelected = selectedProteins.includes(prot)
                          return (
                            <button
                              key={prot}
                              type="button"
                              className={`${styles.proteinPill} ${isSelected ? styles.activeProteinPill : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProteins(selectedProteins.filter(p => p !== prot))
                                } else {
                                  setSelectedProteins([...selectedProteins, prot])
                                }
                              }}
                            >
                              {prot}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional items section */}
                  <div className={styles.formGroup}>
                    <label>
                      {currentCulture === 'fr' ? 'Quelque chose d\'autre en plus ? (e.g. Zobo, dodo extra)' : 'Did you add any extra items? (e.g. Zobo, extra plantain, egg)'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={currentCulture === 'fr' ? 'e.g. Jus de Bissap, dodo extra' : 'e.g. Zobo drink, extra plantain, shrimp'} 
                      className={styles.formInput} 
                      value={manualAdditional}
                      onChange={(e) => setManualAdditional(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <button 
                className={styles.submitBtn} 
                onClick={handleManualSubmit} 
                style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={localLoading}
              >
                {localLoading ? (
                  <>
                    <span className="mini-spinner" />
                    <span>{i18n[currentCulture].fetching}</span>
                  </>
                ) : (
                  i18n[currentCulture].calculateLog
                )}
              </button>
            </div>
          </div>
        )}

        {/* Library / Saved Meals Tab */}
        {activeTab === 'library' && !showResults && (
          <div className={styles.libraryTabWrapper} style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              {currentCulture === 'fr' ? 'Plats Favoris & Enregistrés' : 'Saved Meals & Favorites'}
            </h3>
            {savedMeals.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', margin: '40px 0' }}>
                {currentCulture === 'fr' ? 'Aucun plat enregistré pour l\'instant. Enregistrez vos repas habituels pour les ajouter d\'un seul clic !' : 'No saved meals yet. Save your favorite daily meals to log them with 1 tap!'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedMeals.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface, #fff)', border: '1px solid #eee', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{item.name}</div>
                      <div style={{ fontSize: '12.5px', color: '#666' }}>{item.calories} kcal • {item.protein}g Protein</div>
                    </div>
                    <button 
                      onClick={() => handleLogSavedMeal(item)}
                      style={{ padding: '8px 14px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      + {currentCulture === 'fr' ? 'Ajouter' : 'Log'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {localLoading && (
        <div className={styles.loadingSheet}>
          <div className={styles.spinnerWrapper}>
            <div className={styles.orangeSpinner}></div>
          </div>
          <p className={styles.loadingText}>{loadingActionText || i18n[currentCulture].fetching}</p>
        </div>
      )}

      {/* Results View */}
      {showResults && !localLoading && (
        <div className={styles.resultsSheet}>
          <div className={styles.sheetHeader}>
            <div className={styles.quantityRow}>
              <div className={styles.quantitySelector}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className={styles.mealTitleRow} style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', padding: '0 10px' }}>
              <input 
                type="text" 
                value={editedFoodName} 
                onChange={(e) => {
                  setEditedFoodName(e.target.value)
                  if (mealResult) mealResult.foodName = e.target.value
                }} 
                className={styles.editFoodNameInput} 
                style={{ flex: 1, border: 'none', borderBottom: '1px solid #ddd', padding: '6px 0', fontSize: '18px', fontWeight: 'bold', background: 'transparent', outline: 'none' }}
                placeholder={currentCulture === 'fr' ? "Nom du repas..." : "Name this meal..."}
              />
            </div>
            <p className={styles.foodDescription} style={{ padding: '0 10px', margin: '4px 0' }}>{mealResult?.description}</p>
          </div>

          {/* Slot selector */}
          <div className={styles.courseTypeGroup} style={{ padding: '0 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-secondary)', alignSelf: 'flex-start' }}>
              {currentCulture === 'fr' ? 'Moment du repas :' : 'Meal slot:'}
            </label>
            <select
              value={resultMealType}
              onChange={(e) => setResultMealType(e.target.value)}
              className={styles.formSelect}
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
            >
              <option value="breakfast">{currentCulture === 'fr' ? '🍳 Petit-déjeuner' : '🍳 Breakfast'}</option>
              <option value="lunch">{currentCulture === 'fr' ? '🍛 Déjeuner' : '🍛 Lunch'}</option>
              <option value="dinner">{currentCulture === 'fr' ? '🍲 Dîner' : '🍲 Dinner'}</option>
              <option value="snack">{currentCulture === 'fr' ? '🍎 Collation / Snack' : '🍎 Snack'}</option>
            </select>
          </div>

          {showToast && (
            <div className={styles.toast}>
              {toastMessage}
            </div>
          )}

          {/* Macros Grid */}
          {isEditingResults ? (
            <div className={styles.macrosEditGrid}>
              <div className={styles.editMacroBox}>
                <label>{i18n[currentCulture].calories}</label>
                <input 
                  type="number" 
                  value={editedCalories} 
                  onChange={(e) => setEditedCalories(parseFloat(e.target.value) || 0)} 
                  className={styles.editMacroField}
                />
                <span>kcal</span>
              </div>
              <div className={styles.editMacroBox}>
                <label>{i18n[currentCulture].carbs}</label>
                <input 
                  type="number" 
                  value={editedCarbs} 
                  onChange={(e) => setEditedCarbs(parseFloat(e.target.value) || 0)} 
                  className={styles.editMacroField}
                />
                <span>g</span>
              </div>
              <div className={styles.editMacroBox}>
                <label>{i18n[currentCulture].protein}</label>
                <input 
                  type="number" 
                  value={editedProtein} 
                  onChange={(e) => setEditedProtein(parseFloat(e.target.value) || 0)} 
                  className={styles.editMacroField}
                />
                <span>g</span>
              </div>
              <div className={styles.editMacroBox}>
                <label>{i18n[currentCulture].fats}</label>
                <input 
                  type="number" 
                  value={editedFat} 
                  onChange={(e) => setEditedFat(parseFloat(e.target.value) || 0)} 
                  className={styles.editMacroField}
                />
                <span>g</span>
              </div>
            </div>
          ) : (
            <div className={styles.macrosGrid}>
              {/* Calories */}
              <div className={styles.macroCircleItem}>
                <div className={styles.macroCircleWrapper}>
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#F2F2F2" strokeWidth="3" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#FF5722" strokeWidth="3"
                      strokeDasharray="138.2" 
                      strokeDashoffset={animateCircles ? 138.2 * 0.3 : 138.2}
                      transform="rotate(-90 25 25)"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <div className={styles.macroCircleText}>
                    <span>{mealResult ? mealResult.calories * quantity : 0}</span>
                  </div>
                </div>
                <span className={styles.macroLabel}>{i18n[currentCulture].calories}</span>
              </div>

              {/* Carbs */}
              <div className={styles.macroCircleItem}>
                <div className={styles.macroCircleWrapper}>
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#F2F2F2" strokeWidth="3" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#2F80ED" strokeWidth="3"
                      strokeDasharray="138.2" 
                      strokeDashoffset={animateCircles ? 138.2 * 0.6 : 138.2}
                      transform="rotate(-90 25 25)"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <div className={styles.macroCircleText}>
                    <span>{mealResult ? mealResult.carbs * quantity : 0}g</span>
                  </div>
                </div>
                <span className={styles.macroLabel}>{i18n[currentCulture].fats}</span>
              </div>

              {/* Protein */}
              <div className={styles.macroCircleItem}>
                <div className={styles.macroCircleWrapper}>
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#F2F2F2" strokeWidth="3" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#27AE60" strokeWidth="3"
                      strokeDasharray="138.2" 
                      strokeDashoffset={animateCircles ? 138.2 * 0.4 : 138.2}
                      transform="rotate(-90 25 25)"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <div className={styles.macroCircleText}>
                    <span>{mealResult ? mealResult.protein * quantity : 0}g</span>
                  </div>
                </div>
                <span className={styles.macroLabel}>{i18n[currentCulture].protein}</span>
              </div>

              {/* Fats */}
              <div className={styles.macroCircleItem}>
                <div className={styles.macroCircleWrapper}>
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#F2F2F2" strokeWidth="3" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#F2C94C" strokeWidth="3"
                      strokeDasharray="138.2" 
                      strokeDashoffset={animateCircles ? 138.2 * 0.5 : 138.2}
                      transform="rotate(-90 25 25)"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <div className={styles.macroCircleText}>
                    <span>{mealResult ? mealResult.fat * quantity : 0}g</span>
                  </div>
                </div>
                <span className={styles.macroLabel}>{i18n[currentCulture].fats}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtonsRow}>
            {isEditingResults ? (
              <>
                <button className={styles.cancelEditBtn} onClick={() => setIsEditingResults(false)}>
                  {i18n[currentCulture].cancel}
                </button>
                <button className={styles.saveEditBtn} onClick={handleUpdateMeal}>
                  {i18n[currentCulture].saveEdits}
                </button>
              </>
            ) : (
              <>
                <button className={styles.fixBtn} onClick={() => setIsEditingResults(true)}>
                  {i18n[currentCulture].fixResults}
                </button>
                <button className={styles.saveBtn} onClick={handleSave}>
                  {i18n[currentCulture].save}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
