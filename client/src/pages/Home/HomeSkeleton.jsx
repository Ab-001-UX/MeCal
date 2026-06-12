import React from 'react'
import styles from './HomeSkeleton.module.css'

export default function HomeSkeleton() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.skeletonH1} />
          <div className={styles.skeletonSub} />
        </div>
        <div className={styles.skeletonAvatar} />
      </div>

      {/* Day strip */}
      <div className={styles.dayStrip}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.skeletonDayItem} />
        ))}
      </div>

      {/* Section title */}
      <div className={styles.skeletonTitle} />

      {/* Nutrition card */}
      <div className={styles.skeletonCard} />

      {/* Section title */}
      <div className={styles.skeletonTitle} />

      {/* Meal timetable horizontal strip */}
      <div className={styles.horizontalStrip}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.skeletonMealCard} />
        ))}
      </div>

      {/* Section title */}
      <div className={styles.skeletonTitle} />

      {/* Water card */}
      <div className={styles.skeletonWaterCard} />
    </div>
  )
}
