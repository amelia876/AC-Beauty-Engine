"use client"

import Image from "next/image"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <section className="border-b border-border/40 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-24">
          <p
            className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Our Story
          </p>
          <h1
            className="text-balance text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            About Us
          </h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <Image
                src="/images/logo.jpeg"
                alt="AC Beauty Engine 876"
                width={500}
                height={500}
                className="mx-auto w-full max-w-sm"
              />
            </div>
            <div>
              <p
                className="mb-4 text-xs uppercase tracking-[0.3em] text-primary"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Who We Are
              </p>
              <h2
                className="mb-6 text-balance text-3xl tracking-tight text-foreground sm:text-4xl"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Beauty. Confidence.{" "}
                <span className="text-primary">You.</span>
              </h2>
              <div className="space-y-4">
                <p
                  className="text-sm leading-relaxed text-foreground/80"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Welcome to AC Beauty Engine 876 - your go-to destination for premium wigs and gorgeous swimwear, straight from the heart of Mandeville, Jamaica. We believe every woman deserves to feel confident, beautiful, and unstoppable.
                </p>
                <p
                  className="text-sm leading-relaxed text-foreground/80"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  What started as a passion for beauty and fashion has grown into a brand that women across Jamaica trust for quality, style, and affordability. Every wig we offer is carefully selected for its quality, softness, and natural look. Every swimsuit is chosen to make you feel your absolute best.
                </p>
                <p
                  className="text-sm leading-relaxed text-foreground/80"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  We are more than just a business - we are a community of women who uplift, inspire, and celebrate each other. When you shop with AC Beauty Engine 876, you are not just buying a product, you are investing in your confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="border-y border-border/40 bg-secondary/10 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p
              className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              What We Stand For
            </p>
            <h2
              className="text-balance text-3xl tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Our Promise To You
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Premium Quality",
                description:
                  "Every wig and swimsuit is handpicked and quality-checked to ensure you get nothing but the best. From 100% human hair to perfectly stitched swimwear, quality is our standard.",
              },
              {
                title: "Affordable Luxury",
                description:
                  "Looking good should not break the bank. We offer high-quality products at prices that are fair and accessible because every woman deserves to feel luxurious.",
              },
              {
                title: "Customer First",
                description:
                  "From the moment you browse our collection to the moment your order arrives, we are here to make your experience seamless. Your satisfaction is our top priority.",
              },
              {
                title: "Jamaican Proud",
                description:
                  "Based in beautiful Mandeville, Manchester, we proudly serve women across Jamaica. We understand Caribbean beauty and what our women want and need.",
              },
              {
                title: "Confidence Builder",
                description:
                  "Our products are more than accessories - they are confidence boosters. Whether it is a new wig for a fresh look or a swimsuit for the beach, we want you to feel amazing.",
              },
              {
                title: "Community Love",
                description:
                  "We are building more than a brand. Through our platform, we celebrate and connect women who love beauty, fashion, and living their best lives.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="border border-border/40 bg-background p-8 transition-colors hover:border-primary/30"
              >
                <h3
                  className="mb-3 text-lg tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {value.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-muted-foreground"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2
            className="mb-4 text-balance text-3xl tracking-tight text-foreground sm:text-4xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Ready to Elevate Your Look?
          </h2>
          <p
            className="mb-8 text-sm leading-relaxed text-muted-foreground"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Browse our curated collection of wigs and swimwear, or reach out to us directly for custom orders and styling advice.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/wigs"
              className="group inline-flex items-center gap-2 border border-foreground bg-foreground px-8 py-4 text-sm uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
            >
              Shop Wigs
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
            <Link
              href="/swimsuits"
              className="group inline-flex items-center gap-2 border border-foreground bg-transparent px-8 py-4 text-sm uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-background"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
            >
              Shop Swimsuits
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
