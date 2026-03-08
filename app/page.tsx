"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { products as localProducts } from "@/lib/products"
import { getAllProducts } from "@/lib/firebase-products"
import type { Product } from "@/lib/products"

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>(localProducts)

  useEffect(() => {
    getAllProducts().then(setAllProducts)
  }, [])

  const featuredProducts = allProducts.slice(0, 6)

  return (
    <div className="min-h-screen">
      {/* ✨ New: Founder & CEO Section */}
      <section className="relative border-t border-pink-100 bg-pink-50/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
            {/* Founder Image – assumes transparent PNG */}
            <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-full border-4 border-amber-200/80 shadow-xl md:h-80 md:w-80">
              <Image
                src="/ceo.png" // Replace with your actual transparent image
                alt="Founder & CEO"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 256px, 320px"
                priority
              />
            </div>

            {/* Message */}
            <div className="max-w-2xl text-center md:text-left">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-700">
                HAPPY INTERNATIONAL WOMEN’S DAY
              </p>
              <h2 className="mb-6 font-serif text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
                “Every woman deserves to feel <br className="hidden sm:block" />confident, beautiful, and seen.”
              </h2>
              <blockquote className="space-y-4 text-base text-foreground/70 sm:text-lg">
                <p>
                  Today we celebrate the strength, brilliance, and resilience of women everywhere.
                  I am constantly inspired by the innovation, leadership, and dedication 
                  that women bring to every space they enter. Your voices shape our communities,
                  your ideas drive progress, and your courage continues to break barriers.
                  Happy International Women’s Day to the women who lead, create, nurture, and 
                  inspire. The world is better because of you. 🌸✨

                </p>
                <footer className="mt-6 font-serif text-lg text-foreground">
                  — Amelia Cole
                  <span className="block text-sm font-light tracking-wide text-foreground/60">
                    Founder & CEO
                  </span>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
      </section>

      {/* Hero */}
      <section className="relative min-h-[85vh] bg-secondary/20">
        <div className="mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center lg:px-8">
          {/* 🌸 Women's Day Banner */}
          <div className="mb-8 inline-block rounded-full border border-pink-200 bg-pink-100 px-8 py-4 text-pink-800 shadow-md">
            <div className="text-xl font-medium md:text-2xl">🌸 Happy Women's Day! 🌸</div>
            <div className="text-base opacity-90 md:text-lg">
              Celebrating the strength, beauty, and resilience of women everywhere.
            </div>
          </div>

          <div className="max-w-4xl space-y-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Curated Collection 2026
            </p>
            <h1 className="text-balance font-serif text-6xl leading-[1.1] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              Redefine Your
              <span className="block text-primary">Beauty</span>
            </h1>
            <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-foreground/70 sm:text-lg">
              Discover handpicked wigs and swimwear that celebrate your unique style. Luxury meets confidence in every piece.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Link
                href="/wigs"
                className="group inline-flex items-center gap-2 border border-foreground bg-foreground px-8 py-4 text-sm uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground"
              >
                Explore Wigs
                <span className="transition-transform group-hover:translate-x-1">{"→"}</span>
              </Link>
              <Link
                href="/swimsuits"
                className="group inline-flex items-center gap-2 border border-foreground bg-transparent px-8 py-4 text-sm uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-background"
              >
                Explore Swimsuits
                <span className="transition-transform group-hover:translate-x-1">{"→"}</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* Featured Products */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Handpicked For You
            </p>
            <h2 className="text-balance font-serif text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Featured Collection
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/wigs"
              className="group inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm uppercase tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              View All Products
              <span className="transition-transform group-hover:translate-x-1">{"→"}</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}