import {
  Apple,
  Baby,
  Brain,
  ClipboardList,
  FlaskConical,
  Flower2,
  HeartPulse,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react"

const icons: { test: (slug: string) => boolean; icon: LucideIcon }[] = [
  { test: (slug) => slug.startsWith("simptomi"), icon: HeartPulse },
  { test: (slug) => slug.startsWith("izsledvani"), icon: FlaskConical },
  { test: (slug) => slug.startsWith("detsko"), icon: Baby },
  { test: (slug) => slug.startsWith("jensko"), icon: Flower2 },
  { test: (slug) => slug.startsWith("psihichno"), icon: Brain },
  { test: (slug) => slug.startsWith("saveti") || slug.startsWith("predi"), icon: ClipboardList },
  { test: (slug) => slug.startsWith("hranene"), icon: Apple },
]

export function categoryIcon(slug: string) {
  return icons.find((item) => item.test(slug))?.icon ?? LayoutGrid
}

export function CategoryIcon({ slug, className = "size-4" }: { slug: string; className?: string }) {
  const Icon = categoryIcon(slug)
  return <Icon className={className} aria-hidden />
}
