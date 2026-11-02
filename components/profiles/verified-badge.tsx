import { BadgeCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function VerifiedBadge() {
  return (
    <Badge
      variant="outline"
      title="Верифициран профил"
      className="border-primary/55 bg-white/80 text-primary"
    >
      <BadgeCheck aria-hidden />
      Верифициран
    </Badge>
  )
}
