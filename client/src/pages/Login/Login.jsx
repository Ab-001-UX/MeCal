import React, { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Login.module.css'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useUiStore } from '../../store/uiStore'
import { Eye, EyeOff, Phone, Lock, ChevronLeft } from 'lucide-react'

const i18n = {
  en: {
    welcomeBack: "Welcome Back",
    subtitle: "Login to access your private account.",
    phoneNumber: "Phone Number",
    password: "Password",
    forgotPassword: "Forgot Password?",
    logIn: "Log In",
    loggingIn: "Logging in...",
    dontHaveAccount: "Don't have an account?",
    createAccount: "Create Account",
    accountExists: "Phone number is already in use. Please log in.",
    deviceAccountExists: "An account already exists on this device. Please log in.",
    incorrectPassword: "Incorrect password. Please try again.",
    incorrectPhone: "Incorrect phone number. This user does not exist.",
    accountNotFound: "Account not found. Redirecting to create account in 10 seconds..."
  },
  fr: {
    welcomeBack: "Bon retour",
    subtitle: "Connectez-vous pour accéder à votre compte privé.",
    phoneNumber: "Numéro de téléphone",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    logIn: "Se connecter",
    loggingIn: "Connexion...",
    dontHaveAccount: "Vous n'avez pas de compte ?",
    createAccount: "Créer un compte",
    accountExists: "Ce numéro de téléphone est déjà utilisé. Veuillez vous connecter.",
    deviceAccountExists: "Un compte existe déjà sur cet appareil. Veuillez vous connecter.",
    incorrectPassword: "Mot de passe incorrect. Veuillez réessayer.",
    incorrectPhone: "Numéro de téléphone incorrect. Cet utilisateur n'existe pas.",
    accountNotFound: "Compte non trouvé. Redirection vers la création de compte dans 10 secondes..."
  }
}

export default function Login() {
  const location = useLocation()
  const [phoneNumber, setPhoneNumber] = useState(location.state?.phoneNumber || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useUserStore()
  const { language } = useUiStore()

  // Sync phone number if navigated here with state (e.g. from duplicate account redirect)
  useEffect(() => {
    if (location.state?.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber)
    }
  }, [location.state?.phoneNumber])

  useEffect(() => {
    document.body.style.backgroundColor = '#121212'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.post('/api/auth/login', {
        phoneNumber,
        password
      }, {
        withCredentials: true
      })
      
      if (response.data.success) {
        setUser(response.data.data)
        localStorage.setItem('hasAccount', 'true')
        navigate('/home')
      }
    } catch (err) {
      console.error('Login failed:', err)
      const serverMsg = err.response?.data?.message
      if (serverMsg === 'Incorrect password') {
        setError(i18n[language].incorrectPassword)
      } else if (serverMsg === 'Account not found' || serverMsg === 'Incorrect phone number') {
        setError("Account not found. This phone number hasn't been registered yet. Redirecting to create account in 10 seconds...")
        setTimeout(() => {
          navigate('/create-account')
        }, 10000)
      } else {
        setError(serverMsg || 'Failed to login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <button 
        type="button" 
        onClick={() => navigate('/')} 
        className={styles.backButton}
        aria-label="Back to welcome screen"
      >
        <ChevronLeft size={24} />
      </button>
      <div className={styles.content}>
        <h1 className={styles.title}>{i18n[language].welcomeBack}</h1>
        <p className={styles.subtitle}>{i18n[language].subtitle}</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWithIcon}>
            <Phone size={20} className={styles.inputIcon} />
            <input 
              type="tel" 
              id="phoneNumber" 
              value={phoneNumber} 
              onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
              placeholder={i18n[language].phoneNumber}
              className={styles.premiumInput}
              required
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <div className={styles.inputWithIcon}>
              <Lock size={20} className={styles.inputIcon} />
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={i18n[language].password}
                className={styles.premiumInput}
                required
              />
              <button 
                type="button" 
                className={styles.premiumEyeButton} 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            
            <div className={styles.forgotPassword}>
              <Link to="/forgot-password" className={styles.link}>{i18n[language].forgotPassword}</Link>
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`${styles.button} ${loading ? 'btn-loading' : ''}`} 
            disabled={loading}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>{loading ? i18n[language].loggingIn : i18n[language].logIn}</span>
              {loading && <div className="mini-spinner"></div>}
            </div>
          </button>
        </form>
        
        <div className={styles.footer}>
          {i18n[language].dontHaveAccount} <Link to="/create-account" className={styles.link} onClick={() => { 
            localStorage.removeItem('onboardingStep'); 
            localStorage.removeItem('onboardingData');
            localStorage.removeItem('onboardingTimestamp');
          }}>{i18n[language].createAccount}</Link>
        </div>
      </div>
    </div>
  )
}
