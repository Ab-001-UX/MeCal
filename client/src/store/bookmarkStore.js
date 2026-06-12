import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useBookmarkStore = create(
  persist(
    (set, get) => ({
      bookmarks: [], // array of tip IDs

      toggle: (id) => {
        const current = get().bookmarks
        if (current.includes(id)) {
          set({ bookmarks: current.filter((b) => b !== id) })
        } else {
          set({ bookmarks: [...current, id] })
        }
      },

      isBookmarked: (id) => get().bookmarks.includes(id),

      getBookmarkedIds: () => get().bookmarks,
    }),
    {
      name: 'mecal-bookmarks', // localStorage key
    }
  )
)
