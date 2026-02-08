import { useEffect } from 'react'
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../lib/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
  error: string | null
}

interface AuthActions {
  setUser: (user: User | null) => Promise<void>
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
}

const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timerId: ReturnType<typeof setTimeout> | null = null

  const timeout = new Promise<never>((_resolve, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), ms)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timerId) {
      clearTimeout(timerId)
    }
  }
}

const fetchRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()

  if (error) {
    console.warn('Unable to fetch role', error.message)
    return null
  }

  return (data?.role as UserRole | undefined) ?? null
}

const upsertProfile = async (userId: string, email: string, fullName: string, role: UserRole) => {
  const { error } = await supabase.from('users').upsert({
    id: userId,
    email,
    full_name: fullName,
    role,
  })

  if (error) {
    console.warn('Unable to create profile', error.message)
  }
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  role: null,
  loading: true,
  error: null,
  setUser: async (user) => {
    if (!user) {
      set({ user: null, role: null, error: null })
      return
    }

    set({ user, error: null })

    try {
      const role = await withTimeout(fetchRole(user.id), 2000, 'Role lookup timed out')
      set({ role, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load user profile'
      set({ role: null, error: message })
    } finally {
      // Loading state is controlled by session fetch, not role lookup.
    }
  },
  setLoading: (loading) => set({ loading }),
  signIn: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    await useAuthStore.getState().setUser(data.user)
    set({ loading: false })
  },
  signUp: async (email, password, fullName, role) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    if (data.user) {
      await upsertProfile(data.user.id, email, fullName, role)
      await useAuthStore.getState().setUser(data.user)
    }
    set({ loading: false })
  },
  signOut: async () => {
    set({ loading: true, error: null })
    await supabase.auth.signOut()
    set({ user: null, role: null, loading: false, error: null })
  },
}))

export const useAuth = () => useAuthStore()

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (isMounted) {
        await setUser(data.session?.user ?? null)
        setLoading(false)
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [setUser])

  return <>{children}</>
}
