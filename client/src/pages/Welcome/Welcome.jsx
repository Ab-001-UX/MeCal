import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import styles from './Welcome.module.css'
import { useUiStore } from '../../store/uiStore'

const i18n = {
  en: {
    subtitle: "Your Personalized Wellness Companion, powered by AI",
    getStarted: "Get Started",
    alreadyHaveAccount: "Already have an account?",
    logIn: "Log in"
  },
  fr: {
    subtitle: "Votre compagnon de bien-être personnalisé, propulsé par l'IA",
    getStarted: "Commencer",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    logIn: "Se connecter"
  }
}

export default function Welcome() {
  const navigate = useNavigate()
  const { language, setLanguage } = useUiStore()
  
  const images = [
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_1.png',
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_2.png',
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_3.png',
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_4.png',
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_5.png',
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_6.png',
    '/630b128e-4649-452e-93df-7e50d4d23ef6 copy 3/story_1.png'
  ]
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)



  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentImageIndex((prev) => prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    if (currentImageIndex === images.length - 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentImageIndex(0)
      }, 800)
    }
  }, [currentImageIndex, images.length])

  return (
    <div className={styles.container}>
      <div 
        className={styles.slideshow}
        style={{ 
          transform: `translateX(-${currentImageIndex * 100}%)`,
          transition: isTransitioning ? 'transform 0.8s ease-in-out' : 'none'
        }}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className={styles.slide}
            style={{ backgroundImage: `url("${image}")` }}
          />
        ))}
      </div>


      
      <div className={styles.overlay}>
        {/* Language Dropdown */}
        <div className={styles.langToggleWrapper}>
          <select 
            className={styles.langSelect} 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>

        <div className={styles.content}>
          <div className={styles.textWrapper}>
            <h1 className={styles.title}>MeCal</h1>
            <p className={styles.subtitle}>{i18n[language].subtitle}</p>
          </div>

          {/* Carousel Dots */}
          <div className={styles.dotsWrapper}>
            {images.slice(0, 6).map((_, index) => (
              <div 
                key={index}
                className={`${styles.dot} ${index === (currentImageIndex % 6) ? styles.activeDot : ''}`}
              />
            ))}
          </div>

          <div className={styles.ctaWrapper}>
            <button 
              className={styles.fullCtaBtn}
              onClick={() => {
                localStorage.removeItem('onboardingStep');
                localStorage.removeItem('onboardingData');
                localStorage.removeItem('onboardingTimestamp');
                navigate('/create-account');
              }}
            >
              {i18n[language].getStarted}
            </button>
            
            <div className={styles.loginText}>
              {i18n[language].alreadyHaveAccount} <Link to="/login" className={styles.link}>{i18n[language].logIn}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
