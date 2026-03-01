"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Menu, X, LogOut, Shield, User, Package } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { SearchDropdown } from "@/components/search-dropdown"

const navLinks = [
  { href: "/wigs", label: "Wigs" },
  { href: "/swimsuits", label: "Swimsuits" },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

function UserMenu() {
  const { user, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (!user) {
    return (
      <Link
        href="/signin"
        className="flex h-9 items-center gap-2 border border-border px-3 text-xs uppercase tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <User className="h-4 w-4" strokeWidth={1.5} />
        <span className="max-sm:sr-only">Sign In</span>
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-border transition-colors hover:border-primary"
        aria-label="Account menu"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || "User"}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden border border-border bg-background shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{user.displayName || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/my-orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Package className="h-4 w-4" strokeWidth={1.5} />
              My Orders
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <Shield className="h-4 w-4 text-primary" strokeWidth={1.5} />
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={() => {
                signOut()
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { totalItems } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAdmin, signOut: doSignOut } = useAuth()

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80">
            <Image
              src="/images/logo.jpeg"
              alt="AC BEAUTY ENGINE 876"
              width={48}
              height={48}
              className="rounded-md"
              priority
            />
            <span className="font-serif text-lg tracking-tight text-foreground max-lg:sr-only">
              AC BEAUTY ENGINE 876
            </span>
          </Link>

          {/* Desktop navigation links */}
          <ul
            className="items-center gap-6 max-md:!hidden md:flex lg:gap-10"
            style={{ display: "flex" }}
            role="navigation"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group relative whitespace-nowrap text-sm uppercase tracking-[0.15em] text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side: Search + User + Cart + Mobile hamburger */}
          <div className="flex shrink-0 items-center gap-3">
            <SearchDropdown />

            <UserMenu />

            <Link href="/cart" className="group relative transition-colors hover:text-primary">
              <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Shopping cart</span>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-primary md:!hidden"
              style={{ display: "flex" }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-md md:!hidden" style={{ display: "flex" }}>
          <div className="flex w-full flex-col px-6 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-border/20 py-4 text-sm uppercase tracking-[0.15em] text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile auth links */}
            {user ? (
              <>
                <Link
                  href="/my-orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 border-b border-border/20 py-4 text-sm uppercase tracking-[0.15em] text-foreground transition-colors hover:text-primary"
                >
                  <Package className="h-4 w-4" strokeWidth={1.5} />
                  My Orders
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 border-b border-border/20 py-4 text-sm uppercase tracking-[0.15em] text-primary"
                  >
                    <Shield className="h-4 w-4" strokeWidth={1.5} />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { doSignOut(); setMobileOpen(false) }}
                  className="flex items-center gap-3 py-4 text-left text-sm uppercase tracking-[0.15em] text-foreground transition-colors hover:text-primary"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-4 text-sm uppercase tracking-[0.15em] text-foreground transition-colors hover:text-primary"
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
