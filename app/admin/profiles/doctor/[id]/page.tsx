import { notFound, redirect } from "next/navigation"

import { AdminProfileForm } from "@/app/admin/profiles/profile-form"
import { slugOptions } from "@/app/admin/profiles/query"
import { AccountShell } from "@/components/account/account-shell"
import { createPageMetadata } from "@/components/seo/page-meta"
import { getSessionProfile } from "@/lib/auth/session"
import { displayName } from "@/lib/content/present"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCities, getSpecialties } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"
import type { FacilityType, PublishStatus } from "@/types/database"

export const metadata = createPageMetadata({
  title: "Редакция на лекар",
  description: "Редакция на профил на лекар.",
  path: "/admin/profiles",
  index: false,
})

export default async function EditDoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const { user, profile } = await getSessionProfile()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/profiles/doctor/${id}`)}`)
  if (profile?.role !== "admin") redirect("/dashboard")

  const admin = createAdminClient()
  const [{ data }, cities, specialties] = await Promise.all([
    admin.from("doctors").select("*").eq("id", id).maybeSingle(),
    safeQuery(getCities, []),
    safeQuery(getSpecialties, []),
  ])
  if (!data) notFound()

  const status: PublishStatus = data.status === "draft" || data.status === "archived" ? data.status : "published"
  const heading = displayName(data.title, data.full_name) || data.full_name

  return (
    <AccountShell role="admin" eyebrow="Лекар" title={heading}>
      <AdminProfileForm
        kind="doctor"
        id={data.id}
        slug={data.slug}
        source={data.source}
        isClaimed={data.is_claimed}
        claimedBy={data.claimed_by}
        title={data.title ?? ""}
        name={data.full_name}
        shortDescription={data.short_description ?? ""}
        description={data.bio ?? ""}
        phone={data.phone ?? ""}
        email={data.email ?? ""}
        website={data.website ?? ""}
        address={data.address ?? ""}
        cities={data.cities ?? []}
        specialties={data.specialties ?? []}
        cityOptions={slugOptions(cities, data.cities ?? [], "city")}
        specialtyOptions={slugOptions(specialties, data.specialties ?? [], "specialty")}
        acceptsNhif={data.accepts_nhif}
        acceptsChildren={data.accepts_children}
        onlineConsultation={data.online_consultation}
        featured={data.is_featured}
        status={status}
        facilityType={"other" satisfies FacilityType}
      />
    </AccountShell>
  )
}
