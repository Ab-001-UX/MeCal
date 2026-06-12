import React from 'react'
import { useTranslation } from 'react-i18next'
import { useOfflineSync } from '../../hooks/useOfflineSync.js'
import styles from './SyncStatus.module.css'

export function SyncStatus() {
  const { t } = useTranslation()
  const { status, pendingCount } = useOfflineSync()

  if (status === 'online') return null

  const labels = {
    offline: t('sync.offline'),
    pending: t('sync.pending', { count: pendingCount }),
    syncing: t('sync.syncing')
  }

  const handleClear = async (e) => {
    e.stopPropagation()
    const { clearQueue } = await import('../../utils/syncQueue.js')
    await clearQueue()
    window.location.reload()
  }

  return (
    <div className={`${styles.banner} ${styles[status]}`} role="status">
      <span>{labels[status]}</span>
      {status === 'pending' && (
        <button 
          onClick={handleClear} 
          className={styles.clearBtn}
          title={t('sync.clearTitle')}
        >
          ✕ {t('sync.clearText')}
        </button>
      )}
    </div>
  )
}
