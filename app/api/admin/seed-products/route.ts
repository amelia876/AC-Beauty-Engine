import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { products } from "@/lib/products"

export async function POST() {
  try {
    const snap = await adminDb.collection("products").get()
    const existingIds = new Set(snap.docs.map((d) => d.id))

    let seeded = 0
    for (const product of products) {
      if (!existingIds.has(product.id)) {
        await adminDb.collection("products").doc(product.id).set({
          ...product,
          status: product.status || "available",
        })
        seeded++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded} new products. ${existingIds.size} already existed.`,
      total: products.length,
    })
  } catch (error) {
    console.error("[v0] Seed products error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to seed products. Check Firebase Admin setup." },
      { status: 500 }
    )
  }
}
