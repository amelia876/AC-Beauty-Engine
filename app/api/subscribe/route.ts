import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const subscriberId = email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")
    const docRef = adminDb.collection("subscriptions").doc(subscriberId)
    const existing = await docRef.get()

    if (existing.exists) {
      return NextResponse.json({ message: "You are already subscribed!" })
    }

    await docRef.set({
      email: email.trim().toLowerCase(),
      name: name?.trim() || "",
      subscribedAt: new Date().toISOString(),
      active: true,
    })

    return NextResponse.json({ message: "Subscribed successfully!" })
  } catch (error) {
    console.error("[v0] Subscribe error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
