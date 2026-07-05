import { create } from 'zustand'

/**
 * Theme store — manages dark/light mode.
 * Persists preference to localStorage.
 * Applies 'light' class to <html> element (dark is default).
 */
export const useThemeStore = create((set) => {
  // Initialize from localStorage or default to 'dark'
  const stored = localStorage.getItem('sync-board-theme')
  const initialTheme = stored || 'dark'

  // Apply theme class on load
  if (initialTheme === 'light') {
    document.documentElement.classList.add('light')
  } else {
    document.documentElement.classList.remove('light')
  }

  return {
    theme: initialTheme,

    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark'
        localStorage.setItem('sync-board-theme', newTheme)

        if (newTheme === 'light') {
          document.documentElement.classList.add('light')
        } else {
          document.documentElement.classList.remove('light')
        }

        return { theme: newTheme }
      }),

    setTheme: (theme) =>
      set(() => {
        localStorage.setItem('sync-board-theme', theme)

        if (theme === 'light') {
          document.documentElement.classList.add('light')
        } else {
          document.documentElement.classList.remove('light')
        }

        return { theme }
      }),
  }
})
