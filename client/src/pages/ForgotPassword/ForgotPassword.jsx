import React, { useState } from 'react'
import axios from 'axios'
import styles from './ForgotPassword.module.css'
import { useNavigate, Link } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { Phone, Lock, Eye, EyeOff, Hash, ArrowLeft } from 'lucide-react'

const i18n = {
  en: {
    resetPassword: "Reset Password",
    enterPhone: "Enter your phone number to receive a verification code.",
    phoneNumber: "Phone Number",
    sendCode: "Send Verification Code",
    sending: "Sending...",
    enterCode: "Enter the verification code sent to your phone.",
    verificationCode: "Verification Code",
    verifyCode: "Verify Code",
    verifying: "Verifying...",
    setNewPassword: "Set your new password.",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    resetting: "Resetting...",
    updatePassword: "Update Password",
    backToLogin: "Back to Login",
    passwordsDoNotMatch: "Passwords do not match",
    successMessage: "Password reset successfully! You can now log in.",
    goToLogin: "Go to Login",
    userNotFound: "No account found with this phone number.",
    invalidOtp: "Invalid or expired verification code.",
    resetFailed: "Failed to reset password. Please try again.",
    resendCode: "Resend Code",
    resendIn: "Resend in",
    codeResent: "Code resent successfully!",
    back: "Back"
  },
  fr: {
    resetPassword: "Réinitialiser le mot de passe",
    enterPhone: "Entrez votre numéro de téléphone pour recevoir un code de vérification.",
    phoneNumber: "Numéro de téléphone",
    sendCode: "Envoyer le code de vérification",
    sending: "Envoi en cours...",
    enterCode: "Entrez le code de vérification envoyé sur votre téléphone.",
    verificationCode: "Code de vérification",
    verifyCode: "Vérifier le code",
    verifying: "Vérification en cours...",
    setNewPassword: "Définissez votre nouveau mot de passe.",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le nouveau mot de passe",
    resetting: "Réinitialisation...",
    updatePassword: "Mettre à jour le mot de passe",
    backToLogin: "Retour à la connexion",
    passwordsDoNotMatch: "Les mots de passe ne correspondent pas",
    successMessage: "Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.",
    goToLogin: "Aller à la connexion",
    userNotFound: "Aucun compte trouvé avec ce numéro de téléphone.",
    invalidOtp: "Code de vérification invalide ou expiré.",
    resetFailed: "Échec de la réinitialisation du mot de passe. Veuillez réessayer.",
    resendCode: "Renvoyer le code",
    resendIn: "Renvoyer dans",
    codeResent: "Code renvoyé avec succès !",
    back: "Retour"
  }
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1: Phone, 2: OTP, 3: New Password, 4: Success
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pinId, setPinId] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  
  const navigate = useNavigate()
  const { language } = useUiStore()

  React.useEffect(() => {
    let timer
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendTimer])

  React.useEffect(() => {
    document.body.style.backgroundColor = '#121212'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await axios.post('/api/auth/forgot-password/send-otp', { phoneNumber })
      if (response.data.success) {
        setPinId(response.data.pinId)
        setStep(2)
        setResendTimer(60) // 60 second cooldown
        if (step === 2) {
          setSuccess(i18n[language].codeResent)
          setTimeout(() => setSuccess(''), 5000)
        }
      }
    } catch (err) {
      console.error('Send OTP error:', err)
      const serverMsg = err.response?.data?.message
      if (serverMsg === 'User with this phone number not found') {
        setError(i18n[language].userNotFound)
      } else {
        setError(serverMsg || i18n[language].userNotFound)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await axios.post('/api/auth/forgot-password/verify-otp', { 
        pinId, 
        pin: otp 
      })
      if (response.data.success) {
        setStep(3)
      }
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError(i18n[language].invalidOtp)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError(i18n[language].passwordsDoNotMatch)
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await axios.post('/api/auth/reset-password', { 
        phoneNumber, 
        newPassword 
      })
      if (response.data.success) {
        setStep(4)
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError(i18n[language].resetFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>{i18n[language].resetPassword}</h1>
        
        {step === 1 && (
          <>
            <p className={styles.subtitle}>{i18n[language].enterPhone}</p>
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.inputWithIcon}>
                <Phone size={20} className={styles.inputIcon} />
                <input 
                  type="tel" 
                  value={phoneNumber} 
                  onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
                  placeholder={i18n[language].phoneNumber}
                  className={styles.premiumInput}
                  required
                />
              </div>
              <button 
                type="submit" 
                className={`${styles.button} ${loading ? 'btn-loading' : ''}`} 
                disabled={loading}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>{loading ? i18n[language].sending : i18n[language].sendCode}</span>
                  {loading && <div className="mini-spinner"></div>}
                </div>
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className={styles.subtitle}>{i18n[language].enterCode}</p>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.successMessageSmall}>{success}</div>}
            
            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.inputWithIcon}>
                <Hash size={20} className={styles.inputIcon} />
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => { setOtp(e.target.value); setError(''); }}
                  placeholder={i18n[language].verificationCode}
                  className={styles.premiumInput}
                  required
                />
              </div>
              <button 
                type="submit" 
                className={`${styles.button} ${loading ? 'btn-loading' : ''}`} 
                disabled={loading}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>{loading ? i18n[language].verifying : i18n[language].verifyCode}</span>
                  {loading && <div className="mini-spinner"></div>}
                </div>
              </button>

              <div className={styles.resendWrapper}>
                <button 
                  type="button" 
                  className={styles.resendButton} 
                  onClick={handleSendOtp}
                  disabled={loading || resendTimer > 0}
                >
                  {resendTimer > 0 
                    ? `${i18n[language].resendIn} ${resendTimer}s` 
                    : i18n[language].resendCode}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <p className={styles.subtitle}>{i18n[language].setNewPassword}</p>
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.inputWithIcon}>
                <Lock size={20} className={styles.inputIcon} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  placeholder={i18n[language].newPassword}
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

              <div className={styles.inputWithIcon}>
                <Lock size={20} className={styles.inputIcon} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder={i18n[language].confirmPassword}
                  className={styles.premiumInput}
                  required
                />
                <button 
                  type="button" 
                  className={styles.premiumEyeButton} 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              
              <button 
                type="submit" 
                className={`${styles.button} ${loading ? 'btn-loading' : ''}`} 
                disabled={loading}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>{loading ? i18n[language].resetting : i18n[language].updatePassword}</span>
                  {loading && <div className="mini-spinner"></div>}
                </div>
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <div className={styles.success}>
              {i18n[language].successMessage}
            </div>
            <button onClick={() => navigate('/login')} className={styles.button}>
              {i18n[language].goToLogin}
            </button>
          </>
        )}
        
        {step < 4 && (
          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.link} 
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
            >
              <ArrowLeft size={16} />
              {step > 1 ? i18n[language].back : i18n[language].backToLogin}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
