import api from './api.js'

export const getWellnessSummary = (profile, lang) =>
  api.post('/api/auth/wellness-summary', { ...profile, lang })

export const onboardUser = (data) =>
  api.post('/api/auth/onboard', data)

export const checkPhone = (phoneNumber) =>
  api.post('/api/auth/check-phone', { phoneNumber })

export const updateProfile = (data) =>
  api.patch('/api/auth/me', data)
