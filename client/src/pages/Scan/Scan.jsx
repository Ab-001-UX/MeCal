import React, { useState, useRef, useEffect } from 'react'
import { useUiStore } from '../../store/uiStore'
import { BrowserMultiFormatReader } from '@zxing/library'
import { useUserStore } from '../../store/userStore'
import styles from './Scan.module.css'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { scanBarcode as scanBarcodeApi, getSavedMeals, saveMealToLibrary, removeSavedMeal } from '../../services/meal.service.js'
import '../../i18n'
import { useNavigate } from 'react-router-dom'
import { Camera, X, Plus, Minus, Heart, ArrowLeft, Barcode, Image, Upload } from 'lucide-react'

const i18n = {
  en: {
    nutrition: "Nutrition",
    scan: "Photo",
    barcode: "Barcode",
    manual: "Manual",
    library: "Library",
    fetching: "Fetching nutrition report",
    logMeal: "Log Your Meal",
    manualInput: "Manual Input",
    whatDidYouEat: "What did you eat?",
    portion: "Portion",
    calculateLog: "Calculate & Log",
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
    fixResults: "Fix Results",
    save: "Save",
    cameraDenied: "Camera access denied or not available.",
    tapLibrary: "Tap Library to upload or Manual to type.",
    cancel: "Cancel",
    saveEdits: "Save Edits",
    editInstruction: "Edit the food name, calories and macros below:"
  },
  fr: {
    nutrition: "Nutrition",
    scan: "Photo",
    barcode: "Code-barres",
    manual: "Manuel",
    library: "Bibliothèque",
    fetching: "Récupération du rapport",
    logMeal: "Enregistrer le repas",
    manualInput: "Saisie manuelle",
    whatDidYouEat: "Qu'avez-vous mangé ?",
    portion: "Portion",
    calculateLog: "Calculer & Enregistrer",
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
    fixResults: "Corriger",
    save: "Enregistrer",
    cameraDenied: "Accès caméra refusé ou non disponible.",
    tapLibrary: "Appuyez sur Bibliothèque pour importer ou Manuel pour taper.",
    cancel: "Annuler",
    saveEdits: "Enregistrer",
    editInstruction: "Modifiez le nom de l'aliment, les calories et les macros ci-dessous :"
  }
}

