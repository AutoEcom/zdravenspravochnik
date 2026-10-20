import type { UserRole } from "@/types/database"

const roles: UserRole[] = ["patient", "doctor", "facility_admin", "admin"]

export function isUserRole(value: string | null | undefined): value is UserRole {
  return roles.includes(value as UserRole)
}

export function homeForRole(role: UserRole | null | undefined) {
  if (role === "admin") return "/admin"
  if (role === "doctor" || role === "facility_admin") return "/dashboard"
  return "/claim"
}

export function canOpenDashboard(role: UserRole | null | undefined) {
  return role === "doctor" || role === "facility_admin" || role === "admin"
}

export function accountNav(role: UserRole | null | undefined, signedIn: boolean) {
  if (!signedIn) return { href: "/login", label: "Вход" }
  if (role === "admin") return { href: "/admin", label: "Админ" }
  if (role === "doctor" || role === "facility_admin") return { href: "/dashboard", label: "Табло" }
  return { href: "/claim", label: "Профил" }
}

export function roleAfterClaim(current: UserRole, target: "doctor" | "facility"): UserRole {
  if (current === "admin") return "admin"
  if (target === "facility") return "facility_admin"
  if (current === "facility_admin") return "facility_admin"
  return "doctor"
}
