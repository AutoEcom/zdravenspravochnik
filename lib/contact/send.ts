export type ContactKind = "partner" | "general" | "about"

export type ContactMessage = {
  kind: ContactKind
  name: string
  phone: string
  email: string
  organization: string
  budget: string
  message: string
}

const subjects: Record<ContactKind, string> = {
  partner: "[Партньор]",
  general: "[Контакт]",
  about: "[За нас]",
}

function bodyLines(input: ContactMessage) {
  const lines = [
    `Име: ${input.name}`,
    `Телефон: ${input.phone}`,
    `Имейл: ${input.email}`,
  ]
  if (input.organization) lines.push(`Организация / сайт: ${input.organization}`)
  if (input.kind === "partner" && input.budget) lines.push(`Бюджет: ${input.budget}`)
  if (input.message) lines.push(`Съобщение: ${input.message}`)
  return lines.join("\n")
}

export async function deliverContactMessage(input: ContactMessage) {
  const text = bodyLines(input)
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    throw new Error("Имейлът не беше изпратен.")
  }

  const from = process.env.RESEND_FROM?.trim()
  if (!from) {
    throw new Error("Липсва RESEND_FROM за изпращане на съобщението.")
  }

  const to = (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  if (to.length === 0) {
    throw new Error("Липсва CONTACT_TO_EMAIL за получаване на съобщението.")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: input.email,
      subject: `${subjects[input.kind]} ${input.name}`,
      text,
    }),
  })

  if (!response.ok) {
    throw new Error("Имейлът не беше изпратен.")
  }

  return { simulated: false as const }
}
