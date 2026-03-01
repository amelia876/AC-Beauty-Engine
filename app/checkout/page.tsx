"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/lib/cart-context"
import {
  Truck,
  MapPin,
  Car,
  Building2,
  Upload,
  CheckCircle,
  Copy,
  Wallet,
  Landmark,
  Banknote,
  Mail,
  X,
} from "lucide-react"

// Firebase imports (static)
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"

type DeliveryMethod = "knutsford" | "zipmail" | "inperson" | "taximan"
type PaymentMethod = "paypal" | "zelle" | "cashapp" | "scotia" | "cibc" | "cod"

function generateReceiptNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `AC-${timestamp}-${random}`
}

// Dummy banking details - edit these with your actual info
const bankingDetails: Record<
  string,
  { name: string; icon: React.ElementType; color: string; details: { label: string; value: string }[] }
> = {
  paypal: {
    name: "PayPal",
    icon: Wallet,
    color: "text-blue-600",
    details: [
      { label: "PayPal Email", value: "melly.cole1@gmail.com" },
      { label: "Account Name", value: "Amelia Cole" },
    ],
  },
  zelle: {
    name: "Zelle",
    icon: Banknote,
    color: "text-purple-600",
    details: [
      { label: "Zelle Email/Phone", value: "melly.cole1@gmail.com" },
      { label: "Account Name", value: "Amelia Cole" },
    ],
  },
  cashapp: {
    name: "Cash App",
    icon: Banknote,
    color: "text-green-600",
    details: [
      { label: "Cash Tag", value: "$amelia876C" },
      { label: "Account Name", value: "Amelia Cole" },
    ],
  },
  scotia: {
    name: "Scotia Bank",
    icon: Landmark,
    color: "text-red-600",
    details: [
      { label: "Bank", value: "Scotia Bank Jamaica" },
      { label: "Account Name", value: "Amelia Cole" },
      { label: "Account Number", value: "50195 000535595" },
      { label: "Branch", value: "Mandeville Branch" },
      { label: "Account Type", value: "Chequing" },
    ],
  },
  cibc: {
    name: "CIBC Cross Banking",
    icon: Landmark,
    color: "text-amber-700",
    details: [
      { label: "Bank", value: "CIBC FirstCaribbean" },
      { label: "Account Name", value: "Amelia Cole" },
      { label: "Account Number", value: "1002338273" },
      { label: "Branch", value: "Mandeville Branch" },
      { label: "Account Type", value: "Chequing" },
    ],
  },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="rounded p-1 transition-colors hover:bg-muted"
      title="Copy"
    >
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  )
}

// Phone validation: digits only, 7-10 digits
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 7 && digits.length <= 10
}

