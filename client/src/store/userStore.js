import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: null,
  onboardingData: {
    name: '',
    phoneNumber: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    unitPreference: 'kg',
    goal: '',
    timeline: '',
    country: '',
    tribe: '',
    lifestyle: '',
    budget: '',
    foodAvailability: '',
    activityLevel: '',
    waterPreference: 'sachet'
  },
  
  setUser: (user) => set({ user }),
  
  updateOnboardingData: (data) => set((state) => ({ 
    onboardingData: { ...state.onboardingData, ...data } 
  })),
  
  clearOnboardingData: () => set({ 
    onboardingData: {
      name: '', phoneNumber: '', password: '', age: '', height: '', weight: '', unitPreference: 'kg',
      goal: '', timeline: '', country: '', tribe: '', lifestyle: '',
      budget: '', foodAvailability: '', activityLevel: '', waterPreference: 'sachet'
    }
  })
}))
