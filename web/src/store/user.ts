import { create } from 'zustand'

interface UserState {
  user: { id: string; name: string; email: string } | null
  token: string | null
  setUser: (user: UserState['user']) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
