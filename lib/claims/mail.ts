export async function deliverClaimCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    console.log(`[claim] verification code for ${email}: ${code}`)
    return { simulated: true as const }
  }

  const from = process.env.RESEND_FROM?.trim()
  if (!from) {
    throw new Error("Липсва RESEND_FROM за изпращане на кода.")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Код за потвърждение – Здравен справочник",
      text: `Вашият код за потвърждение е ${code}. Валиден е 15 минути.`,
    }),
  })

  if (!response.ok) {
    throw new Error("Имейлът с кода не беше изпратен.")
  }

  return { simulated: false as const }
}
