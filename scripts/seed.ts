import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { articles, cities, doctors, facilities, facilityDoctors, specialties } from "./seed-data"

const extraColumns = [
  "short_description",
  "accepts_nhif",
  "accepts_children",
  "online_consultation",
] as const

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function sqlText(value: string) {
  return `'${value.replaceAll("'", "''")}'`
}

function sqlArray(values: readonly string[]) {
  return `array[${values.map(sqlText).join(", ")}]::text[]`
}

function profileColumns(row: {
  short_description: string
  accepts_nhif: boolean
  accepts_children: boolean
  online_consultation: boolean
  working_hours: unknown
}) {
  return `${sqlText(row.short_description)}, ${row.accepts_nhif}, ${row.accepts_children}, ${row.online_consultation}, ${sqlText(JSON.stringify(row.working_hours))}::jsonb`
}

export function renderSeedSql() {
  const specialtyValues = specialties
    .map((row) => `  (${sqlText(row.name)}, ${sqlText(row.slug)}, ${sqlText(row.description)})`)
    .join(",\n")
  const cityValues = cities
    .map((row) => `  (${sqlText(row.name)}, ${sqlText(row.slug)}, ${sqlText(row.region)})`)
    .join(",\n")
  const doctorValues = doctors
    .map(
      (row) => `  (${[
        sqlText(row.slug),
        sqlText(row.full_name),
        sqlText(row.title),
        sqlText(row.bio),
        sqlText(row.phone),
        sqlText(row.email),
        sqlText(row.website),
        sqlText(row.address),
        sqlArray(row.specialties),
        sqlArray(row.cities),
        "'published'",
        row.is_featured,
        row.is_premium,
        row.rating.toFixed(2),
        row.review_count,
        profileColumns(row),
      ].join(", ")})`
    )
    .join(",\n")
  const facilityValues = facilities
    .map(
      (row) => `  (${[
        sqlText(row.slug),
        sqlText(row.name),
        sqlText(row.facility_type),
        sqlText(row.description),
        sqlText(row.phone),
        sqlText(row.email),
        sqlText(row.website),
        sqlText(row.address),
        sqlArray(row.specialties),
        sqlArray(row.cities),
        "'published'",
        row.is_featured,
        row.is_premium,
        row.rating.toFixed(2),
        row.review_count,
        profileColumns(row),
      ].join(", ")})`
    )
    .join(",\n")
  const articleValues = articles
    .map(
      (row) =>
        `  (${sqlText(row.slug)}, ${sqlText(row.title)}, ${sqlText(row.excerpt)}, ${sqlText(row.content)}, 'published', ${sqlText(row.published_at)}::timestamptz)`
    )
    .join(",\n")
  const linkValues = facilityDoctors
    .map(
      (row) => `  (
    (select id from public.facilities where slug = ${sqlText(row.facility)}),
    (select id from public.doctors where slug = ${sqlText(row.doctor)}),
    ${sqlText(row.position)},
    ${row.is_primary}
  )`
    )
    .join(",\n")

  return `-- Example directory data. Safe to run more than once.
-- Adds the profile columns, then upserts specialties, cities, doctors, facilities and articles.

alter table public.doctors
  add column if not exists short_description text,
  add column if not exists accepts_nhif boolean not null default false,
  add column if not exists accepts_children boolean not null default false,
  add column if not exists online_consultation boolean not null default false;

alter table public.facilities
  add column if not exists short_description text,
  add column if not exists accepts_nhif boolean not null default false,
  add column if not exists accepts_children boolean not null default false,
  add column if not exists online_consultation boolean not null default false;

insert into public.specialties (name, slug, description)
values
${specialtyValues}
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.cities (name, slug, region)
values
${cityValues}
on conflict (slug) do update set
  name = excluded.name,
  region = excluded.region,
  updated_at = now();

insert into public.doctors (
  slug, full_name, title, bio, phone, email, website, address,
  specialties, cities, status, is_featured, is_premium, rating, review_count,
  short_description, accepts_nhif, accepts_children, online_consultation, working_hours
)
values
${doctorValues}
on conflict (slug) do update set
  full_name = excluded.full_name,
  title = excluded.title,
  bio = excluded.bio,
  phone = excluded.phone,
  email = excluded.email,
  website = excluded.website,
  address = excluded.address,
  specialties = excluded.specialties,
  cities = excluded.cities,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_premium = excluded.is_premium,
  rating = excluded.rating,
  review_count = excluded.review_count,
  short_description = excluded.short_description,
  accepts_nhif = excluded.accepts_nhif,
  accepts_children = excluded.accepts_children,
  online_consultation = excluded.online_consultation,
  working_hours = excluded.working_hours,
  updated_at = now();

insert into public.facilities (
  slug, name, facility_type, description, phone, email, website, address,
  specialties, cities, status, is_featured, is_premium, rating, review_count,
  short_description, accepts_nhif, accepts_children, online_consultation, working_hours
)
values
${facilityValues}
on conflict (slug) do update set
  name = excluded.name,
  facility_type = excluded.facility_type,
  description = excluded.description,
  phone = excluded.phone,
  email = excluded.email,
  website = excluded.website,
  address = excluded.address,
  specialties = excluded.specialties,
  cities = excluded.cities,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_premium = excluded.is_premium,
  rating = excluded.rating,
  review_count = excluded.review_count,
  short_description = excluded.short_description,
  accepts_nhif = excluded.accepts_nhif,
  accepts_children = excluded.accepts_children,
  online_consultation = excluded.online_consultation,
  working_hours = excluded.working_hours,
  updated_at = now();

insert into public.articles (slug, title, excerpt, content, status, published_at)
values
${articleValues}
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

insert into public.facility_doctors (facility_id, doctor_id, position, is_primary)
values
${linkValues}
on conflict (facility_id, doctor_id) do update set
  position = excluded.position,
  is_primary = excluded.is_primary,
  updated_at = now();
`
}