const CULTURAL_METADATA = {
  en: {
    categories: [
      { value: 'other', label: 'Other Foods' },
      { value: 'swallow', label: 'Swallow (e.g., Eba, Amala, Pounded Yam)' },
      { value: 'rice', label: 'Rice & Grains (e.g., Jollof, Fried Rice)' },
      { value: 'soups', label: 'Soups & Stews' },
      { value: 'tubers', label: 'Tubers & Plantain' }
    ],
    units: ['Plate(s)', 'Bowl(s)', 'Wrap(s)', 'Piece(s)', 'Spoon(s)', 'Catering Spoon(s)', 'DeRica(s)', 'Mudu(s)', 'Tin(s)', 'Gram(s)'],
    proteins: ['Beef', 'Chicken', 'Goat Meat', 'Ponmo / Shaki / Assorted', 'Fried Fish', 'Smoked Fish', 'Egg'],
    soupLabel: 'What soup or stew did you eat it with?',
    soupPlaceholder: 'e.g., Egusi, Okra, Ewedu',
    proteinLabel: 'What protein did you add?',
    oilLabel: 'How oily was the soup/stew?',
    oilOptions: ['Light Oil', 'Normal Oil', 'Floating / Heavy Oil']
  },
  fr: {
    categories: [
      { value: 'other', label: 'Autres' },
      { value: 'swallow', label: 'Pâtes / Boules (e.g., Foutou, Plakali, Kabato)' },
      { value: 'rice', label: 'Riz & Céréales (e.g., Riz Gras, Thiéboudienne)' },
      { value: 'soups', label: 'Sauces' },
      { value: 'tubers', label: 'Tubercules & Bananes (e.g., Alloco, Igname)' }
    ],
    units: ['Assiette(s)', 'Bol(s)', 'Morceau(x)', 'Cuillère(s)', 'Louche(s)', 'Poignée(s)', 'Tas', 'Gramme(s)'],
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
  
  // Detect if Francophone based on user country or language setting
  const isFrancophoneCountry = ['côte d\'ivoire', 'cote d\'ivoire', 'ivory coast', 'senegal', 'sénégal', 'benin', 'bénin', 'togo', 'cameroon', 'cameroun', 'guinea', 'guinée', 'mali', 'niger', 'burkina faso'].includes(user?.country?.toLowerCase() || '')
  const currentCulture = (language === 'fr' || isFrancophoneCountry) ? 'fr' : 'en'

  const [isScanning, setIsScanning] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('scan') // scan, barcode, manual, library
  const [cameraError, setCameraError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [savedMeals, setSavedMeals] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [animateCircles, setAnimateCircles] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [loadingActionText, setLoadingActionText] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')

  // Inline edit states for fixing scan results
  const [isEditingResults, setIsEditingResults] = useState(false)
  const [editedFoodName, setEditedFoodName] = useState('')
  const [editedCalories, setEditedCalories] = useState(0)
  const [editedCarbs, setEditedCarbs] = useState(0)
  const [editedProtein, setEditedProtein] = useState(0)
  const [editedFat, setEditedFat] = useState(0)

  useEffect(() => {
    if (scanResult) {
      setEditedFoodName(scanResult.foodName || '')
      setEditedCalories(scanResult.calories || 0)
      setEditedCarbs(scanResult.carbs || 0)
      setEditedProtein(scanResult.protein || 0)
      setEditedFat(scanResult.fat || 0)
    }
  }, [scanResult])

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
    if (!scanResult?.foodName) return
    const match = savedMeals.some(
      (m) => m.name?.toLowerCase() === scanResult.foodName?.toLowerCase()
    )
    setIsFavorite(match)
  }, [scanResult?.foodName, savedMeals])

  const handleFavorite = async () => {
    if (!scanResult?.foodName) return
    try {
      if (isFavorite) {
        const existing = savedMeals.find(
          (m) => m.name?.toLowerCase() === scanResult.foodName?.toLowerCase()
        )
        if (existing) await removeSavedMeal(existing.id)
        setSavedMeals((prev) => prev.filter((m) => m.id !== existing?.id))
        setIsFavorite(false)
        setToastMessage('Meal removed from saved foods')
      } else {
        const res = await saveMealToLibrary({
          name: scanResult.foodName,
          calories: scanResult.calories,
          protein: scanResult.protein,
          carbs: scanResult.carbs,
          fat: scanResult.fat,
          imageUrl: scanResult.imageUrl
        })
        if (res.data.success) {
          setSavedMeals((prev) => [...prev, res.data.data])
          setIsFavorite(true)
          setToastMessage('Meal saved to your library')
        }
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch {
      setToastMessage('Could not update saved foods')
      setShowToast(true)
    }
  }

  // Trigger circle animation when results are shown
  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => setAnimateCircles(true), 300)
      return () => clearTimeout(timer)
    } else {
      setAnimateCircles(false)
    }
  }, [showResults])

  // Clear errors when changing tabs
  useEffect(() => {
    if (clearError) clearError()
  }, [activeTab])
  
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const barcodeFileInputRef = useRef(null)
  const barcodeCameraInputRef = useRef(null)
  const navigate = useNavigate()
  const { setLoading } = useUiStore()

  const [barcodeMode, setBarcodeMode] = useState('image') // 'image' or 'manual'

  const performScan = async (image, currentTab) => {
    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Analyse de l'image du repas avec l'IA..." : "Analyzing meal photo with AI...")
    setError('')
    
    try {
      const response = await axios.post('/api/meal/scan', { image }, {
        withCredentials: true
      })
      
      if (response.data.success) {
        const meal = response.data.data
        setScanResult({
          id: meal.id,
          foodName: meal.name,
          description: response.data.fallbackUsed ? 'Analyzed using standard nutrition values.' : 'AI analyzed successfully.',
          imageUrl: meal.imageUrl,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat,
          confidence: response.data.confidence || 'Medium',
          healthScore: 'N/A'
        })
        const hour = new Date().getHours()
        let defaultType = 'breakfast'
        if (hour >= 11 && hour < 16) {
          defaultType = 'lunch'
        } else if (hour >= 16 && hour < 20) {
          defaultType = 'dinner'
        } else if (hour >= 20 || hour < 5) {
          defaultType = 'snack'
        }
        setResultMealType(defaultType)
        setShowResults(true)
      }
    } catch (err) {
      console.error('Scan failed:', err)
      const errorMsg = err.response?.data?.message || 'Failed to scan food image. Please try library upload or manual entry.'
      setError(errorMsg)
      setIsScanning(true)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleBarcodeLookup = async (forcedCode) => {
    const codeVal = typeof forcedCode === 'string' ? forcedCode : barcodeValue
    if (!codeVal.trim()) {
      setError(currentCulture === 'fr' ? 'Le code-barres est requis' : 'Barcode is required')
      return
    }

    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Recherche du produit par code-barres..." : "Looking up product barcode...")
    setError('')
    try {
      const response = await scanBarcodeApi(codeVal.trim())
      if (response.data.success) {
        const meal = response.data.data
        setScanResult({
          id: meal.id,
          foodName: meal.name,
          description: response.data.servingNote || '',
          imageUrl: meal.imageUrl,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat,
          healthScore: 'N/A'
        })
        const hour = new Date().getHours()
        let defaultType = 'breakfast'
        if (hour >= 11 && hour < 16) {
          defaultType = 'lunch'
        } else if (hour >= 16 && hour < 20) {
          defaultType = 'dinner'
        } else if (hour >= 20 || hour < 5) {
          defaultType = 'snack'
        }
        setResultMealType(defaultType)
        setCapturedImage(meal.imageUrl)
        setIsScanning(false)
        setShowResults(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || (currentCulture === 'fr' ? 'Produit non trouvé' : 'Barcode not found'))
    } finally {
      setLocalLoading(false)
    }
  }

  const handleBarcodeImage = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Décodage du code-barres..." : "Decoding product barcode...")
    setError('')
    
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = async () => {
      const imageDataUrl = reader.result
      setCapturedImage(imageDataUrl)
      
      const codeReader = new BrowserMultiFormatReader()
      try {
        const result = await codeReader.decodeFromImageUrl(imageDataUrl)
        if (result) {
          const code = result.getText()
          setBarcodeValue(code)
          setBarcodeMode('manual')
          await handleBarcodeLookup(code)
        }
      } catch (err) {
        console.error("Barcode decoding failed:", err)
        setError(currentCulture === 'fr' ? 'Impossible de lire le code-barres. Essayez de le saisir manuellement.' : 'Could not read a valid barcode from the image. Please try typing it manually.')
        setCapturedImage(null)
        setBarcodeMode('manual')
      } finally {
        setLocalLoading(false)
      }
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
    setLoadingActionText(currentCulture === 'fr' ? "Calcul de la valeur nutritionnelle du repas..." : "Calculating nutritional value for meal...")
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
        const { queueOrExecute } = await import('../../utils/syncQueue.js')
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
        setScanResult({
          id: meal.id,
          foodName: meal.name,
          description: response.data.fallbackUsed ? 'Analyzed using standard nutrition values.' : 'AI analyzed successfully.',
          imageUrl: meal.imageUrl,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat,
          healthScore: 'N/A'
        })
        setShowResults(true)
      }
    } catch (err) {
      console.error('Manual log failed:', err)
      const errorMsg = err.response?.data?.message || 'Failed to log meal. Please try again.'
      setError(errorMsg)
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
      const response = await axios.put(`/api/meal/${scanResult.id}`, {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setCapturedImage(reader.result)
      setIsScanning(false)
      performScan(reader.result, 'library')
    }
  }

  const handleSave = async () => {
    if (!scanResult?.id) {
      navigate('/home')
      return
    }

    setLocalLoading(true)
    setLoadingActionText(currentCulture === 'fr' ? "Enregistrement du repas..." : "Saving meal slot...")
    setError('')

    try {
      const scale = parseFloat(quantity) || 1
      await axios.put(`/api/meal/${scanResult.id}`, {
        name: scanResult.foodName,
        calories: (scanResult.calories || 0) * scale,
        protein: (scanResult.protein || 0) * scale,
        carbs: (scanResult.carbs || 0) * scale,
        fat: (scanResult.fat || 0) * scale,
        type: resultMealType
      }, {
        withCredentials: true
      })
      navigate('/home')
    } catch (err) {
      console.error('Failed to save final meal type:', err)
      // fallback to navigate so user isn't stuck
      navigate('/home')
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header with Back button */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <X size={24} color="white" />
        </button>
        <span className={styles.topBarTitle}>
          {showResults ? i18n[currentCulture].nutrition : (currentCulture === 'fr' ? 'Journal Photo' : 'Photo Log')}
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
        {isScanning && activeTab === 'scan' && (
          <div className={styles.scanTabWrapper}>
            <div className={styles.scannerPromptCard}>
              <div className={styles.scannerIconBox}>
                <Camera size={48} className={styles.scannerIcon} />
              </div>
              <h3>{currentCulture === 'fr' ? 'Prenez en Photo Votre Repas' : 'Log Meal with Photo'}</h3>
              <p>{currentCulture === 'fr' ? 'Prenez une photo de votre repas ou choisissez une image pour analyser sa composition.' : 'Take a photo of your food or choose an image from your library to analyze its components with AI.'}</p>
              <div className={styles.scannerButtonGroup}>
                <button 
                  type="button" 
                  className={styles.captureCardBtn}
                  onClick={() => cameraInputRef.current.click()}
                >
                  📸 {currentCulture === 'fr' ? 'Prendre une Photo' : 'Take Photo'}
                </button>
                <button 
                  type="button" 
                  className={styles.libraryCardBtn}
                  onClick={() => fileInputRef.current.click()}
                >
                  🖼️ {currentCulture === 'fr' ? 'Choisir de la Bibliothèque' : 'Choose from Library'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isScanning && activeTab === 'barcode' && (
          <div className={styles.barcodeTabWrapper}>
            <div className={styles.barcodeToggleRow}>
              <button 
                type="button" 
                onClick={() => setBarcodeMode('image')}
                className={`${styles.barcodeToggleBtn} ${barcodeMode === 'image' ? styles.activeBarcodeToggleBtn : ''}`}
              >
                📷 {currentCulture === 'fr' ? 'Scanner Code' : 'Scan Barcode'}
              </button>
              <button 
                type="button" 
                onClick={() => setBarcodeMode('manual')}
                className={`${styles.barcodeToggleBtn} ${barcodeMode === 'manual' ? styles.activeBarcodeToggleBtn : ''}`}
              >
                ⌨️ {currentCulture === 'fr' ? 'Saisir Code' : 'Type Code'}
              </button>
            </div>

            {barcodeMode === 'image' ? (
              <div className={styles.scannerPromptCard}>
                <div className={styles.scannerIconBox}>
                  <Barcode size={48} className={styles.scannerIcon} />
                </div>
                <h3>{currentCulture === 'fr' ? 'Scannez Code-barres' : 'Scan Product Barcode'}</h3>
                <p>{currentCulture === 'fr' ? 'Prenez une photo du code-barres ou sélectionnez une image de votre bibliothèque.' : 'Snap a photo of the barcode or select an image from your library to auto-detect the product.'}</p>
                <div className={styles.scannerButtonGroup}>
                  <button 
                    type="button" 
                    className={styles.captureCardBtn}
                    onClick={() => barcodeCameraInputRef.current.click()}
                  >
                    📸 {currentCulture === 'fr' ? 'Prendre une Photo' : 'Take Photo'}
                  </button>
                  <button 
                    type="button" 
                    className={styles.libraryCardBtn}
                    onClick={() => barcodeFileInputRef.current.click()}
                  >
                    🖼️ {currentCulture === 'fr' ? 'Choisir de la Bibliothèque' : 'Choose Barcode Image'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.barcodeManualForm}>
                <p className={styles.barcodeFormHint}>{t('scan.barcodeHint') || (currentCulture === 'fr' ? 'Entrez le code-barres à 8-14 chiffres figurant sur l\'emballage.' : 'Enter the 8 to 14 digit barcode printed on the product packaging.')}</p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('scan.barcodePlaceholder') || 'e.g. 7613035777174'}
                  className={styles.formInput}
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  className={styles.submitBtn}
                  style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => handleBarcodeLookup()}
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <>
                      <span className="mini-spinner" />
                      <span>{currentCulture === 'fr' ? 'Recherche en cours...' : 'Looking up Product...'}</span>
                    </>
                  ) : (
                    t('scan.barcodeLookup') || (currentCulture === 'fr' ? 'Rechercher le produit' : 'Lookup Product')
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {(!isScanning || activeTab !== 'scan') && capturedImage && (
          <div className={styles.previewWrapper}>
            <img src={scanResult?.imageUrl || capturedImage} alt="Captured" className={styles.previewImage} />
          </div>
        )}

        {/* Manual Input Full Page */}
        {activeTab === 'manual' && (
          <div className={styles.fullPageManual}>
            <div className={styles.manualHeader}>
              <button onClick={() => setActiveTab('scan')} className={styles.backBtn}>
                <ArrowLeft size={24} />
              </button>
              <h2>{currentCulture === 'fr' ? 'Saisie Manuelle' : 'Manual Input'}</h2>
              <div style={{ width: '40px' }}></div>
            </div>
            
            <div className={styles.manualFormContent} style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
              <div className={styles.manualFormHeader}>
                <h3>{currentCulture === 'fr' ? 'Enregistrer Votre Repas' : 'Log Your Meal'}</h3>
                <p>{currentCulture === 'fr' ? 'Saisissez manuellement les détails de votre repas.' : 'Enter the details of your meal manually.'}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label>{currentCulture === 'fr' ? "Type de repas / moment" : "Meal Slot / Period"}</label>
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
                <label>{currentCulture === 'fr' ? "Qu'avez-vous mangé ?" : "What did you eat?"}</label>
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
                      {manualCategory === 'swallow' && (currentCulture === 'fr' ? 'Quelle pâte/boule avez-vous mangé ?' : 'Which swallow did you eat?')}
                      {manualCategory === 'rice' && (currentCulture === 'fr' ? 'Quel type de riz ou de céréales avez-vous mangé ?' : 'Which rice or grain dish did you eat?')}
                      {manualCategory === 'soups' && (currentCulture === 'fr' ? 'Quelle sauce ou ragoût avez-vous mangé ?' : 'Which soup or stew did you eat?')}
                      {manualCategory === 'tubers' && (currentCulture === 'fr' ? 'Quel tubercule ou plat de banane avez-vous mangé ?' : 'Which tuber or plantain dish did you eat?')}
                      {manualCategory === 'other' && (currentCulture === 'fr' ? 'Quel aliment ou repas avez-vous mangé ?' : 'Which food or meal did you eat?')}
                    </label>
                    <input 
                      type="text" 
                      placeholder={
                        manualCategory === 'swallow' ? (currentCulture === 'fr' ? 'e.g. Foutou de bananes, Plakali' : 'e.g. Eba, Pounded Yam, Amala') :
                        manualCategory === 'rice' ? (currentCulture === 'fr' ? 'e.g. Riz Gras, Thiéboudienne' : 'e.g. Jollof Rice, Fried Rice, White Rice') :
                        manualCategory === 'soups' ? (currentCulture === 'fr' ? 'e.g. Sauce Graine, Sauce Kopè' : 'e.g. Egusi Soup, Okro Soup, Stew') :
                        manualCategory === 'tubers' ? (currentCulture === 'fr' ? 'e.g. Alloco (banane frite), Igname bouillie' : 'e.g. Fried Plantain, Boiled Yam, Sweet Potato') :
                        (currentCulture === 'fr' ? 'e.g. Chausson à la viande, Beignets' : 'e.g. Meat Pie, Puff Puff, Egg Roll')
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

                  {/* Portion Question - customized per category */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>{currentCulture === 'fr' ? 'Portion' : 'Portion'}</label>
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

                  {/* Composite Toggle (French Rice Only) */}
                  {currentCulture === 'fr' && manualCategory === 'rice' && (
                    <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="compositeToggle"
                        checked={isCompositeDish}
                        onChange={(e) => setIsCompositeDish(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                      <label htmlFor="compositeToggle" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>
                        Plat composite / commun ? (e.g. Thiéboudienne, Garba)
                      </label>
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

                  {/* Proteins / Obstacles Selector */}
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
                      {currentCulture === 'fr' ? 'Quelque chose d\'autre en plus ? (e.g. Zobo, plantain frit, viande extra)' : 'Did you eat anything additional to it? (e.g. Zobo, extra meat, shrimp, dodo)'}
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
                style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={localLoading}
              >
                {localLoading ? (
                  <>
                    <span className="mini-spinner" />
                    <span>{currentCulture === 'fr' ? 'Calcul en cours...' : 'Calculating & Logging...'}</span>
                  </>
                ) : (
                  currentCulture === 'fr' ? 'Calculer & Enregistrer' : 'Calculate & Log'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet / Controls */}
      {localLoading ? (
        <div className={styles.loadingSheet}>
          <div className={styles.spinnerWrapper}>
            <div className={styles.orangeSpinner}></div>
          </div>
          <p className={styles.loadingText}>{loadingActionText || i18n[currentCulture].fetching}</p>
        </div>
      ) : !showResults ? (
        <div className={styles.controlsWrapper}>
          {/* Options Tabs */}
          <div className={styles.tabsRow}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'scan' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('scan')}
              >
                {i18n[currentCulture].scan}
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'barcode' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('barcode')}
              >
                {i18n[currentCulture].barcode}
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                {i18n[currentCulture].manual}
              </button>
          </div>
        </div>
      ) : (
        /* Results View */
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
            <div className={styles.mealTitleRow}>
              {isEditingResults ? (
                <input 
                  type="text" 
                  value={editedFoodName} 
                  onChange={(e) => setEditedFoodName(e.target.value)} 
                  className={styles.editFoodNameInput} 
                  placeholder={currentCulture === 'fr' ? "Nom de l'aliment" : "Food Name"}
                />
              ) : (
                <h2>{scanResult?.foodName}</h2>
              )}
            </div>
            {isEditingResults ? (
              <p className={styles.foodDescriptionEditing}>{i18n[currentCulture].editInstruction}</p>
            ) : (
              <>
                <p className={styles.foodDescription}>{scanResult?.description}</p>
                {scanResult?.confidence && (
                  <p className={styles.confidenceBadge}>
                    {t('scanConfidence', { level: scanResult.confidence })}
                  </p>
                )}
              </>
            )}
          </div>

          <div className={styles.resultTypeGroup} style={{ padding: '0 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-secondary)', alignSelf: 'flex-start' }}>
              {currentCulture === 'fr' ? 'Type de repas / moment :' : 'Meal Slot / Period:'}
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

          {/* Macros Grid with Circular Progress */}
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
                    <span>{scanResult ? scanResult.calories * quantity : 0}</span>
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
                    <span>{scanResult ? scanResult.carbs * quantity : 0}g</span>
                  </div>
                </div>
                <span className={styles.macroLabel}>{i18n[currentCulture].carbs}</span>
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
                    <span>{scanResult ? scanResult.protein * quantity : 0}g</span>
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
                    <span>{scanResult ? scanResult.fat * quantity : 0}g</span>
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

      {/* Hidden Inputs for Food Scanning */}
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        style={{ display: 'none' }} 
        ref={cameraInputRef}
        onChange={handleFileChange}
      />

      {/* Hidden Inputs for Barcode Scanning */}
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={barcodeFileInputRef}
        onChange={handleBarcodeImage}
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        style={{ display: 'none' }} 
        ref={barcodeCameraInputRef}
        onChange={handleBarcodeImage}
      />
    </div>
  )
}
