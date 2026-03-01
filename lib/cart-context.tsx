"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import type { Product } from "./products"
import { useAuth } from "./auth-context"

interface CartItem extends Product {
  quantity: number // cart quantity (overrides Product.quantity which is stock)
  stock?: number   // snapshot of the product's stock at time of add
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const STORAGE_KEY = "ac_beauty_cart"

const CartContext = createContext<CartContextType | null>(null)

// Merge two carts: union of items, sum quantities for same product
function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>()
  for (const item of remote) {
    map.set(item.id, { ...item })
  }
  for (const item of local) {
    if (map.has(item.id)) {
      const existing = map.get(item.id)!
      existing.quantity = Math.max(existing.quantity, item.quantity)
    } else {
      map.set(item.id, { ...item })
    }
  }
  return Array.from(map.values())
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const { user } = useAuth()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const skipNextSync = useRef(false)

  // Load from sessionStorage AFTER mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // On sign-in: merge local cart with Firestore cart
  useEffect(() => {
    if (!hydrated || !user) return
    async function syncFromFirestore() {
      try {
        const { db } = await import("@/lib/firebase")
        const { doc, getDoc } = await import("firebase/firestore")
        const cartRef = doc(db, "users", user!.uid, "cart", "current")
        const snap = await getDoc(cartRef)
        if (snap.exists()) {
          const remoteItems = (snap.data().items || []) as CartItem[]
          setItems((localItems) => {
            const merged = mergeCarts(localItems, remoteItems)
            // Save merged to sessionStorage
            try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch { /* ignore */ }
            return merged
          })
        }
      } catch (err) {
        console.error("Failed to load cart from Firestore:", err)
      }
    }
    syncFromFirestore()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hydrated])

  // Save to sessionStorage whenever items change (only after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items, hydrated])

  // Debounced save to Firestore when signed in
  useEffect(() => {
    if (!hydrated || !user) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const { db } = await import("@/lib/firebase")
        const { doc, setDoc } = await import("firebase/firestore")
        const cartRef = doc(db, "users", user.uid, "cart", "current")
        await setDoc(cartRef, { items, updatedAt: new Date().toISOString() })
      } catch (err) {
        console.error("Failed to save cart to Firestore:", err)
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hydrated, user])

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      const currentQty = existing ? existing.quantity : 0
      const stock = product.quantity // product.quantity = stock count
      // Block if stock is defined and would be exceeded
      if (stock !== undefined && stock !== null && currentQty + 1 > stock) {
        return prev // don't add, already at max
      }
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1, stock: product.quantity }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item
        const maxQty = item.stock !== undefined && item.stock !== null ? Math.min(quantity, item.stock) : quantity
        return { ...item, quantity: maxQty }
      })
    )
  }, [])

  const clearCart = useCallback(async () => {
    setItems([])
    skipNextSync.current = true
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    // Also clear in Firestore
    if (user) {
      try {
        const { db } = await import("@/lib/firebase")
        const { doc, deleteDoc } = await import("firebase/firestore")
        await deleteDoc(doc(db, "users", user.uid, "cart", "current"))
      } catch {
        // ignore
      }
    }
  }, [user])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
