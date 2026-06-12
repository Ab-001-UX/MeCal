import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Layout.module.css'
import { Home, Camera, BarChart2, User } from 'lucide-react'
import { SyncStatus } from '../SyncStatus/SyncStatus.jsx'

export function Layout({ children }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isAuthPage = location.pathname === '/create-account' || location.pathname === '/login'

  return (
    <div className={styles.wrapper}>
      <SyncStatus />
      <main className={styles.main}>
        {children}
      </main>
      
      {!isAuthPage && (
        <nav className={styles.nav}>
          <NavLink to="/home" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Home size={20} />
            <span className={styles.navLabel}>{t('nav.home')}</span>
          </NavLink>
          <NavLink to="/scan" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Camera size={20} />
            <span className={styles.navLabel}>{t('nav.scan')}</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <BarChart2 size={20} />
            <span className={styles.navLabel}>{t('nav.history')}</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <User size={20} />
            <span className={styles.navLabel}>{t('nav.profile')}</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
