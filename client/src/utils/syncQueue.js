const DB_NAME = 'mecal-offline'
const STORE = 'sync_queue'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addToQueue(item) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add({ ...item, timestamp: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueue() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function removeFromQueue(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueueCount() {
  const items = await getQueue()
  return items.length
}

const EXECUTORS = {
  LOG_WATER: async (payload) => {
    const { logWater } = await import('../services/water.service.js')
    await logWater(payload.amount)
  },
  LOG_MEAL: async (payload) => {
    const { logMeal } = await import('../services/meal.service.js')
    await logMeal(payload)
  },
  LOG_MANUAL_MEAL: async (payload) => {
    const { logManualMeal } = await import('../services/meal.service.js')
    await logManualMeal(payload)
  },
  LOG_ACTIVITY: async (payload) => {
    const { logActivity } = await import('../services/activity.service.js')
    await logActivity(payload)
  },
  STEP_REPORT: async (payload) => {
    const { logStepGoalReport } = await import('../services/activity.service.js')
    await logStepGoalReport(payload.hit)
  }
}

export async function processQueue() {
  const items = await getQueue()
  for (const item of items.sort((a, b) => a.id - b.id)) {
    const executor = EXECUTORS[item.actionType]
    if (!executor) {
      await removeFromQueue(item.id)
      continue
    }
    try {
      await executor(item.payload)
      await removeFromQueue(item.id)
    } catch {
      break
    }
  }
  return getQueueCount()
}

export async function queueOrExecute(actionType, payload, onOptimistic) {
  if (navigator.onLine) {
    try {
      const executor = EXECUTORS[actionType]
      if (executor) await executor(payload)
      if (onOptimistic) onOptimistic()
      return { synced: true, queued: false }
    } catch {
      // fall through to queue
    }
  }

  if (onOptimistic) onOptimistic()
  await addToQueue({ actionType, payload })
  return { synced: false, queued: true }
}

export async function clearQueue() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
