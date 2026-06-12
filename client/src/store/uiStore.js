import { create } from 'zustand'

export const useUiStore = create((set) => ({
  isLoading: false,
  error: null,
  successMessage: null,
  language: localStorage.getItem('mecal_language') || 'en',
  theme: (() => {
    const t = localStorage.getItem('mecal_theme') || 'light'
    document.documentElement.setAttribute('data-theme', t)
    return t
  })(),
  
  setLoading: (status) => set({ isLoading: status }),
  setLanguage: (lang) => {
    localStorage.setItem('mecal_language', lang)
    set({ language: lang })
  },
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('mecal_theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    return { theme: nextTheme }
  }),
  
  setError: (message) => set({ error: message }),
  
  clearError: () => set({ error: null }),
  
  setSuccess: (message) => set({ successMessage: message }),
  
  clearSuccess: () => set({ successMessage: null })
}))
