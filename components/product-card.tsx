"use client"

import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { ShoppingCart } from "lucide-react"

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const hasStock = product.quantity !== undefined && product.quantity !== null
  const outOfStock = hasStock && product.quantity! <= 0
  const lowStock = hasStock && product.quantity! > 0 && product.quantity! <= 3
  const isSoldOut = product.status === "sold_out" || outOfStock
  const isComingSoon = product.status === "coming_soon"
  const canPurchase = !isSoldOut && !isComingSoon

  return (
    <Link href={`/products/${product.id}`} className="group block cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
            isSoldOut ? "opacity-60 grayscale" : ""
          }`}
        />

        {/* Status badges */}
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
          <div>
            {isSoldOut && (
              <span className="inline-block bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                Sold Out
              </span>
            )}
            {isComingSoon && (
              <span className="inline-block bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                Coming Soon
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {product.salePrice && canPurchase && (
              <span className="bg-primary px-3 py-1 text-xs font-medium uppercase tracking-widest text-background">
                Sale
              </span>
            )}
            {lowStock && canPurchase && (
              <span className="bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                Only {product.quantity} left
              </span>
            )}
          </div>
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <span className="border-2 border-white bg-red-600/90 px-6 py-2 text-sm font-bold uppercase tracking-widest text-white">
              Sold Out
            </span>
          </div>
        )}

        {/* Coming soon overlay */}
        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
            <span className="border-2 border-white bg-amber-500/90 px-6 py-2 text-sm font-bold uppercase tracking-widest text-white">
              Coming Soon
            </span>
          </div>
        )}

        {/* Add to Cart hover button - only show for available products */}
        {canPurchase && (
          <div className="absolute inset-0 flex items-end justify-center bg-foreground/0 p-6 opacity-0 transition-all duration-300 group-hover:bg-foreground/10 group-hover:opacity-100">
            <button
              suppressHydrationWarning
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addToCart(product)
              }}
              className="flex items-center gap-2 border border-background bg-background px-6 py-3 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1 text-center">
        <h3 className={`text-sm font-medium tracking-wide ${isSoldOut ? "text-muted-foreground" : "text-foreground"}`}>
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {product.description}
        </p>
        <div className="pt-1">
          {isSoldOut ? (
            <p className="text-sm font-medium text-red-500 line-through">${product.price.toFixed(2)}</p>
          ) : isComingSoon ? (
            <p className="text-sm font-medium text-amber-600">${product.price.toFixed(2)}</p>
          ) : product.salePrice ? (
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm font-medium text-primary">${product.salePrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</p>
            </div>
          ) : (
            <p className="text-sm font-medium text-primary">${product.price.toFixed(2)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
