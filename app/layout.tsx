import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { NavigationProgress } from "@/components/layout/navigation-progress"
import { ThemeProvider } from "@/components/theme-provider"
import { JsonLd } from "@/components/seo/json-ld"
import { organizationJsonLd } from "@/components/seo/schemas"
import { Toaster } from "@/components/ui/sonner"
import { canonicalOrigin, siteConfig } from "@/lib/site"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin()),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: canonicalOrigin(),
    siteName: siteConfig.name,
    locale: "bg_BG",
    type: "website",
    images: [{ url: "/og-default.png", alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/og-default.png"],
  },
  verification: {
    google: "C-WXP-NzFKnppz1Nh_kQhNKARmpHXziyI3jrr_bONYk",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="bg"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
          disableTransitionOnChange
        >
          <NavigationProgress />
          <JsonLd data={organizationJsonLd()} />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
