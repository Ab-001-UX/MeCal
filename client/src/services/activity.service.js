import api from './api.js'

export const getTodayActivities = () => api.get('/api/activity/today')
export const logActivity = (data) => api.post('/api/activity/log', data)
export const logStepGoalReport = (hit) => api.post('/api/activity/step-report', { hit })
