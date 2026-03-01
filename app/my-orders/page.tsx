"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { Package, ChevronDown, ChevronUp, Star, Loader2, ArrowRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  receiptNumber: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryMethod: string
  paymentMethod: string
  status: string
  createdAt: { toDate?: () => Date } | string
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-600 bg-blue-50 border-blue-200" },
  processing: { label: "Processing", icon: Package, color: "text-purple-600 bg-purple-50 border-purple-200" },
  shipped: { label: "Shipped", icon: Truck, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
}

function formatDate(ts: { toDate?: () => Date } | string): string {
  if (!ts) return ""
  try {
    const date = typeof ts === "string" ? new Date(ts) : ts.toDate ? ts.toDate() : new Date()
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return ""
  }
}

function deliveryLabel(method: string): string {
  const map: Record<string, string> = {
    knutsford: "Knutsford Express",
    zipmail: "Zip Mail",
    inperson: "In Person",
    taximan: "Taxi Man",
  }
  return map[method] || method
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/my-orders")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user?.email) return

    async function fetchOrders() {
      try {
        const q = query(
          collection(db, "orders"),
          where("customerEmail", "==", user!.email),
          orderBy("createdAt", "desc")
        )
        const snapshot = await getDocs(q)
        setOrders(snapshot.docs.map((d) => d.data() as Order))
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        // Fallback: try without orderBy (in case composite index missing)
        try {
          const q2 = query(
            collection(db, "orders"),
            where("customerEmail", "==", user!.email)
          )
          const snapshot2 = await getDocs(q2)
          const fetched = snapshot2.docs.map((d) => d.data() as Order)
          fetched.sort((a, b) => {
            const da = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt?.toDate?.() || new Date()
            const db2 = typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt?.toDate?.() || new Date()
            return db2.getTime() - da.getTime()
          })
          setOrders(fetched)
        } catch {
          console.error("Orders fetch fallback also failed")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border/40 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Your Account
          </p>
          <h1 className="text-balance font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            My Orders
          </h1>
          <p className="mt-4 font-sans text-sm text-muted-foreground">
            Track your orders and leave reviews for delivered items.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-serif text-xl text-foreground">No orders yet</h2>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              When you place an order, it will appear here.
            </p>
            <Link
              href="/wigs"
              className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-3 font-sans text-sm uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground"
            >
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = statusConf.icon
              const isExpanded = expandedOrder === order.receiptNumber

              return (
                <div key={order.receiptNumber} className="overflow-hidden rounded-lg border border-border bg-background">
                  {/* Order header - clickable */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.receiptNumber)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">#{order.receiptNumber}</p>
                        <p className="font-sans text-sm font-medium text-foreground">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="font-sans text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConf.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConf.label}
                        </span>
                      </div>
                      <div className="sm:ml-auto">
                        <p className="font-sans text-sm font-semibold text-foreground">
                          ${order.total?.toLocaleString("en-US", { minimumFractionDigits: 2 })} JMD
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="ml-2 h-4 w-4 text-muted-foreground" /> : <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border px-6 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Delivery</p>
                          <p className="mt-1 font-sans text-sm text-foreground">{deliveryLabel(order.deliveryMethod)}</p>
                        </div>
                        <div>
                          <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Payment</p>
                          <p className="mt-1 font-sans text-sm capitalize text-foreground">{order.paymentMethod}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-6">
                        <p className="mb-3 font-sans text-xs uppercase tracking-wider text-muted-foreground">Items</p>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/products/${item.id}`}
                                  className="font-sans text-sm text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                                >
                                  {item.name}
                                </Link>
                                {item.quantity > 1 && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">x{item.quantity}</span>
                                )}
                              </div>
                              <p className="font-sans text-sm text-foreground">
                                ${(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total breakdown */}
                      <div className="mt-4 border-t border-border/60 pt-4">
                        <div className="flex justify-between font-sans text-sm text-muted-foreground">
                          <span>Subtotal</span>
                          <span>${order.subtotal?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="mt-1 flex justify-between font-sans text-sm text-muted-foreground">
                            <span>Delivery</span>
                            <span>${order.deliveryFee?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="mt-2 flex justify-between font-sans text-sm font-semibold text-foreground">
                          <span>Total</span>
                          <span>${order.total?.toLocaleString("en-US", { minimumFractionDigits: 2 })} JMD</span>
                        </div>
                      </div>

                      {/* Review nudge for delivered orders */}
                      {order.status === "delivered" && (
                        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                          <div className="flex items-start gap-3">
                            <Star className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                            <div>
                              <p className="font-sans text-sm font-medium text-foreground">How was your order?</p>
                              <p className="mt-1 font-sans text-xs text-muted-foreground">
                                Your feedback helps other customers and helps us improve.
                              </p>
                              <Link
                                href="/reviews"
                                className="mt-3 inline-flex items-center gap-1 font-sans text-xs font-medium uppercase tracking-widest text-amber-700 transition-colors hover:text-amber-900"
                              >
                                Leave a Review
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
