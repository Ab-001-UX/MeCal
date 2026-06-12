import axios from 'axios'

const api = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  config.headers['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
  config.headers['x-timezone-offset'] = new Date().getTimezoneOffset()
  return config
})

export default api
