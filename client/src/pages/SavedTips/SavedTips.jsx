import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, BookmarkX } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useBookmarkStore } from '../../store/bookmarkStore'
import { ALL_TIPS } from '../WellnessTips/WellnessTips'
import styles from './SavedTips.module.css'

export default function SavedTips() {
  const navigate = useNavigate()
  const { language } = useUiStore()
  const { toggle, isBookmarked, getBookmarkedIds } = useBookmarkStore()
  const [expandedTip, setExpandedTip] = useState(null)

  const currentCulture = language === 'fr' ? 'fr' : 'en'

  // Filter all tips to only bookmarked ones
  const savedTips = ALL_TIPS.filter((tip) => isBookmarked(tip.id))

  const toggleExpand = (id, e) => {
    if (e.target.closest('button')) return
    setExpandedTip(expandedTip === id ? null : id)
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => navigate('/wellness-tips')} className={styles.backBtn} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {currentCulture === 'fr' ? 'Articles sauvegardés' : 'Saved Articles'}
          </h1>
          <p className={styles.subtitle}>
            {savedTips.length > 0
              ? (currentCulture === 'fr'
                  ? `${savedTips.length} article${savedTips.length > 1 ? 's' : ''} sauvegardé${savedTips.length > 1 ? 's' : ''}`
                  : `${savedTips.length} article${savedTips.length > 1 ? 's' : ''} saved`)
              : (currentCulture === 'fr' ? 'Aucun article sauvegardé' : 'Nothing saved yet')}
          </p>
        </div>
      </header>

      {/* Empty state */}
      {savedTips.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Bookmark size={40} strokeWidth={1.5} />
          </div>
          <h2 className={styles.emptyTitle}>
            {currentCulture === 'fr' ? 'Aucun article sauvegardé' : 'No saved articles yet'}
          </h2>
          <p className={styles.emptyDesc}>
            {currentCulture === 'fr'
              ? 'Appuyez sur l\'icône marque-page dans un article pour le sauvegarder ici. Vos sauvegardes ne disparaissent jamais.'
              : 'Tap the bookmark icon on any article to save it here. Your bookmarks never disappear.'}
          </p>
          <button className={styles.browseBtn} onClick={() => navigate('/wellness-tips')}>
            {currentCulture === 'fr' ? 'Parcourir les articles' : 'Browse articles'}
          </button>
        </div>
      )}

      {/* Saved articles list */}
      {savedTips.length > 0 && (
        <div className={styles.tipsList}>
          {savedTips.map((tip) => {
            const content = tip[currentCulture]
            const isExpanded = expandedTip === tip.id

            return (
              <div
                key={tip.id}
                className={`${styles.mediaCard} ${isExpanded ? styles.expandedMediaCard : ''}`}
                onClick={(e) => toggleExpand(tip.id, e)}
              >
                {/* Image */}
                <div className={styles.mediaImageContainer}>
                  <img
                    src={tip.image}
                    alt={content.title}
                    className={styles.mediaImage}
                    loading="lazy"
                  />
                  <div className={styles.imageGradient} />

                  {/* Un-bookmark button */}
                  <button
                    className={styles.bookmarkBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(tip.id)
                    }}
                    aria-label="Remove bookmark"
                    title={currentCulture === 'fr' ? 'Retirer la sauvegarde' : 'Remove bookmark'}
                  >
                    <BookmarkX size={17} />
                  </button>

                  {/* Category badge */}
                  <span className={`${styles.catBadge} ${tip.category === 'hydration' ? styles.catHydration : styles.catDiet}`}>
                    {tip.category === 'hydration'
                      ? (currentCulture === 'fr' ? 'Hydratation' : 'Hydration')
                      : (currentCulture === 'fr' ? 'Nutrition' : 'Nutrition')}
                  </span>
                </div>

                {/* Content */}
                <div className={styles.mediaCardContent}>
                  <h3 className={styles.mediaCardTitle}>{content.title}</h3>
                  <p className={styles.mediaCardSummary}>{content.summary}</p>

                  {isExpanded && (
                    <div className={styles.expandedTextWrapper}>
                      <p className={styles.fullMediaText}>{content.text}</p>
                    </div>
                  )}

                  <span className={styles.readMoreTag}>
                    {isExpanded
                      ? (currentCulture === 'fr' ? '▲ Réduire' : '▲ Show less')
                      : (currentCulture === 'fr' ? '▼ Lire la suite' : '▼ Read more')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
