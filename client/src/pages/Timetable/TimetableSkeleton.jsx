import React from 'react'
import styles from './TimetableSkeleton.module.css'

export default function TimetableSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.skeletonCircle}></div>
        <div className={styles.headerInfo}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonSubtitle}></div>
        </div>
      </div>

      <div className={styles.parameterRow}>
        <div className={styles.skeletonChip}></div>
        <div className={styles.skeletonChip}></div>
        <div className={styles.skeletonChip}></div>
        <div className={styles.skeletonChip}></div>
      </div>

      <div className={styles.timeline}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.timelineSlot}>
            <div className={styles.timelineDotCol}>
              <div className={styles.skeletonDot}></div>
              {i < 3 && <div className={styles.timelineLine}></div>}
            </div>
            <div className={styles.timelineCard}>
              <div className={styles.timelineCardTop}>
                <div className={styles.skeletonImg}></div>
                <div className={styles.timelineCardInfo}>
                  <div className={styles.skeletonMeta}></div>
                  <div className={styles.skeletonTextLine}></div>
                  <div className={styles.skeletonTextLineShort}></div>
                </div>
              </div>
              <div className={styles.timelineNutrients}>
                <div className={styles.skeletonNutrientChip}></div>
                <div className={styles.skeletonNutrientChip}></div>
                <div className={styles.skeletonNutrientChip}></div>
                <div className={styles.skeletonNutrientChip}></div>
              </div>
              <div className={styles.skeletonBtn}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
