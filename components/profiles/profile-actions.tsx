import { Globe, Mail, Phone } from "lucide-react"

import { ShareButton } from "@/components/profiles/share-button"
import { buttonVariants } from "@/components/ui/button"

export function ProfileActions({
  phone,
  email,
  website,
  shareTitle,
  shareUrl,
}: {
  phone: string | null
  email: string | null
  website: string | null
  shareTitle: string
  shareUrl: string
}) {
  return (
    <nav
      aria-label="Бързи действия"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 glass px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:rounded-2xl md:border md:p-4"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-4">
        {phone ? (
          <a href={`tel:${phone}`} className={buttonVariants({ variant: "accent", className: "w-full" })}>
            <Phone />
            Обади се
          </a>
        ) : null}
        {email ? (
          <a href={`mailto:${email}`} className={buttonVariants({ variant: "primary", className: "w-full" })}>
            <Mail />
            Имейл
          </a>
        ) : null}
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            <Globe />
            Уебсайт
          </a>
        ) : null}
        <ShareButton title={shareTitle} url={shareUrl} />
      </div>
    </nav>
  )
}
