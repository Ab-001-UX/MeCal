import React from 'react'
import styles from './ProfileSkeleton.module.css'

export default function ProfileSkeleton() {
  return (
    <div className={styles.container}>
      {/* Header with avatar & name */}
      <div className={styles.header}>
        <div className={`${styles.skeletonBase} ${styles.skeletonAvatar}`} />
        <div className={`${styles.skeletonBase} ${styles.skeletonName}`} />
      </div>

      {/* Stats grid (3 cards) */}
      <div className={styles.statsGrid}>
        <div className={`${styles.skeletonBase} ${styles.skeletonStatCard}`} />
        <div className={`${styles.skeletonBase} ${styles.skeletonStatCard}`} />
        <div className={`${styles.skeletonBase} ${styles.skeletonStatCard}`} />
      </div>

      {/* Daily Targets section */}
      <div className={styles.section}>
        <div className={`${styles.skeletonBase} ${styles.skeletonSectionTitle}`} />
        <div className={styles.skeletonDetailItem}>
          <div className={`${styles.skeletonBase} ${styles.skeletonLabel}`} />
          <div className={`${styles.skeletonBase} ${styles.skeletonValue}`} />
        </div>
        <div className={styles.skeletonDetailItem}>
          <div className={`${styles.skeletonBase} ${styles.skeletonLabel}`} />
          <div className={`${styles.skeletonBase} ${styles.skeletonValue}`} />
        </div>
        <div className={styles.skeletonDetailItem}>
          <div className={`${styles.skeletonBase} ${styles.skeletonLabel}`} />
          <div className={`${styles.skeletonBase} ${styles.skeletonValue}`} />
        </div>
      </div>

      {/* Goals & Preferences section */}
      <div className={styles.section}>
        <div className={`${styles.skeletonBase} ${styles.skeletonSectionTitle}`} />
        <div className={styles.skeletonDetailItem}>
          <div className={`${styles.skeletonBase} ${styles.skeletonLabel}`} />
          <div className={`${styles.skeletonBase} ${styles.skeletonValue}`} />
        </div>
        <div className={styles.skeletonDetailItem}>
          <div className={`${styles.skeletonBase} ${styles.skeletonLabel}`} />
          <div className={`${styles.skeletonBase} ${styles.skeletonValue}`} />
        </div>
        <div className={styles.skeletonDetailItem}>
          <div className={`${styles.skeletonBase} ${styles.skeletonLabel}`} />
          <div className={`${styles.skeletonBase} ${styles.skeletonValue}`} />
        </div>
      </div>

      {/* Actions (Buttons) */}
      <div className={styles.actions}>
        <div className={`${styles.skeletonBase} ${styles.skeletonButton}`} />
        <div className={`${styles.skeletonBase} ${styles.skeletonButton}`} />
      </div>
    </div>
  )
}
