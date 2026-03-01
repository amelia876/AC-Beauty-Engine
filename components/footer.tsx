"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/firebase" // adjust path to your firebase config
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="currentColor" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.46a4.85 4.85 0 01-3.58-1.59V6.69h3.58z" fill="currentColor" />
    </svg>
  )
}

export function Footer() {
  const [subEmail, setSubEmail] = useState("")
  const [subName, setSubName] = useState("")
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subMessage, setSubMessage] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subEmail) return

    setSubStatus("loading")
    setSubMessage("")

    try {
      // Add a new document to the "subscriptions" collection in Firestore
      await addDoc(collection(db, "subscriptions"), {
        email: subEmail,
        name: subName || null,          // optional name
        subscribedAt: serverTimestamp(), // Firebase server timestamp
        source: "footer_newsletter",
      })

      setSubStatus("success")
      setSubMessage("Thanks for subscribing! We'll be in touch.")
      setSubEmail("")
      setSubName("")
    } catch (error) {
      console.error("Subscription error:", error)
      setSubStatus("error")
      setSubMessage("Something went wrong. Please try again later.")
    }
  }

  return (
    <footer className="border-t border-border bg-foreground">

      {/* Newsletter */}
      <div className="border-b border-background/10">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h3 className="font-serif text-2xl tracking-tight text-background sm:text-3xl">
              Stay in the Loop
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-background/50">
              Be the first to know about new swimsuits, wig drops, exclusive deals, and discounts.
            </p>
            {subStatus === "success" ? (
              <div className="mt-6 border border-green-400/30 bg-green-400/10 px-6 py-3 text-sm text-green-300">
                {subMessage}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-6 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Your name"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="h-12 flex-1 border border-background/20 bg-background/5 px-4 text-sm text-background placeholder:text-background/30 focus:border-primary focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  required
                  className="h-12 flex-1 border border-background/20 bg-background/5 px-4 text-sm text-background placeholder:text-background/30 focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subStatus === "loading"}
                  className="h-12 whitespace-nowrap border border-primary bg-primary px-6 text-xs uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary disabled:opacity-60"
                >
                  {subStatus === "loading" ? "Joining..." : "Join Now"}
                </button>
              </form>
            )}
            {subStatus === "error" && (
              <p className="mt-3 text-xs text-red-400">{subMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">

          {/* Logo */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image src="/images/logo.jpeg" alt="AC BEAUTY ENGINE 876 Logo" width={100} height={100} className="rounded-xl shadow-lg" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-background/60">
              Your one-stop destination for premium wigs and stunning swimwear. Confidence starts here.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-background/40">Shop</h3>
            <ul className="mt-5 space-y-3">
              {[
                { href: "/wigs", label: "Wigs Collection" },
                { href: "/swimsuits", label: "Swimsuits Collection" },
                { href: "/reviews", label: "Reviews" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/cart", label: "Shopping Cart" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="group inline-flex items-center text-sm text-background/70 transition-colors hover:text-background">
                    <span className="mr-2 h-px w-0 bg-primary transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-background/40">Get In Touch</h3>
            <ul className="mt-5 space-y-4">
              <li>
                <a href="https://wa.me/18764973320" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-sm text-background/70 transition-colors hover:text-background">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-background/15 transition-all group-hover:border-green-400 group-hover:bg-green-400/10">
                    <WhatsAppIcon className="h-4 w-4 text-background/50 transition-colors group-hover:text-green-400" />
                  </span>
                  876-497-3320
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/ac.beautyengine876?igsh=MTM5b3FiOHU1Y2Z1YQ==" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-sm text-background/70 transition-colors hover:text-background">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-background/15 transition-all group-hover:border-pink-400 group-hover:bg-pink-400/10">
                    <InstagramIcon className="h-4 w-4 text-background/50 transition-colors group-hover:text-pink-400" />
                  </span>
                  @ac.beautyengine876
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@ac.beautyengine876" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-sm text-background/70 transition-colors hover:text-background">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-background/15 transition-all group-hover:border-cyan-400 group-hover:bg-cyan-400/10">
                    <TikTokIcon className="h-4 w-4 text-background/50 transition-colors group-hover:text-cyan-400" />
                  </span>
                  @ac.beautyengine876
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-background/40">Follow Us</h3>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://www.instagram.com/ac.beautyengine876?igsh=MTM5b3FiOHU1Y2Z1YQ==" target="_blank" rel="noopener noreferrer" className="group flex h-12 w-12 items-center justify-center rounded-full border border-background/20 transition-all duration-300 hover:border-pink-400 hover:bg-pink-400/10 hover:scale-110" aria-label="Follow us on Instagram">
                <InstagramIcon className="h-5 w-5 text-background/60 transition-colors group-hover:text-pink-400" />
              </a>
              <a href="https://wa.me/18764973320" target="_blank" rel="noopener noreferrer" className="group flex h-12 w-12 items-center justify-center rounded-full border border-background/20 transition-all duration-300 hover:border-green-400 hover:bg-green-400/10 hover:scale-110" aria-label="Message us on WhatsApp">
                <WhatsAppIcon className="h-5 w-5 text-background/60 transition-colors group-hover:text-green-400" />
              </a>
              <a href="https://www.tiktok.com/@ac.beautyengine876" target="_blank" rel="noopener noreferrer" className="group flex h-12 w-12 items-center justify-center rounded-full border border-background/20 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-400/10 hover:scale-110" aria-label="Follow us on TikTok">
                <TikTokIcon className="h-5 w-5 text-background/60 transition-colors group-hover:text-cyan-400" />
              </a>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-background/40">
              DM us on Instagram, TikTok, or message us on WhatsApp for inquiries and custom orders.
            </p>
          </div>
        </div>

        <div className="h-px bg-background/10" />

        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <p className="text-xs text-background/40">
            {"© "}{new Date().getFullYear()}{" AC BEAUTY ENGINE 876. All rights reserved."}
          </p>
          <p className="text-xs text-background/30">Mandeville, Jamaica</p>
        </div>
      </div>
    </footer>
  )
}