import api from './api.js'

export const getTodayWater = () => api.get('/api/water/today')
export const logWater = (amount) => api.post('/api/water/log', { amount })
