import type { Metadata, Viewport } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AC BEAUTY ENGINE 876 - Premium Swimwear & Wigs",
  description:
    "Shop our collection of beautiful swimsuits and stunning wigs at AC BEAUTY ENGINE 876",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="mt-20">
              {children}
            </main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
