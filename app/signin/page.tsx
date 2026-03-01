"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"
import { Loader2 } from "lucide-react"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <SignInContent />
    </Suspense>
  )
}

function SignInContent() {
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push(redirect)
    }
  }, [user, loading, redirect, router])

  const handleGoogle = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const e = err as { code?: string }
      if (e.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for sign-in. Please add it to your Firebase Console under Authentication > Settings > Authorized domains.")
      } else if (e.code === "auth/configuration-not-found" || e.code === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled. Please enable it in Firebase Console under Authentication > Sign-in method.")
      } else {
        setError("Sign-in failed. Please try again.")
      }
    } finally {
      setSigningIn(false)
    }
  }

  const handleApple = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithApple()
    } catch (err: unknown) {
      const e = err as { code?: string }
      if (e.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for sign-in. Please add it to your Firebase Console under Authentication > Settings > Authorized domains.")
      } else if (e.code === "auth/operation-not-allowed") {
        setError("Apple sign-in is not enabled. Please enable it in Firebase Console under Authentication > Sign-in method.")
      } else {
        setError("Sign-in failed. Please try again.")
      }
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo + header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-border/40">
              <Image
                src="/images/logo.jpeg"
                alt="AC BEAUTY ENGINE 876"
                width={80}
                height={80}
                className="object-cover"
              />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Welcome</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to place orders and track your purchases
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Sign-in buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogle}
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-3 border border-border bg-background px-6 py-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <GoogleIcon className="h-5 w-5" />
              {signingIn ? "Signing in..." : "Continue with Google"}
            </button>

            <button
              onClick={handleApple}
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-3 border border-foreground bg-foreground px-6 py-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
            >
              <AppleIcon className="h-5 w-5" />
              {signingIn ? "Signing in..." : "Continue with Apple"}
            </button>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
            By signing in, you agree to our terms. Your information is used only for order processing.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
