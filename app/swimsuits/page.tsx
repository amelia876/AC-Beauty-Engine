"use client"

import { useState, useEffect } from "react"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { getProductsByCategory as getLocal } from "@/lib/products"
import { getProductsByCategory as getFirebase } from "@/lib/firebase-products"
import type { Product } from "@/lib/products"
import { Loader2 } from "lucide-react"

export default function SwimsuitsPage() {
  const [swimsuits, setSwimSuits] = useState<Product[]>(getLocal("swimsuits"))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFirebase("swimsuits")
      .then(setSwimSuits)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-balance font-serif text-4xl font-bold text-foreground">Swimsuits Collection</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Dive into summer with our vibrant collection of stylish swimwear
          </p>
        </div>

        {loading && swimsuits.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {swimsuits.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
