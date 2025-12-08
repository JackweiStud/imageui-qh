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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setIsLoading(false)

                // Close modal on successful sign in
                if (event === 'SIGNED_IN') {
                    setIsAuthModalOpen(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    const signInWithGithub = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
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
            closeAuthModal
        }}>
            {children}
            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
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
