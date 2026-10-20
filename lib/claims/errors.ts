export function friendlyDbError(
  error: { message?: string } | null | undefined,
  fallback = "Нещо се обърка. Опитайте отново."
) {
  const message = error?.message ?? ""
  if (/is_claimed|claimed_by|claim_requests|email_verified|code_hash|code_expires_at/.test(message)) {
    return "Базата още няма claim схемата. Пуснете файла supabase/migrations/003_claims.sql в Supabase SQL Editor."
  }
  return fallback
}