function withoutExtras<T extends Record<string, unknown>>(row: T) {
  const copy = { ...row }
  for (const key of extraColumns) delete copy[key]
  return copy
}

async function hasProfileColumns(supabase: SupabaseClient) {
  const { error } = await supabase.from("doctors").select("short_description").limit(1)
  return !error
}

async function upsert(
  supabase: SupabaseClient,
  table: "cities" | "specialties" | "doctors" | "facilities" | "articles",
  rows: Record<string, unknown>[],
  withExtras: boolean
) {
  const payload = withExtras ? rows : rows.map(withoutExtras)
  const { error } = await supabase.from(table).upsert(payload, { onConflict: "slug" })
  if (error) throw new Error(`${table}: ${error.message}`)
}

async function linkFacilities(supabase: SupabaseClient) {
  const [{ data: doctorRows, error: doctorError }, { data: facilityRows, error: facilityError }] =
    await Promise.all([
      supabase.from("doctors").select("id, slug"),
      supabase.from("facilities").select("id, slug"),
    ])
  if (doctorError) throw new Error(`doctors: ${doctorError.message}`)
  if (facilityError) throw new Error(`facilities: ${facilityError.message}`)

  const doctorId = new Map((doctorRows ?? []).map((row) => [row.slug, row.id]))
  const facilityId = new Map((facilityRows ?? []).map((row) => [row.slug, row.id]))
  const links = facilityDoctors.map((row) => ({
    facility_id: facilityId.get(row.facility),
    doctor_id: doctorId.get(row.doctor),
    position: row.position,
    is_primary: row.is_primary,
  }))
  if (links.some((row) => !row.facility_id || !row.doctor_id)) {
    throw new Error("facility_doctors: missing doctor or facility slug")
  }

  const { error } = await supabase
    .from("facility_doctors")
    .upsert(links, { onConflict: "facility_id,doctor_id" })
  if (error) throw new Error(`facility_doctors: ${error.message}`)
}

async function main() {
  loadEnvFile(".env.local")
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    loadEnvFile(".env.local.example")
  }

  if (process.argv.includes("--sql")) {
    writeFileSync("supabase/seed.sql", renderSeedSql(), "utf8")
    console.log("Wrote supabase/seed.sql")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const withExtras = await hasProfileColumns(supabase)
  if (!withExtras) {
    console.log("Profile columns are not in the database yet. Seeding the existing columns.")
    console.log("Run supabase/seed.sql in the Supabase SQL editor to add НЗОК, children and online flags.")
  }

  await upsert(supabase, "cities", [...cities], false)
  await upsert(supabase, "specialties", [...specialties], false)
  await upsert(
    supabase,
    "doctors",
    doctors.map((row) => ({ ...row, status: "published", specialties: [...row.specialties], cities: [...row.cities] })),
    withExtras
  )
  await upsert(
    supabase,
    "facilities",
    facilities.map((row) => ({
      ...row,
      status: "published",
      specialties: [...row.specialties],
      cities: [...row.cities],
    })),
    withExtras
  )
  await upsert(
    supabase,
    "articles",
    articles.map((row) => ({ ...row, status: "published" })),
    false
  )
  await linkFacilities(supabase)

  console.log("Doctors:")
  for (const row of doctors) console.log(`  /${row.slug}`)
  console.log("Facilities:")
  for (const row of facilities) console.log(`  /${row.slug}`)
  console.log("Articles:")
  for (const row of articles) console.log(`  /${row.slug}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
