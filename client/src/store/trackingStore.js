import { create } from 'zustand'

export const useTrackingStore = create((set) => ({
  meals: [],
  hydration: 0, // Number of cups or bottles consumed today
  stepsReported: null, // null, 'yes', 'no'
  
  // Cache for daily data to avoid skeleton loader flashing
  water: 0,
  stepGoalHit: null,
  todaySteps: 0,
  todayActiveCal: 0,
  todayActiveMinutes: 0,
  aiMealPlan: null,
  lastFetchedDate: null, // YYYY-MM-DD representation of the date fetched

  setMeals: (meals) => set((state) => ({ meals: typeof meals === 'function' ? meals(state.meals) : meals })),
  
  addMeal: (meal) => set((state) => ({ 
    meals: [...state.meals, meal] 
  })),
  
  setHydration: (count) => set({ hydration: count }),
  
  incrementHydration: () => set((state) => ({ 
    hydration: state.hydration + 1 
  })),
  
  decrementHydration: () => set((state) => ({ 
    hydration: Math.max(0, state.hydration - 1) 
  })),
  
  setStepsReported: (status) => set({ stepsReported: status }),

  // Setters for daily cache
  setWater: (water) => set((state) => ({ water: typeof water === 'function' ? water(state.water) : water })),
  setStepGoalHit: (stepGoalHit) => set((state) => ({ stepGoalHit: typeof stepGoalHit === 'function' ? stepGoalHit(state.stepGoalHit) : stepGoalHit })),
  setTodaySteps: (todaySteps) => set((state) => ({ todaySteps: typeof todaySteps === 'function' ? todaySteps(state.todaySteps) : todaySteps })),
  setTodayActiveCal: (todayActiveCal) => set((state) => ({ todayActiveCal: typeof todayActiveCal === 'function' ? todayActiveCal(state.todayActiveCal) : todayActiveCal })),
  setTodayActiveMinutes: (todayActiveMinutes) => set((state) => ({ todayActiveMinutes: typeof todayActiveMinutes === 'function' ? todayActiveMinutes(state.todayActiveMinutes) : todayActiveMinutes })),
  setAiMealPlan: (aiMealPlan) => set((state) => ({ aiMealPlan: typeof aiMealPlan === 'function' ? aiMealPlan(state.aiMealPlan) : aiMealPlan })),
  setLastFetchedDate: (lastFetchedDate) => set({ lastFetchedDate }),

  clearTrackingData: () => set({
    meals: [],
    hydration: 0,
    stepsReported: null,
    water: 0,
    stepGoalHit: null,
    todaySteps: 0,
    todayActiveCal: 0,
    todayActiveMinutes: 0,
    aiMealPlan: null,
    lastFetchedDate: null
  })
}))
