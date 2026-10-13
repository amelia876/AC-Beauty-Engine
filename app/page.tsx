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
    getAllProducts().then(setAllProducts).catch((error) => {
      console.error("Unable to load products:", error)
    })
  }, [])

  const featuredProducts = allProducts.slice(0, 6)

  return (
    <div className="min-h-screen bg-[#fffaf9] text-[#592b40]">

      {/* Breast Cancer Awareness Hero */}
      <section className="relative w-full bg-gradient-to-b from-[#fdf2f6] via-[#fbe8f0] to-[#fffaf9]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 sm:gap-6 sm:px-10 md:flex-row md:gap-6 md:py-10 lg:gap-8">

          {/* Pinkober image — on the left */}
          <div className="flex-shrink-0 md:w-1/2">
            <Image
              src="/Pinkober.png"
              alt="Pinktober — Breast Cancer Awareness"
              width={700}
              height={700}
              className="mx-auto h-72 w-auto object-contain sm:h-80 md:h-[26rem] lg:h-[30rem]"
              priority
            />
          </div>

          {/* Text content — centered on the right */}
          <div className="flex flex-1 flex-col items-center text-center">
            <p className="font-serif text-4xl italic leading-none text-[#ec407a] sm:text-5xl md:text-6xl lg:text-7xl">
              Breast Cancer
            </p>
            <h1 className="mt-2 text-5xl font-black uppercase leading-[0.95] tracking-tight text-[#ad1457] sm:text-6xl md:text-7xl lg:text-8xl">
              Awareness
              <span className="block">Month</span>
            </h1>

            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-[#ec407a] sm:text-base md:text-lg">
              Join the Fight
            </p>

            <p className="mt-4 max-w-md text-sm leading-6 text-[#795c68] sm:text-base">
              AC Beauty Engine 876 proudly supports and stands with every
              woman navigating her journey through breast cancer —
              survivors, fighters, thrivers, and those we hold in memory.
              This October, we honour their strength, amplify the importance
              of early detection, and celebrate the courage that lives in
              every story.
            </p>

            <a
              href="#jamaica-awareness"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#ec407a]/30 bg-white/70 px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#ad1457] backdrop-blur-sm transition-all hover:border-[#ec407a] hover:bg-[#ec407a] hover:text-white"
            >
              Explore Awareness Events
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Jamaican Awareness Events */}
      <section
        id="jamaica-awareness"
        className="bg-[#f8edf1] px-6 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-12 text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#a05270]">
              Coming together for the cause
            </p>
            <h2 className="font-serif text-4xl text-[#632b44] sm:text-5xl">
              Awareness in Jamaica
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#795c68] sm:text-base">
              Discover local activities, community initiatives, and
              opportunities to learn and show your support.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {/* Jamaica Reach to Recovery */}
            <article className="flex flex-col border border-[#ead3dc] bg-[#fffaf9] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#8e4962]/5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a05270]">
                October 25, 2026
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#632b44]">
                Jamaica Reach to Recovery Pink Run
              </h3>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#9b7180]">
                Emancipation Park, Kingston
              </p>
              <p className="mt-5 flex-1 text-sm leading-7 text-[#795c68]">
                Explore the Pink Run and learn how you can participate in a
                Jamaican awareness initiative.
              </p>
              <a
                href="https://www.pinkrunjm.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 border-b border-[#a05270]/50 pb-2 text-xs uppercase tracking-[0.12em] text-[#853b59] hover:text-[#632b44]"
              >
                Visit Official Website →
              </a>
            </article>

            {/* NHEF: In the Pink */}
            <article className="flex flex-col border border-[#ead3dc] bg-[#fffaf9] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#8e4962]/5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a05270]">
                Health Education
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#632b44]">
                NHEF: In the Pink
              </h3>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#9b7180]">
                Breast Health Awareness
              </p>
              <p className="mt-5 flex-1 text-sm leading-7 text-[#795c68]">
                Explore the advertised breast health session and check the
                organiser&apos;s website for current details and eligibility.
              </p>
              <a
                href="https://nhef.gov.jm/in-the-pink-2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 border-b border-[#a05270]/50 pb-2 text-xs uppercase tracking-[0.12em] text-[#853b59] hover:text-[#632b44]"
              >
                View Information →
              </a>
            </article>

            {/* Pink Praise Concert */}
            <article className="flex flex-col border border-[#ead3dc] bg-[#fffaf9] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#8e4962]/5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a05270]">
                Concert & Fundraiser
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#632b44]">
                Pink Praise Concert
              </h3>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#9b7180]">
                Portmore, St. Catherine
              </p>
              <p className="mt-5 flex-1 text-sm leading-7 text-[#795c68]">
                An uplifting evening of praise, worship, and community in
                support of breast cancer awareness. Check the event page for
                details on tickets and performers.
              </p>
              <a
                href="https://stayhappening.com/e/pink-praise-concert-E10IIO3G8VE"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 border-b border-[#a05270]/50 pb-2 text-xs uppercase tracking-[0.12em] text-[#853b59] hover:text-[#632b44]"
              >
                View Event Details →
              </a>
            </article>

          </div>

          <p className="mt-8 text-center text-xs leading-6 text-[#876b76]">
            Please confirm event dates, registration, availability, and
            eligibility with the respective organisers before attending.
            Listings do not imply sponsorship or endorsement by AC Beauty
            Engine 876.
          </p>
        </div>
      </section>

      {/* Featured Products - Existing Store Functionality */}
      <section className="bg-[#fffaf9] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mb-16 text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#a05270]">
              Handpicked For You
            </p>
            <h2 className="text-balance font-serif text-4xl tracking-tight text-[#632b44] sm:text-5xl lg:text-6xl">
              Your Beauty, Your Confidence
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#795c68]">
              Celebrate your unique style with pieces curated to help you
              feel confident, beautiful, and unapologetically yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/wigs"
              className="group inline-flex items-center gap-2 border border-[#853b59] bg-[#853b59] px-8 py-4 text-sm uppercase tracking-widest text-white transition-all hover:bg-transparent hover:text-[#853b59]"
            >
              Explore Wigs
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/swimsuits"
              className="group inline-flex items-center gap-2 border border-[#853b59] bg-transparent px-8 py-4 text-sm uppercase tracking-widest text-[#853b59] transition-all hover:bg-[#853b59] hover:text-white"
            >
              Explore Swimsuits
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Return to your regular brand message */}
      <section className="border-t border-[#ead3dc] bg-[#f8edf1] px-6 py-14 text-center">
        <p className="font-serif text-2xl italic text-[#632b44] sm:text-3xl">
          Beauty, compassion, and community.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#9b7180]">
          With love, AC Beauty Engine 876
        </p>
      </section>

      <Footer />
    </div>
  )
}