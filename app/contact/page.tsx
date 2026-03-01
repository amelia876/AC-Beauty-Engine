"use client"

import { useState } from "react"
import { Footer } from "@/components/footer"
import { MapPin, Phone, Clock, Send } from "lucide-react"

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
        fill="currentColor"
      />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.46a4.85 4.85 0 01-3.58-1.59V6.69h3.58z"
        fill="currentColor"
      />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !message) return

    setSending(true)
    setError("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Something went wrong")
      }

      setSent(true)
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Please try WhatsApp or Instagram instead.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <section className="border-b border-border/40 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-24">
          <p
            className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground"
            style={{ fontFamily: "var(--font-body)" }}
          >
            We Would Love To Hear From You
          </p>
          <h1
            className="text-balance text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Contact Us
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">

          {/* Contact Info */}
          <div>
            <h2
              className="mb-3 text-2xl tracking-tight text-foreground sm:text-3xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {"Let's Connect"}
            </h2>
            <p
              className="mb-10 max-w-md text-sm leading-relaxed text-muted-foreground"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Have a question about an order, need help choosing the perfect wig, or want to know more about our swimwear? Reach out to us anytime!
            </p>

            <div className="space-y-8">
              {/* WhatsApp */}
              <a
                href="https://wa.me/18764973320"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-5 transition-colors"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-border transition-all group-hover:border-green-400 group-hover:bg-green-400/10">
                  <WhatsAppIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-green-500" />
                </span>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    WhatsApp
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    876-497-3320
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Message us directly for fastest response
                  </p>
                </div>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/ac.beautyengine876?igsh=MTM5b3FiOHU1Y2Z1YQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-5 transition-colors"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-border transition-all group-hover:border-pink-400 group-hover:bg-pink-400/10">
                  <InstagramIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-pink-500" />
                </span>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Instagram
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    @ac.beautyengine876
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Follow us for new arrivals and style inspo
                  </p>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@ac.beautyengine876"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-5 transition-colors"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-border transition-all group-hover:border-cyan-400 group-hover:bg-cyan-400/10">
                  <TikTokIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-cyan-500" />
                </span>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    TikTok
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    @ac.beautyengine876
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Watch our latest wig installs and tutorials
                  </p>
                </div>
              </a>

              {/* Location */}
              <div className="flex items-start gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-border">
                  <MapPin className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </span>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Location
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Mandeville, Manchester, Jamaica
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    In-person pickup available in Mandeville and surrounding areas
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-border">
                  <Clock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </span>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Response Hours
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Mon - Sat: 9:00 AM - 7:00 PM
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground/70"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    We usually respond within a few hours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="border border-border/60 bg-card p-8 sm:p-10">
              <h2
                className="mb-2 text-2xl tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Send a Message
              </h2>
              <p
                className="mb-8 text-sm text-muted-foreground"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Fill out the form below and we will get back to you as soon as possible.
              </p>

              {sent && (
                <div
                  className="mb-6 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Message sent successfully! We will get back to you soon.
                </div>
              )}

              {error && (
                <div
                  className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Question</option>
                    <option value="custom">Custom Order Request</option>
                    <option value="delivery">Delivery Information</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full resize-none border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="group inline-flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 text-sm uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}
                >
                  {sending ? "Sending..." : "Send Message"}
                  {!sending && <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
