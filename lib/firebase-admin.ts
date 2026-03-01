import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]

  // Try service account JSON first, then fall back to project ID only
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount) as ServiceAccount
      return initializeApp({ credential: cert(parsed) })
    } catch {
      // fall through
    }
  }

  // Minimal init with just project ID (works in some environments)
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const adminApp = getAdminApp()
export const adminDb = getFirestore(adminApp)
