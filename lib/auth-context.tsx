"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

const ADMIN_EMAILS = ["ac.swimwear876@gmail.com", "melly.cole1@gmail.com"]

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
})

async function saveUserToFirestore(u: User) {
  try {
    await setDoc(
      doc(db, "users", u.uid),
      {
        uid: u.uid,
        email: u.email || "",
        displayName: u.displayName || "",
        photoURL: u.photoURL || "",
        lastSignIn: serverTimestamp(),
      },
      { merge: true }
    )
  } catch (err) {
    console.error("Failed to save user to Firebase:", err)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (u) saveUserToFirestore(u)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === "auth/popup-closed-by-user") return
      console.error("[v0] Google sign-in error:", error.code, error.message)
      throw err
    }
  }

  const signInWithApple = async () => {
    try {
      const provider = new OAuthProvider("apple.com")
      provider.addScope("email")
      provider.addScope("name")
      await signInWithPopup(auth, provider)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === "auth/popup-closed-by-user") return
      console.error("[v0] Apple sign-in error:", error.code, error.message)
      throw err
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, signInWithGoogle, signInWithApple, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
