"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { getProductById as getLocalProduct } from "@/lib/products"
import { getProductById as getFirebaseProduct } from "@/lib/firebase-products"
import { useCart } from "@/lib/cart-context"
import { Footer } from "@/components/footer"
import { ChevronLeft, ShoppingCart, Loader2, Share2, X, Check } from "lucide-react"
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
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getFirebaseProduct(params.id as string)
      .then((p) => { if (p) setProduct(p) })
      .finally(() => setLoading(false))
  }, [params.id])

  const isSoldOut = product?.status === "sold_out"
  const isComingSoon = product?.status === "coming_soon"
  const canPurchase = !isSoldOut && !isComingSoon

  const handleShare = () => {
    if (!product) return

    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // User cancelled share
      })
    } else {
      setShowShareModal(true)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out ${product?.name} on Emmaxx!`)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
  }

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out ${product?.name} on Emmaxx: ${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

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
            <div className="flex items-center justify-between">
              <div
                className="mb-2 text-xs uppercase tracking-widest text-primary"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
              >
                {product.category === "wigs" ? "Luxury Wigs" : "Swimwear"}
              </div>
              <button
                onClick={handleShare}
                className="mb-2 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Share product"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
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

      {/* Share Modal (Fallback) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
                Share this product
              </h3>
              <button onClick={() => setShowShareModal(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={copyToClipboard}
                className="flex w-full items-center gap-3 rounded-md border border-border/40 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
                <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)" }}>
                  {copied ? "Copied!" : "Copy link"}
                </span>
              </button>
              <button
                onClick={shareToTwitter}
                className="flex w-full items-center gap-3 rounded-md border border-border/40 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)" }}>
                  Share on Twitter
                </span>
              </button>
              <button
                onClick={shareToFacebook}
                className="flex w-full items-center gap-3 rounded-md border border-border/40 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)" }}>
                  Share on Facebook
                </span>
              </button>
              <button
                onClick={shareToWhatsApp}
                className="flex w-full items-center gap-3 rounded-md border border-border/40 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.006 2.01a9.927 9.927 0 00-6.41 2.365.995.995 0 01-.298.215L4.82 5.07a1 1 0 01-1.332-.324A9.95 9.95 0 002 12c0 5.523 4.477 10 10 10s10-4.477 10-10-4.477-10-10-10zm3.545 14.523c-1.053.537-2.238.827-3.545.827-3.452 0-6.29-2.838-6.29-6.29 0-3.452 2.838-6.29 6.29-6.29 3.452 0 6.29 2.838 6.29 6.29 0 1.307-.29 2.492-.827 3.545-.2.393-.456.756-.764 1.081l-.72.72a1 1 0 01-.709.293h-.002a1 1 0 01-.707-.293l-.72-.72a1 1 0 01-.215-.297zm-1.823-7.785c.5.5.5 1.307 0 1.807l-2.5 2.5c-.5.5-1.307.5-1.807 0-.5-.5-.5-1.307 0-1.807l2.5-2.5c.5-.5 1.307-.5 1.807 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="flex-1 text-left" style={{ fontFamily: "var(--font-body)" }}>
                  Share on WhatsApp
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}