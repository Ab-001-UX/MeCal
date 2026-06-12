import api from './api.js'

export const getTodayMeals = () => api.get('/api/meal/today')
export const getRecommendations = (lang) => api.get('/api/meal/recommendations', { params: { lang } })
export const logMeal = (data) => api.post('/api/meal/log', data)
export const scanMeal = (image) => api.post('/api/meal/scan', { image })
export const scanBarcode = (barcode) => api.post('/api/meal/barcode', { barcode })
export const logManualMeal = (data) => api.post('/api/meal/manual', data)
export const getSavedMeals = () => api.get('/api/meal/saved')
export const saveMealToLibrary = (data) => api.post('/api/meal/saved', data)
export const removeSavedMeal = (id) => api.delete(`/api/meal/saved/${id}`)
