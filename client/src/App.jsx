import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Layout } from './components/Layout/Layout'
import { useUiStore } from './store/uiStore'
import { useUserStore } from './store/userStore'
import i18n from './i18n'
import Home from './pages/Home/Home'
import Profile from './pages/Profile/Profile'
import Analytics from './pages/Analytics/Analytics'
import Onboarding from './pages/Onboarding/Onboarding'
import Login from './pages/Login/Login'
import Scan from './pages/Scan/Scan'
import Welcome from './pages/Welcome/Welcome'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Timetable from './pages/Timetable/Timetable'
import Activity from './pages/Activity/Activity'
import WellnessTips from './pages/WellnessTips/WellnessTips'
import SavedTips from './pages/SavedTips/SavedTips'



// Auth wrapper component
const AuthGate = ({ children, publicOnly = false }) => {
  const { user, setUser } = useUserStore()
  const [checking, setChecking] = useState(!user)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        setChecking(false)
        return
      }
      
      try {
        const response = await axios.get('/api/auth/me', { withCredentials: true })
        if (response.data.success) {
          setUser(response.data.data)
        }
      } catch (err) {
        // Not logged in
      } finally {
        setChecking(false)
      }
    }
    
    checkAuth()
  }, [user, setUser])

  if (checking) {
    return <div style={{ backgroundColor: '#121212', height: '100vh' }}></div>
  }

  // Remove the auto-redirect to home for public pages so user always sees them if they visit the URL
  // if (publicOnly && user) {
  //   return <Navigate to="/home" replace />
  // }

  if (!publicOnly && !user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const language = useUiStore((state) => state.language)
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        {/* Entry point is now always Welcome */}
        <Route path="/" element={<Welcome />} />
        
        <Route path="/create-account" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Private Routes (now moved to specific paths) */}
        <Route path="/home" element={
          <AuthGate>
            <Layout><Home /></Layout>
          </AuthGate>
        } />
        
        <Route path="/timetable" element={
          <AuthGate>
            <Layout><Timetable /></Layout>
          </AuthGate>
        } />

        <Route path="/scan" element={
          <AuthGate>
            <Layout><Scan /></Layout>
          </AuthGate>
        } />
        
        <Route path="/analytics" element={
          <AuthGate>
            <Layout><Analytics /></Layout>
          </AuthGate>
        } />
        
        <Route path="/wellness-tips" element={
          <AuthGate>
            <Layout><WellnessTips /></Layout>
          </AuthGate>
        } />

        <Route path="/saved-tips" element={
          <AuthGate>
            <Layout><SavedTips /></Layout>
          </AuthGate>
        } />
        
        <Route path="/activity" element={
          <AuthGate>
            <Layout><Activity /></Layout>
          </AuthGate>
        } />
        
        <Route path="/profile" element={
          <AuthGate>
            <Layout><Profile /></Layout>
          </AuthGate>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
