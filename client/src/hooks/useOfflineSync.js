import { useEffect, useState, useCallback } from 'react'
import { getQueueCount, processQueue } from '../utils/syncQueue.js'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshCount = useCallback(async () => {
    try {
      setPendingCount(await getQueueCount())
    } catch {
      setPendingCount(0)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    try {
      const remaining = await processQueue()
      setPendingCount(remaining)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    refreshCount()

    const handleOnline = () => {
      setIsOnline(true)
      syncNow()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshCount, syncNow])

  const status = isSyncing ? 'syncing' : !isOnline ? 'offline' : pendingCount > 0 ? 'pending' : 'online'

  return { isOnline, pendingCount, isSyncing, status, refreshCount, syncNow }
}
