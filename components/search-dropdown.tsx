"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X, Loader2 } from "lucide-react"
import type { Product } from "@/lib/products"
import { searchProducts } from "@/lib/firebase-products"

export function SearchDropdown() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setTerm("")
    setResults([])
  }, [])

  useEffect(() => {
    if (!term.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchProducts(term)
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [term])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [close])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [close])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-primary"
        aria-label="Search products"
      >
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products..."
            className="h-9 w-48 border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:w-64"
          />
          {term && (
            <button
              onClick={() => { setTerm(""); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={close}
          className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-primary"
          aria-label="Close search"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {term.trim() && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 border border-border bg-background shadow-lg sm:w-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {"No products found for \u201c"}{term}{"\u201d"}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={close}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-muted/30">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {product.category}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      ${(product.salePrice ?? product.price).toFixed(2)}
                    </p>
                  </div>
                  {product.status === "sold_out" && (
                    <span className="shrink-0 bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
                      Sold Out
                    </span>
                  )}
                  {product.status === "coming_soon" && (
                    <span className="shrink-0 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
