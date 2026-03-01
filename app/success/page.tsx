"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Copy, Check, Truck, MapPin, Car, Building2 } from "lucide-react"

interface OrderDetails {
  receiptNumber: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryMethod: string
  paymentMethod?: string
  hasReceiptUpload?: boolean
  deliveryDetails: Record<string, string>
}

const paymentMethodNames: Record<string, string> = {
  paypal: "PayPal",
  zelle: "Zelle",
  cashapp: "Cash App",
  scotia: "Scotia Bank",
  cibc: "CIBC Cross Banking",
  cod: "Cash on Delivery",
}

const deliveryMethodNames: Record<string, { name: string; icon: React.ElementType }> = {
  knutsford: { name: "Knutsford Express", icon: Truck },
  zipmail: { name: "Zip Mail", icon: Building2 },
  inperson: { name: "In Person (Mandeville)", icon: MapPin },
  taximan: { name: "Taxi Man", icon: Car },
}

export default function SuccessPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("lastOrder")
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder))
    }
  }, [])

  const copyReceiptNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.receiptNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const DeliveryIcon = order ? deliveryMethodNames[order.deliveryMethod]?.icon : Truck

  return (
    <div className="min-h-screen bg-background">

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Order Placed Successfully!</h1>
          <p className="mt-2 text-muted-foreground">Thank you for shopping with us</p>
        </div>

        {order ? (
          <div className="space-y-6">
            {/* Receipt Number Card */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Your Receipt Number</p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl font-bold tracking-wider text-primary">
                      {order.receiptNumber}
                    </span>
                    <button
                      onClick={copyReceiptNumber}
                      className="rounded-lg p-2 transition-colors hover:bg-primary/10"
                      title="Copy receipt number"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Please save this number for your records</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="py-6">
                <h2 className="mb-4 font-semibold text-foreground">Order Details</h2>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} <span className="text-foreground">× {item.quantity}</span>
                      </span>
                      <span className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className={order.deliveryFee === 0 ? "text-green-600" : "text-foreground"}>
                      {order.deliveryFee === 0 ? "FREE" : `$${order.deliveryFee.toFixed(2)} JMD`}
                    </span>
                  </div>
                  {order.paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium text-foreground">
                        {paymentMethodNames[order.paymentMethod] || order.paymentMethod}
                      </span>
                    </div>
                  )}
                  {order.hasReceiptUpload && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Receipt Uploaded</span>
                      <span className="font-medium text-green-600">Yes</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardContent className="py-6">
                <div className="mb-4 flex items-center gap-2">
                  {DeliveryIcon && <DeliveryIcon className="h-5 w-5 text-primary" />}
                  <h2 className="font-semibold text-foreground">
                    {deliveryMethodNames[order.deliveryMethod]?.name || "Delivery"} Details
                  </h2>
                </div>

                <div className="space-y-2 text-sm">
                  {order.deliveryMethod === "knutsford" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.phone}</span>
                      </div>
                    </>
                  )}

                  {order.deliveryMethod === "zipmail" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Post Office:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.postOffice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.phone}</span>
                      </div>
                    </>
                  )}

                  {order.deliveryMethod === "inperson" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meeting Location:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium text-foreground">{formatDate(order.deliveryDetails.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.phone}</span>
                      </div>
                    </>
                  )}

                  {order.deliveryMethod === "taximan" && (
                    <>
                      <div className="mb-3 pb-3 border-b border-border">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Recipient
                        </p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium text-foreground">{order.deliveryDetails.recipientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium text-foreground">{order.deliveryDetails.recipientPhone}</span>
                        </div>
                      </div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Taxi Driver
                      </p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver Name:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.driverName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver Phone:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.driverPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.vehicle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">License Plate:</span>
                        <span className="font-medium text-foreground">{order.deliveryDetails.licensePlate}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Date */}
            <div className="text-center text-sm text-muted-foreground">
              Order placed on{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            {/* Continue Shopping Button */}
            <div className="pt-4">
              <Link href="/" className="block">
                <Button size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No order information found.</p>
              <Link href="/" className="mt-4 inline-block">
                <Button>Go to Homepage</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  )
}
