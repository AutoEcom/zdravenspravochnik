"use client"

import { ContactModal } from "@/components/contact/contact-modal"

export function PartnerInquiry({ appearance = "button" }: { appearance?: "button" | "text" }) {
  return <ContactModal kind="partner" appearance={appearance} label="Станете партньор" />
}
