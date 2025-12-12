'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

import { AuthModal } from './AuthModal'

type AuthContextType = {
    user: User | null
    session: Session | null
    isLoading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithGithub: () => Promise<void>
    signOut: () => Promise<void>
    openAuthModal: () => void
    closeAuthModal: () => void
    credits: number
    refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [credits, setCredits] = useState<number>(0)
    const supabase = createClient()

    const fetchCredits = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

        if (data) {
            setCredits(data.credits ?? 0)
        }
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    fetchCredits(session.user.id)
                } else {
                    setCredits(0)
                }

                setIsLoading(false)

                // Close modal on successful sign in
                if (event === 'SIGNED_IN') {
                    setIsAuthModalOpen(false)

                    // 登录成功后自动同步云端历史记录（静默执行）
                    try {
                        const { syncFromCloud } = await import('@/lib/historyService')
                        const result = await syncFromCloud()
                        if (result.added > 0) {
                            console.log(`[Auto Sync] Synced ${result.added} records on login`)
                        }
                    } catch (error) {
                        // 静默失败，不打扰用户
                        console.warn('[Auto Sync] Failed to sync on login:', error)
                    }
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // Check for Auth Errors in URL (e.g. from OAuth callback)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const error = params.get('error')
        const errorDescription = params.get('error_description')
        if (error || errorDescription) {
            setAuthError(errorDescription || error)
            setIsAuthModalOpen(true)
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [])

    // Check Env Vars
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase Environment Variables!')
            setAuthError('Configuration Error: Missing Supabase Keys')
        }
    }, [])

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }

    const signInWithGithub = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const openAuthModal = () => setIsAuthModalOpen(true)
    const closeAuthModal = () => setIsAuthModalOpen(false)

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isLoading,
            signInWithGoogle,
            signInWithGithub,
            signOut,
            openAuthModal,
            closeAuthModal,
            credits,
            refreshCredits: async () => {
                if (user) await fetchCredits(user.id)
            }
        }}>
            {children}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => {
                    closeAuthModal()
                    setAuthError(null)
                }}
                initialError={authError}
            />
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
