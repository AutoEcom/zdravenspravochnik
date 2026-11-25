import Script from "next/script"

import { CookieConsent } from "@/components/layout/cookie-consent"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"

const gaMeasurementId = "G-YY7ELLV030"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}');
        `}
      </Script>
      <a
        href="#content"
        className="sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:inline-flex focus:h-11 focus:items-center focus:rounded-xl focus:bg-primary focus:px-4 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none"
      >
        Към съдържанието
      </a>
      <Header />
      <div id="content" className="flex-1">
        {children}
      </div>
      <Footer />
      <CookieConsent />
    </div>
  )
}
