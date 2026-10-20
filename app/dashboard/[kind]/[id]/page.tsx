import { notFound, redirect } from "next/navigation"

import { ProfileEditor } from "@/app/dashboard/profile-editor"
import { AccountShell } from "@/components/account/account-shell"
import { canOpenDashboard, isUserRole } from "@/lib/auth/roles"
import { getSessionProfile } from "@/lib/auth/session"
import { friendlyDbError } from "@/lib/claims/errors"
import { displayName } from "@/lib/content/present"
import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"

export const metadata = {
  title: "Редакция на профил",
  robots: { index: false, follow: false },
}

export default async function EditClaimedProfilePage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  if (kind !== "doctor" && kind !== "facility") notFound()

  const { user, profile } = await getSessionProfile()
  if (!user) redirect(`/login?next=/dashboard/${kind}/${id}`)
  if (!canOpenDashboard(profile?.role)) redirect("/claim")

  const supabase = await createClient()
  const role = isUserRole(profile?.role) ? profile.role : "patient"

  if (kind === "doctor") {
    const { data, error } = await supabase.from("doctors").select("*").eq("id", id).eq("claimed_by", user.id).maybeSingle()
    if (error) {
      return (
        <AccountShell role={role} eyebrow="Табло" title="Редакция">
          <GlassCard variant="panel">{friendlyDbError(error)}</GlassCard>
        </AccountShell>
      )
    }
    if (!data) notFound()
    return (
      <AccountShell role={role} eyebrow="Табло" title="Редакция на лекар">
        <ProfileEditor
          kind="doctor"
          id={data.id}
          slug={data.slug}
          name={displayName(data.title, data.full_name)}
          shortDescription={data.short_description ?? ""}
          description={data.bio ?? ""}
          phone={data.phone ?? ""}
          email={data.email ?? ""}
          website={data.website ?? ""}
          hours={data.working_hours ?? {}}
          acceptsNhif={data.accepts_nhif}
          acceptsChildren={data.accepts_children}
          onlineConsultation={data.online_consultation}
        />
      </AccountShell>
    )
  }

  const { data, error } = await supabase.from("facilities").select("*").eq("id", id).eq("claimed_by", user.id).maybeSingle()
  if (error) {
    return (
      <AccountShell role={role} eyebrow="Табло" title="Редакция">
        <GlassCard variant="panel">{friendlyDbError(error)}</GlassCard>
      </AccountShell>
    )
  }
  if (!data) notFound()

  return (
    <AccountShell role={role} eyebrow="Табло" title="Редакция на заведение">
      <ProfileEditor
        kind="facility"
        id={data.id}
        slug={data.slug}
        name={data.name}
        shortDescription={data.short_description ?? ""}
        description={data.description ?? ""}
        phone={data.phone ?? ""}
        email={data.email ?? ""}
        website={data.website ?? ""}
        hours={data.working_hours ?? {}}
        acceptsNhif={data.accepts_nhif}
        acceptsChildren={data.accepts_children}
        onlineConsultation={data.online_consultation}
      />
    </AccountShell>
  )
}