// Validate image file for receipt
function validateReceiptFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      resolve("Only JPG, PNG, or WEBP images are accepted. PDFs and other file types are not allowed.")
      return
    }
    if (file.size < 10 * 1024) {
      resolve("File is too small (under 10KB). Please upload a clear photo of your actual payment receipt.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      resolve("File is too large (over 10MB). Please upload a smaller image.")
      return
    }
    // Check image dimensions
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        resolve("Image is too small (minimum 200x200 pixels). Please upload a clear, legible receipt photo.")
      } else {
        resolve(null)
      }
    }
    img.onerror = () => resolve("Could not read the image. Please try a different file.")
    img.src = URL.createObjectURL(file)
  })
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [emailAddress, setEmailAddress] = useState(user?.email || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-fill email when user loads
  useEffect(() => {
    if (user?.email) setEmailAddress((prev) => prev || user.email!)
  }, [user])

  const deliveryFee = deliveryMethod === "inperson" ? 0 : deliveryMethod ? 700 : 0
  const finalTotal = totalPrice + deliveryFee

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptError(null)

    const error = await validateReceiptFile(file)
    if (error) {
      setReceiptError(error)
      setReceiptFile(null)
      setReceiptPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setReceiptFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setReceiptPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    setReceiptError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Validate all checkout form fields
  const validateForm = (formData: FormData): boolean => {
    const errors: Record<string, string> = {}

    // Validate email
    const email = emailAddress.trim()
    if (!email) {
      errors.emailAddress = "Email address is required for order updates."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.emailAddress = "Please enter a valid email address."
    }

    // Validate delivery fields
    if (deliveryMethod === "knutsford") {
      if (!formData.get("knutsfordLocation")?.toString().trim()) errors.knutsfordLocation = "Location is required."
      if (!formData.get("knutsfordName")?.toString().trim() || (formData.get("knutsfordName")?.toString().trim().length ?? 0) < 2) errors.knutsfordName = "Full name is required (min 2 characters)."
      const kPhone = formData.get("knutsfordPhone")?.toString() ?? ""
      if (!isValidPhone(kPhone)) errors.knutsfordPhone = "Phone must be 7-10 digits."
    } else if (deliveryMethod === "zipmail") {
      if (!formData.get("postOffice")?.toString().trim()) errors.postOffice = "Post office location is required."
      if (!formData.get("zipName")?.toString().trim() || (formData.get("zipName")?.toString().trim().length ?? 0) < 2) errors.zipName = "Full name is required (min 2 characters)."
      const zPhone = formData.get("zipPhone")?.toString() ?? ""
      if (!isValidPhone(zPhone)) errors.zipPhone = "Phone must be 7-10 digits."
    } else if (deliveryMethod === "inperson") {
      if (!formData.get("meetupLocation")?.toString().trim()) errors.meetupLocation = "Meet-up location is required."
      if (!formData.get("meetupDate")?.toString().trim()) errors.meetupDate = "Date is required."
      if (!formData.get("meetupTime")?.toString().trim()) errors.meetupTime = "Time is required."
      const mPhone = formData.get("meetupPhone")?.toString() ?? ""
      if (!isValidPhone(mPhone)) errors.meetupPhone = "Phone must be 7-10 digits."
    } else if (deliveryMethod === "taximan") {
      if (!formData.get("recipientName")?.toString().trim() || (formData.get("recipientName")?.toString().trim().length ?? 0) < 2) errors.recipientName = "Recipient name is required (min 2 characters)."
      const rPhone = formData.get("recipientPhone")?.toString() ?? ""
      if (!isValidPhone(rPhone)) errors.recipientPhone = "Phone must be 7-10 digits."
      if (!formData.get("taxiDriverName")?.toString().trim() || (formData.get("taxiDriverName")?.toString().trim().length ?? 0) < 2) errors.taxiDriverName = "Driver name is required (min 2 characters)."
      const dPhone = formData.get("taxiDriverPhone")?.toString() ?? ""
      if (!isValidPhone(dPhone)) errors.taxiDriverPhone = "Phone must be 7-10 digits."
      if (!formData.get("vehicleDescription")?.toString().trim()) errors.vehicleDescription = "Vehicle description is required."
      if (!formData.get("licensePlate")?.toString().trim()) errors.licensePlate = "License plate is required."
    }

    // Validate COD fields
    if (paymentMethod === "cod") {
      if (!formData.get("codName")?.toString().trim() || (formData.get("codName")?.toString().trim().length ?? 0) < 2) errors.codName = "Full name is required (min 2 characters)."
      const cPhone = formData.get("codPhone")?.toString() ?? ""
      if (!isValidPhone(cPhone)) errors.codPhone = "Phone must be 7-10 digits."
    }

    // Validate receipt for non-COD payments
    if (paymentMethod && paymentMethod !== "cod" && !receiptFile) {
      errors.receipt = "Please upload your payment receipt."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)

    // Run full validation before proceeding
    if (!validateForm(formData)) {
      // Scroll to the first error
      const firstErrorField = Object.keys(fieldErrors)[0]
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    setIsProcessing(true)

    const receiptNumber = generateReceiptNumber()

    // Extract delivery details first
    let deliveryDetails: Record<string, string> = {}
    let customerName = ""
    let customerPhone = ""

    if (deliveryMethod === "knutsford") {
      customerName = formData.get("knutsfordName") as string
      customerPhone = formData.get("knutsfordPhone") as string
      deliveryDetails = {
        location: formData.get("knutsfordLocation") as string,
        name: customerName,
        phone: customerPhone,
      }
    } else if (deliveryMethod === "zipmail") {
      customerName = formData.get("zipName") as string
      customerPhone = formData.get("zipPhone") as string
      deliveryDetails = {
        postOffice: formData.get("postOffice") as string,
        name: customerName,
        phone: customerPhone,
      }
    } else if (deliveryMethod === "inperson") {
      customerPhone = formData.get("meetupPhone") as string
      deliveryDetails = {
        location: formData.get("meetupLocation") as string,
        date: formData.get("meetupDate") as string,
        time: formData.get("meetupTime") as string,
        phone: customerPhone,
      }
    } else if (deliveryMethod === "taximan") {
      customerName = formData.get("recipientName") as string
      customerPhone = formData.get("recipientPhone") as string
      deliveryDetails = {
        recipientName: customerName,
        recipientPhone: customerPhone,
        driverName: formData.get("taxiDriverName") as string,
        driverPhone: formData.get("taxiDriverPhone") as string,
        vehicle: formData.get("vehicleDescription") as string,
        licensePlate: formData.get("licensePlate") as string,
      }
    }

    // Check COD fields for customer name/phone
    if (paymentMethod === "cod") {
      customerName = customerName || (formData.get("codName") as string) || ""
      customerPhone = customerPhone || (formData.get("codPhone") as string) || ""
    }

    // Convert receipt to base64 for storage
    let receiptBase64: string | null = null
    if (receiptFile) {
      receiptBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(receiptFile)
      })
    }

    const orderDetails = {
      receiptNumber,
      customerName: customerName || user?.displayName || "",
      customerPhone,
      customerEmail: emailAddress.trim(),
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: totalPrice,
      deliveryFee,
      total: finalTotal,
      deliveryMethod,
      paymentMethod,
      hasReceiptUpload: !!receiptFile,
      receiptImage: receiptBase64,
      deliveryDetails,
      userId: user?.uid, // 🔥 ADDED: required by Firestore rules
    }

    // Save to sessionStorage first so navigation always works
    sessionStorage.setItem("lastOrder", JSON.stringify(orderDetails))

    // Send order email via API
    try {
      const emailRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderDetails),
      })
      if (!emailRes.ok) {
        console.error("[v0] Order email failed:", await emailRes.text())
      }
    } catch (err) {
      console.error("[v0] Order email fetch error:", err)
    }

    // Save to Firebase with improved error handling
    try {
      await setDoc(doc(db, "orders", orderDetails.receiptNumber), {
        ...orderDetails,
        status: "pending",
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error("[v0] Firebase order save error:", err)
      alert("Failed to save your order. Please check your connection and try again, or contact support.")
      setIsProcessing(false)
      return // Stop further execution – order not saved
    }

    // Auto mark purchased items as sold out in Firebase inventory
    try {
      const { markProductSoldOut } = await import("@/lib/firebase-products")
      await Promise.all(items.map((item) => markProductSoldOut(item.id)))
    } catch (err) {
      console.error("[v0] Auto sold-out error:", err)
    }

    setOrderComplete(true)
    clearCart()
    router.push("/success")
  }
  
  // Auth gate: must sign in to checkout
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Sign in to checkout</h2>
            <p className="text-muted-foreground">
              Please sign in with your Google or Apple account to place an order. This helps us keep track of your orders and send you updates.
            </p>
            <Link
              href="/signin?redirect=/checkout"
              className="inline-block rounded-md bg-foreground px-8 py-3 text-sm uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
            >
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">Add some items before checking out.</p>
          <a href="/cart" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go to Cart
          </a>
        </div>
      </div>
    )
  }

  const deliveryOptions = [
    {
      id: "knutsford" as DeliveryMethod,
      name: "Knutsford Express",
      description: "Delivery to any Knutsford location",
      fee: "$700.00 JMD",
      icon: Truck,
    },
    {
      id: "zipmail" as DeliveryMethod,
      name: "Zip Mail",
      description: "Delivery to your nearest post office",
      fee: "$700.00 JMD",
      icon: Building2,
    },
    {
      id: "inperson" as DeliveryMethod,
      name: "In Person (Mandeville)",
      description: "Meet up in Mandeville & surrounding areas",
      fee: "FREE",
      icon: MapPin,
    },
    {
      id: "taximan" as DeliveryMethod,
      name: "Taxi Man",
      description: "Send via your trusted taxi driver",
      fee: "$700.00 JMD",
      icon: Car,
    },
  ]

  const paymentOptions = [
    { id: "paypal" as PaymentMethod, name: "PayPal", icon: Wallet, color: "text-blue-600 border-blue-200 bg-blue-50" },
    { id: "zelle" as PaymentMethod, name: "Zelle", icon: Banknote, color: "text-purple-600 border-purple-200 bg-purple-50" },
    { id: "cashapp" as PaymentMethod, name: "Cash App", icon: Banknote, color: "text-green-600 border-green-200 bg-green-50" },
    { id: "scotia" as PaymentMethod, name: "Scotia Bank", icon: Landmark, color: "text-red-600 border-red-200 bg-red-50" },
    { id: "cibc" as PaymentMethod, name: "CIBC", icon: Landmark, color: "text-amber-700 border-amber-200 bg-amber-50" },
    { id: "cod" as PaymentMethod, name: "Cash on Delivery", icon: Banknote, color: "text-foreground border-foreground/20 bg-muted/50" },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-balance font-serif text-4xl font-bold text-foreground">Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* ── Contact Email ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Email
              </CardTitle>
              <p className="text-sm text-muted-foreground">We will send order updates and tracking information to this email.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  name="emailAddress"
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => { setEmailAddress(e.target.value); clearFieldError("emailAddress") }}
                  placeholder="your@email.com"
                  className={fieldErrors.emailAddress ? "border-red-500" : ""}
                />
                {fieldErrors.emailAddress && <p className="text-xs text-red-600">{fieldErrors.emailAddress}</p>}
              </div>
            </CardContent>
          </Card>

          {/* ── Delivery Method ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {deliveryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDeliveryMethod(option.id)}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      deliveryMethod === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <option.icon
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                        deliveryMethod === option.id ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          option.fee === "FREE" ? "text-green-600" : "text-primary"
                        }`}
                      >
                        {option.fee}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Knutsford Express Fields */}
              {deliveryMethod === "knutsford" && (
                <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="font-medium text-foreground">Knutsford Express Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="knutsfordLocation">Knutsford Location *</Label>
                    <Input name="knutsfordLocation" id="knutsfordLocation" required placeholder="e.g., Half Way Tree, Kingston" className={fieldErrors.knutsfordLocation ? "border-red-500" : ""} onChange={() => clearFieldError("knutsfordLocation")} />
                    {fieldErrors.knutsfordLocation && <p className="text-xs text-red-600">{fieldErrors.knutsfordLocation}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="knutsfordName">Full Name *</Label>
                      <Input name="knutsfordName" id="knutsfordName" required placeholder="Your full name" className={fieldErrors.knutsfordName ? "border-red-500" : ""} onChange={() => clearFieldError("knutsfordName")} />
                      {fieldErrors.knutsfordName && <p className="text-xs text-red-600">{fieldErrors.knutsfordName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="knutsfordPhone">Phone Number *</Label>
                      <Input name="knutsfordPhone" id="knutsfordPhone" type="tel" required placeholder="876-XXX-XXXX" className={fieldErrors.knutsfordPhone ? "border-red-500" : ""} onChange={() => clearFieldError("knutsfordPhone")} />
                      {fieldErrors.knutsfordPhone && <p className="text-xs text-red-600">{fieldErrors.knutsfordPhone}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: A delivery fee of <span className="font-semibold text-primary">$700.00 JMD</span> will be
                    added to your order.
                  </p>
                </div>
              )}

              {/* Zip Mail Fields */}
              {deliveryMethod === "zipmail" && (
                <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="font-medium text-foreground">Zip Mail Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="postOffice">Post Office Location *</Label>
                    <Input name="postOffice" id="postOffice" required placeholder="e.g., Mandeville Post Office" className={fieldErrors.postOffice ? "border-red-500" : ""} onChange={() => clearFieldError("postOffice")} />
                    {fieldErrors.postOffice && <p className="text-xs text-red-600">{fieldErrors.postOffice}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipName">Full Name *</Label>
                      <Input name="zipName" id="zipName" required placeholder="Your full name" className={fieldErrors.zipName ? "border-red-500" : ""} onChange={() => clearFieldError("zipName")} />
                      {fieldErrors.zipName && <p className="text-xs text-red-600">{fieldErrors.zipName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipPhone">Phone Number *</Label>
                      <Input name="zipPhone" id="zipPhone" type="tel" required placeholder="876-XXX-XXXX" className={fieldErrors.zipPhone ? "border-red-500" : ""} onChange={() => clearFieldError("zipPhone")} />
                      {fieldErrors.zipPhone && <p className="text-xs text-red-600">{fieldErrors.zipPhone}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: A delivery fee of <span className="font-semibold text-primary">$700.00 JMD</span> will be
                    added to your order.
                  </p>
                </div>
              )}

              {/* In Person (Mandeville) Fields */}
              {deliveryMethod === "inperson" && (
                <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="font-medium text-foreground">Mandeville Meet-Up Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="meetupLocation">Where in Mandeville? *</Label>
                    <Input name="meetupLocation" id="meetupLocation" required placeholder="e.g., Manchester Shopping Centre, Caledonia Mall" className={fieldErrors.meetupLocation ? "border-red-500" : ""} onChange={() => clearFieldError("meetupLocation")} />
                    {fieldErrors.meetupLocation && <p className="text-xs text-red-600">{fieldErrors.meetupLocation}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="meetupDate">Preferred Date *</Label>
                      <Input name="meetupDate" id="meetupDate" type="date" required className={fieldErrors.meetupDate ? "border-red-500" : ""} onChange={() => clearFieldError("meetupDate")} />
                      {fieldErrors.meetupDate && <p className="text-xs text-red-600">{fieldErrors.meetupDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meetupTime">Preferred Time *</Label>
                      <Input name="meetupTime" id="meetupTime" type="time" required className={fieldErrors.meetupTime ? "border-red-500" : ""} onChange={() => clearFieldError("meetupTime")} />
                      {fieldErrors.meetupTime && <p className="text-xs text-red-600">{fieldErrors.meetupTime}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetupPhone">Phone Number *</Label>
                    <Input name="meetupPhone" id="meetupPhone" type="tel" required placeholder="876-XXX-XXXX" className={fieldErrors.meetupPhone ? "border-red-500" : ""} onChange={() => clearFieldError("meetupPhone")} />
                    {fieldErrors.meetupPhone && <p className="text-xs text-red-600">{fieldErrors.meetupPhone}</p>}
                  </div>
                  <p className="text-sm font-medium text-green-600">No delivery fee for Mandeville pickups!</p>
                </div>
              )}

              {/* Taxi Man Fields */}
              {deliveryMethod === "taximan" && (
                <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="font-medium text-foreground">Taxi Man Details</h4>

                  <div className="space-y-4 border-b border-border pb-4">
                    <p className="text-sm font-medium text-muted-foreground">Recipient Information</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="recipientName">{"Recipient's Full Name *"}</Label>
                        <Input name="recipientName" id="recipientName" required placeholder="Who is receiving the package?" className={fieldErrors.recipientName ? "border-red-500" : ""} onChange={() => clearFieldError("recipientName")} />
                        {fieldErrors.recipientName && <p className="text-xs text-red-600">{fieldErrors.recipientName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipientPhone">{"Recipient's Phone Number *"}</Label>
                        <Input name="recipientPhone" id="recipientPhone" type="tel" required placeholder="876-XXX-XXXX" className={fieldErrors.recipientPhone ? "border-red-500" : ""} onChange={() => clearFieldError("recipientPhone")} />
                        {fieldErrors.recipientPhone && <p className="text-xs text-red-600">{fieldErrors.recipientPhone}</p>}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground">Taxi Driver Information</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxiDriverName">{"Taxi Driver's Name *"}</Label>
                      <Input name="taxiDriverName" id="taxiDriverName" required placeholder="Driver's full name" className={fieldErrors.taxiDriverName ? "border-red-500" : ""} onChange={() => clearFieldError("taxiDriverName")} />
                      {fieldErrors.taxiDriverName && <p className="text-xs text-red-600">{fieldErrors.taxiDriverName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxiDriverPhone">{"Driver's Phone Number *"}</Label>
                      <Input name="taxiDriverPhone" id="taxiDriverPhone" type="tel" required placeholder="876-XXX-XXXX" className={fieldErrors.taxiDriverPhone ? "border-red-500" : ""} onChange={() => clearFieldError("taxiDriverPhone")} />
                      {fieldErrors.taxiDriverPhone && <p className="text-xs text-red-600">{fieldErrors.taxiDriverPhone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleDescription">Vehicle Description *</Label>
                    <Input name="vehicleDescription" id="vehicleDescription" required placeholder="e.g., White Toyota Corolla" className={fieldErrors.vehicleDescription ? "border-red-500" : ""} onChange={() => clearFieldError("vehicleDescription")} />
                    {fieldErrors.vehicleDescription && <p className="text-xs text-red-600">{fieldErrors.vehicleDescription}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">License Plate Number *</Label>
                    <Input name="licensePlate" id="licensePlate" required placeholder="e.g., PA1234" className={fieldErrors.licensePlate ? "border-red-500" : ""} onChange={() => clearFieldError("licensePlate")} />
                    {fieldErrors.licensePlate && <p className="text-xs text-red-600">{fieldErrors.licensePlate}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: A delivery fee of <span className="font-semibold text-primary">$700.00 JMD</span> will be
                    added to your order.
                  </p>
                </div>
              )}

              {!deliveryMethod && (
                <p className="text-sm text-muted-foreground">Please select a delivery method to continue.</p>
              )}
            </CardContent>
          </Card>

          {/* ── Payment Method ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <p className="text-sm text-muted-foreground">Select how you would like to pay</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paymentOptions.map((option) => {
                  const isSelected = paymentMethod === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isSelected ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <option.icon
                          className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          strokeWidth={1.5}
                        />
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {option.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Banking Details Display */}
              {paymentMethod && paymentMethod !== "cod" && bankingDetails[paymentMethod] && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = bankingDetails[paymentMethod].icon
                      return <Icon className={`h-5 w-5 ${bankingDetails[paymentMethod].color}`} />
                    })()}
                    <h4 className="font-semibold text-foreground">{bankingDetails[paymentMethod].name} Details</h4>
                  </div>

                  <div className="space-y-3">
                    {bankingDetails[paymentMethod].details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-md bg-background px-4 py-3"
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">{detail.label}</p>
                          <p className="font-medium text-foreground">{detail.value}</p>
                        </div>
                        <CopyButton text={detail.value} />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      Please include your name or order number as the payment reference.
                    </p>
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <Label className="text-sm font-semibold text-foreground">
                      Upload Payment Receipt / Screenshot *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      After sending your payment, upload a clear screenshot or photo of the receipt as proof.
                    </p>

                    {receiptPreview ? (
                      <div className="relative inline-block">
                        <Image
                          src={receiptPreview}
                          alt="Payment receipt"
                          width={200}
                          height={200}
                          className="rounded-lg border border-border object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform hover:scale-110"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {receiptFile?.name}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
                          receiptError || fieldErrors.receipt
                            ? "border-red-400 bg-red-50/50"
                            : "border-border hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP only (min 200x200px, max 10MB)</p>
                        </div>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {receiptError && (
                      <p className="text-sm font-medium text-red-600">{receiptError}</p>
                    )}
                    {fieldErrors.receipt && !receiptError && (
                      <p className="text-sm font-medium text-red-600">{fieldErrors.receipt}</p>
                    )}
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-xs font-medium text-red-800">
                        Please upload a clear photo of your actual payment receipt. Uploading fake, unrelated, or manipulated images will result in immediate order cancellation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash on Delivery */}
              {paymentMethod === "cod" && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
                  <h4 className="font-semibold text-foreground">Cash on Delivery</h4>
                  <div className="space-y-3">
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-800">
                        Full payment is required upon delivery to receive your product.
                      </p>
                    </div>
                    <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-sm font-medium text-primary">
                        Cash on Delivery is only available in Mandeville and surrounding areas.
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please have the exact amount ready at the time of delivery. Your order total including any delivery fees must be paid in full before items are handed over.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="codName">Full Name *</Label>
                      <Input name="codName" id="codName" required placeholder="Your full name" className={fieldErrors.codName ? "border-red-500" : ""} onChange={() => clearFieldError("codName")} />
                      {fieldErrors.codName && <p className="text-xs text-red-600">{fieldErrors.codName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codPhone">Phone Number *</Label>
                      <Input name="codPhone" id="codPhone" type="tel" required placeholder="876-XXX-XXXX" className={fieldErrors.codPhone ? "border-red-500" : ""} onChange={() => clearFieldError("codPhone")} />
                      {fieldErrors.codPhone && <p className="text-xs text-red-600">{fieldErrors.codPhone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {!paymentMethod && (
                <p className="text-sm text-muted-foreground">Please select a payment method to continue.</p>
              )}
            </CardContent>
          </Card>

          {/* ── Order Summary ── */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className={`font-medium ${deliveryFee === 0 ? "text-green-600" : "text-foreground"}`}>
                      {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)} JMD`}
                    </span>
                  </div>
                  {paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment via</span>
                      <span className="font-medium text-foreground">
                        {paymentOptions.find((p) => p.id === paymentMethod)?.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {Object.keys(fieldErrors).length > 0 && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">Please fix the following errors:</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                    {Object.values(fieldErrors).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                type="submit"
                className="mt-6 w-full"
                size="lg"
                disabled={
                  isProcessing ||
                  !deliveryMethod ||
                  !paymentMethod ||
                  (paymentMethod !== "cod" && !receiptFile)
                }
              >
                {isProcessing ? "Processing Order..." : "Place Order"}
              </Button>

              {paymentMethod && paymentMethod !== "cod" && !receiptFile && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Please upload your payment receipt before placing your order.
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </div>

      <Footer />
    </div>
  )
}