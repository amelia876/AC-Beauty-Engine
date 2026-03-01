"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { getProductById as getLocalProduct } from "@/lib/products"
import { getProductById as getFirebaseProduct } from "@/lib/firebase-products"
import { useCart } from "@/lib/cart-context"
import { Footer } from "@/components/footer"
import { ChevronLeft, ShoppingCart, Loader2 } from "lucide-react"
import type { Product } from "@/lib/products"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | undefined>(
    getLocalProduct(params.id as string)
  )
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>("")

  useEffect(() => {
    getFirebaseProduct(params.id as string)
      .then((p) => { if (p) setProduct(p) })
      .finally(() => setLoading(false))
  }, [params.id])

  const isSoldOut = product?.status === "sold_out"
  const isComingSoon = product?.status === "coming_soon"
  const canPurchase = !isSoldOut && !isComingSoon

  if (loading && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    if (canPurchase) addToCart(product)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Back Button */}
      <div className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Product Detail */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
              <Image
                src={product.images[selectedImage] || product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.salePrice && (
                <div className="absolute right-6 top-6 bg-primary px-4 py-2 text-xs font-medium uppercase tracking-widest text-background">
                  On Sale
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-[3/4] overflow-hidden bg-muted/30 transition-opacity ${
                    selectedImage === index ? "opacity-100 ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div
              className="mb-2 text-xs uppercase tracking-widest text-primary"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
            >
              {product.category === "wigs" ? "Luxury Wigs" : "Swimwear"}
            </div>

            <h1 className="mb-4 font-serif text-4xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              {product.name}
            </h1>

            {product.salePrice ? (
              <div className="mb-6 flex items-baseline gap-3">
                <p className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  ${product.salePrice.toFixed(2)}
                </p>
                <p className="text-lg text-muted-foreground line-through" style={{ fontFamily: "var(--font-body)" }}>
                  ${product.price.toFixed(2)}
                </p>
                <span className="text-sm font-medium text-primary" style={{ fontFamily: "var(--font-body)" }}>
                  Save ${(product.price - product.salePrice).toFixed(2)}
                </span>
              </div>
            ) : (
              <p className="mb-6 text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                ${product.price.toFixed(2)}
              </p>
            )}

            <p
              className="mb-8 text-sm leading-relaxed text-muted-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {product.description}
            </p>

            {/* Specifications */}
            <div className="mb-8 space-y-6 border-t border-border/40 pt-8">
              <h2
                className="text-sm uppercase tracking-widest text-foreground"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
              >
                Specifications
              </h2>

              {product.category === "wigs" ? (
                <div className="space-y-3">
                  {product.specifications.hairLength && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Hair Length
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.hairLength}
                      </span>
                    </div>
                  )}
                  {product.specifications.laceSize && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Lace Size
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.laceSize}
                      </span>
                    </div>
                  )}
                  {product.specifications.density && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Density
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.density}
                      </span>
                    </div>
                  )}
                  {product.specifications.hairType && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Hair Type
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.hairType}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {product.specifications.sizes && (
                    <div>
                      <label
                        className="mb-2 block text-sm text-muted-foreground"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        Select Size
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.specifications.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                              selectedSize === size
                                ? "border-primary bg-primary text-background"
                                : "border-border/40 text-foreground hover:border-primary"
                            }`}
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.specifications.material && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Material
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.material}
                      </span>
                    </div>
                  )}
                  {product.specifications.coverage && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Coverage
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.coverage}
                      </span>
                    </div>
                  )}
                  {product.specifications.style && (
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        Style
                      </span>
                      <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {product.specifications.style}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Banner */}
            {isSoldOut && (
              <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-red-700">Sold Out</p>
                <p className="mt-1 text-xs text-red-600">This item is currently unavailable.</p>
              </div>
            )}
            {isComingSoon && (
              <div className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">Coming Soon</p>
                <p className="mt-1 text-xs text-amber-600">This item will be available for purchase soon.</p>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!canPurchase}
              className={`flex w-full items-center justify-center gap-3 border px-8 py-4 text-xs uppercase tracking-widest transition-colors ${
                canPurchase
                  ? "border-foreground bg-foreground text-background hover:bg-background hover:text-foreground"
                  : "cursor-not-allowed border-muted bg-muted text-muted-foreground"
              }`}
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
            >
              <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
              {isSoldOut ? "Sold Out" : isComingSoon ? "Coming Soon" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
