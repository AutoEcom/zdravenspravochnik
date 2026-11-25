export function friendlyDbError(
  error: { message?: string } | null | undefined,
  fallback = "Нещо се обърка. Опитайте отново."
) {
  const message = error?.message ?? ""
  if (/failed_attempts|code_send_count|code_sent_at/.test(message)) {
    return "Базата още няма лимитите за кодове. Пуснете supabase/migrations/011_profile_and_claim_security.sql в Supabase SQL Editor."
  }
  if (/is_claimed|claimed_by|claim_requests|email_verified|code_hash|code_expires_at/.test(message)) {
    return "Базата още няма claim схемата. Пуснете файла supabase/migrations/003_claims.sql в Supabase SQL Editor."
  }
  return fallback
}
