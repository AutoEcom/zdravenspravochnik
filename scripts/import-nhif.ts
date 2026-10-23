import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const BATCH = 50

const cityByName: Record<string, { name: string; slug: string }> = {
  софия: { name: "София", slug: "sofia" },
  варна: { name: "Варна", slug: "varna" },
  пловдив: { name: "Пловдив", slug: "plovdiv" },
}

const specialtyAlias: Record<string, { name: string; slug: string; role: string }> = {
  кардиология: { name: "Кардиология", slug: "kardiologia", role: "kardiolog" },
  педиатрия: { name: "Педиатрия", slug: "pediatria", role: "pediatr" },
  "акушерство и гинекология": { name: "Акушерство и гинекология", slug: "ginekologia", role: "ginekolog" },
  "очни болести": { name: "Офталмология", slug: "oftalmologia", role: "oftalmolog" },
  "ендокринология и болести на обмяната": { name: "Ендокринология", slug: "endokrinologia", role: "endokrinolog" },
  "нервни болести": { name: "Неврология", slug: "nevrologia", role: "nevrolog" },
  "физикална и рехабилитационна медицина": {
    name: "Физикална и рехабилитационна медицина",
    slug: "fizikalna-meditsina",
    role: "fizioterapevt",
  },
  "ушно носно гърлени болести": { name: "УНГ", slug: "ung", role: "ung" },
  психиатрия: { name: "Психиатрия", slug: "psihiatria", role: "psihiatar" },
  "ортопедия и травматология": { name: "Ортопедия и травматология", slug: "ortopedia", role: "ortoped" },
  "кожни и венерически болести": { name: "Дерматология", slug: "dermatologia", role: "dermatolog" },
  гастроентерология: { name: "Гастроентерология", slug: "gastroenterologia", role: "gastroenterolog" },
  урология: { name: "Урология", slug: "urologia", role: "urolog" },
  ревматология: { name: "Ревматология", slug: "revmatologia", role: "revmatolog" },
  хирургия: { name: "Хирургия", slug: "hirurgia", role: "hirurg" },
  "пневмология и фтизиатрия": { name: "Пневмология и фтизиатрия", slug: "pnevmonologia", role: "pnevmolog" },
  нефрология: { name: "Нефрология", slug: "nefrologia", role: "nefrolog" },
  "клинична хематология": { name: "Клинична хематология", slug: "klinichna-hematologia", role: "hematolog" },
  "клинична алергология": { name: "Алергология", slug: "alergologia", role: "alergolog" },
  "съдова хирургия": { name: "Съдова хирургия", slug: "sadova-hirurgia", role: "sadov-hirurg" },
  "медицинска онкология": { name: "Медицинска онкология", slug: "onkologia", role: "onkolog" },
  "вътрешни болести": { name: "Вътрешни болести", slug: "vatreshni-bolesti", role: "vatreshni-bolesti" },
  неврохирургия: { name: "Неврохирургия", slug: "nevrohirurgia", role: "nevrohirurg" },
  "инфекциозни болести": { name: "Инфекциозни болести", slug: "infektologia", role: "infektolog" },
  "анестезиология и интензивно лечение": { name: "Анестезиология и интензивно лечение", slug: "anesteziologia", role: "anesteziolog" },
  ангиология: { name: "Ангиология", slug: "angiologia", role: "angiolog" },
  "гръдна хирургия": { name: "Гръдна хирургия", slug: "gradna-hirurgia", role: "graden-hirurg" },
  "обща медицина": { name: "Обща медицина", slug: "obshta-meditsina", role: "opl" },
  "общопрактикуващ лекар": { name: "Обща медицина", slug: "obshta-meditsina", role: "opl" },
  "дентална медицина": { name: "Дентална медицина", slug: "stomatologia", role: "stomatolog" },
  "медицинска лаборатория": { name: "Медицинска лаборатория", slug: "meditsinska-laboratoria", role: "laboratoria" },
  "високоспециализирани дейности": {
    name: "Високоспециализирани дейности",
    slug: "visokospecializirani-deynosti",
    role: "spetsialist",
  },
}

type FacilityType = "hospital" | "clinic" | "practice" | "laboratory" | "pharmacy" | "other"
type CsvRow = {
  category: string
  facilityName: string
  cityName: string
  citySlug: string
  address: string
  phone: string
  doctorName: string
  specialty: string
}

function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') quoted = false
      else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") field += char
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function norm(value: string) {
  return value
    .toLocaleLowerCase("bg")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hash(value: string) {
  let h = 2166136261
  for (let index = 0; index < value.length; index++) {
    h ^= value.charCodeAt(index)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mockStats(key: string, tier: 0 | 1 | 2) {
  const noise = hash(key)
  const ratingMin = [4.2, 4.5, 4.7][tier]
  const ratingMax = [4.6, 4.8, 4.9][tier]
  const steps = Math.round((ratingMax - ratingMin) * 10)
  const rating = ratingMin + ((noise % (steps + 1)) / 10)
  const reviewMin = [12, 40, 80][tier]
  const reviewMax = [60, 120, 180][tier]
  return {
    rating: Number(Math.min(4.9, Math.max(4.2, rating)).toFixed(1)),
    review_count: reviewMin + (noise % (reviewMax - reviewMin + 1)),
  }
}

function slugify(value: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
  }
  return value
    .trim()
    .toLocaleLowerCase("bg")
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function titleCase(value: string) {
  return value
    .toLocaleLowerCase("bg")
    .replace(/(^|[^\p{L}])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase("bg"))
}

const upperTokens = new Set([
  "еоод", "оод", "еад", "ад", "ет", "мц", "дкц", "мбал", "умбал", "сбал", "смдл", "дц", "мдц",
  "ипсмп", "аипсмп", "асмп", "опл",
])

function formatOrgName(value: string) {
  return titleCase(value)
    .split(/(\s+)/)
    .map((part) => (upperTokens.has(norm(part)) ? part.toLocaleUpperCase("bg") : part))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
}

function formatPerson(value: string) {
  return titleCase(value.replace(/\s+/g, " ").trim()).replace(/\s+/g, " ")
}

function formatAddress(raw: string, city: string) {
  const quoted = raw.replace(/"([^"]*)"/g, "„$1“").replace(/\s+/g, " ").trim()
  if (!quoted) return ""
  let pretty = titleCase(quoted)
  pretty = pretty
    .replace(/\bР-н\b/gi, "р-н")
    .replace(/\bЖ\.к\./gi, "ж.к.")
    .replace(/\bБул\./gi, "бул.")
    .replace(/\bУл\./gi, "ул.")
    .replace(/\bВх\./gi, "вх.")
    .replace(/\bЕт\./gi, "ет.")
    .replace(/\bАп\./gi, "ап.")
    .replace(/\bБл\./gi, "бл.")
  if (!pretty.toLocaleLowerCase("bg").includes(city.toLocaleLowerCase("bg"))) pretty = `${pretty}, ${city}`
  return pretty.slice(0, 240)
}

function cleanPhone(raw: string) {
  const parts = raw
    .split(/[,;/]+/)
    .map((part) => part.replace(/[^\d+\s]/g, "").replace(/\s+/g, " ").trim())
    .filter((part) => part.replace(/\D/g, "").length >= 6)
  return parts.join(", ").slice(0, 80)
}

function phoneKey(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 6) return ""
  return digits.slice(-9)
}

function personKey(name: string) {
  return norm(name).replace(/^(проф|доц|д р|доктор|dr)\s+/g, "").trim()
}

function looksLikeChild(value: string) {
  return /детск|педиат|неонат/i.test(value)
}

function workplaceTier(category: string, name: string): 0 | 1 | 2 {
  const text = norm(name)
  if (category === "hospitals" || /умбал|мбал|сбал|университетск/.test(text)) return 2
  if (category === "hss" || category === "laboratories" || /дкц|медицински център|^мц | мц |болниц/.test(` ${text} `)) return 1
  return 0
}

function facilityTypeFor(category: string, name: string): FacilityType {
  const text = norm(name)
  if (category === "hospitals" || /болниц|мбал|умбал|сбал/.test(text)) return "hospital"
  if (category === "laboratories" || /лаборатор/.test(text)) return "laboratory"
  if (category === "dentists" || /дент|стомат/.test(text)) return "clinic"
  if (/^ет | ет /.test(` ${text} `) || /аипсмп|ипсмп/.test(text)) return "practice"
  return "clinic"
}

function specialtyFor(raw: string, category: string) {
  const cleaned = norm(raw).replace(/^детска\s+/, "").replace(/^детски\s+/, "")
  if (!cleaned || cleaned === "няма описание") {
    if (category === "dentists") return specialtyAlias["дентална медицина"]
    if (category === "laboratories") return specialtyAlias["медицинска лаборатория"]
    if (category === "hss") return specialtyAlias["високоспециализирани дейности"]
    return null
  }
  return (
    specialtyAlias[cleaned] ??
    specialtyAlias[norm(raw)] ?? {
      name: titleCase(raw.trim()),
      slug: slugify(raw).slice(0, 60) || "spetsialnost",
      role: slugify(raw).split("-").slice(0, 2).join("-").slice(0, 24) || "spetsialist",
    }
  )
}

function uniqueSlug(base: string, used: Set<string>) {
  const rootSlug = (base || "profil").slice(0, 72).replace(/-+$/g, "")
  if (!used.has(rootSlug)) {
    used.add(rootSlug)
    return rootSlug
  }
  for (let index = 2; index < 1000; index++) {
    const next = `${rootSlug.slice(0, 68)}-${index}`
    if (!used.has(next)) {
      used.add(next)
      return next
    }
  }
  const fallback = `${rootSlug.slice(0, 60)}-${hash(base).toString(36)}`
  used.add(fallback)
  return fallback
}

function isTransient(message: string) {
  return /fetch failed|network|timeout|ECONNRESET|ETIMEDOUT|socket|502|503|504/i.test(message)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAll(supabase: SupabaseClient, table: "doctors" | "facilities" | "cities" | "specialties", columns: string) {
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    let page: Record<string, unknown>[] | null = null
    let last = ""
    for (let attempt = 1; attempt <= 5; attempt++) {
      const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
      if (!error) {
        page = (data ?? []) as unknown as Record<string, unknown>[]
        break
      }
      last = error.message
      if (!isTransient(error.message) || attempt === 5) throw new Error(`${table}: ${error.message}`)
      console.log(`${table}: мрежова грешка при четене, нов опит ${attempt + 1}/5`)
      await wait(800 * attempt)
    }
    if (!page) throw new Error(`${table}: ${last}`)
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

async function insertInBatches(supabase: SupabaseClient, table: "doctors" | "facilities" | "specialties" | "cities", rows: Record<string, unknown>[]) {
  const stripped = new Set<string>()
  let done = 0
  let failed = 0
  for (let index = 0; index < rows.length; index += BATCH) {
    const slice = rows.slice(index, index + BATCH).map((row) => {
      const copy = { ...row }
      for (const column of stripped) delete copy[column]
      return copy
    })
    const saved = await insertOnce(supabase, table, slice, stripped)
    if (!saved) {
      for (const row of slice) {
        const single = await insertOnce(supabase, table, [row], stripped)
        if (!single) failed++
        else done++
      }
    } else done += slice.length
    if (done % 200 < BATCH || index + BATCH >= rows.length) {
      console.log(`${table}: ${Math.min(index + BATCH, rows.length)}/${rows.length}`)
    }
  }
  return { done, failed }
}

async function insertOnce(supabase: SupabaseClient, table: string, rows: Record<string, unknown>[], stripped: Set<string>) {
  let current = rows.map((row) => {
    const copy = { ...row }
    for (const column of stripped) delete copy[column]
    return copy
  })
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase.from(table).insert(current)
    if (!error) return true
    if (isTransient(error.message) && attempt < 4) {
      await wait(700 * (attempt + 1))
      continue
    }
    const missing = error.message.match(/Could not find the '([^']+)' column/)
    if (!missing) {
      console.log(`${table}: ${error.message}`)
      return false
    }
    stripped.add(missing[1])
    current = current.map((row) => {
      const copy = { ...row }
      delete copy[missing[1]]
      return copy
    })
  }
  return false
}

async function main() {
  loadEnvFile(path.join(root, ".env.local"))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Липсват NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env.local")

  const csvPath = existsSync(path.join(root, "data/import/nhif_sofia_varna_plovdiv_fixed.csv"))
    ? path.join(root, "data/import/nhif_sofia_varna_plovdiv_fixed.csv")
    : path.join(root, "data/import/nhif_sofia_varna_plovdiv.csv")
  const [header, ...body] = parseCsv(readFileSync(csvPath, "utf8"))
  if (!header || !header.join(",").includes("facility_name")) throw new Error("Непознат формат на CSV файла.")

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const [existingDoctors, existingFacilities, existingCities, existingSpecialties] = await Promise.all([
    fetchAll(supabase, "doctors", "slug, full_name, specialties, cities, phone"),
    fetchAll(supabase, "facilities", "slug, name, address, phone, cities"),
    fetchAll(supabase, "cities", "slug, name"),
    fetchAll(supabase, "specialties", "slug, name"),
  ])

  const usedSlugs = new Set<string>([
    ...existingDoctors.map((row) => String(row.slug)),
    ...existingFacilities.map((row) => String(row.slug)),
  ])
  const specialtyBySlug = new Map(existingSpecialties.map((row) => [String(row.slug), String(row.name)]))
  const specialtyByName = new Map(existingSpecialties.map((row) => [norm(String(row.name)), String(row.slug)]))
  const citySlugs = new Set(existingCities.map((row) => String(row.slug)))

  const doctorKeys = new Set<string>()
  const doctorPhones = new Map<string, string>()
  for (const row of existingDoctors) {
    const name = personKey(String(row.full_name ?? ""))
    const cities = Array.isArray(row.cities) ? row.cities.map(String) : []
    const specialties = Array.isArray(row.specialties) ? row.specialties.map(String) : []
    for (const city of cities) {
      for (const specialty of specialties.length ? specialties : [""]) doctorKeys.add(`${name}|${specialty}|${city}`)
    }
    const phone = phoneKey(String(row.phone ?? ""))
    if (phone && name) doctorPhones.set(`${name}|${phone}`, name)
  }

  const facilityAddress = new Set<string>()
  const facilityPhone = new Map<string, string>()
  const facilityCity = new Set<string>()
  for (const row of existingFacilities) {
    const name = norm(String(row.name ?? ""))
    const address = norm(String(row.address ?? ""))
    const cities = Array.isArray(row.cities) ? row.cities.map(String) : []
    const phone = phoneKey(String(row.phone ?? ""))
    for (const city of cities) {
      if (address) facilityAddress.add(`${name}|${city}|${address}`)
      else facilityCity.add(`${name}|${city}`)
      if (phone) facilityPhone.set(`${name}|${city}|${phone}`, address)
    }
  }

  const pendingSpecialties = new Map<string, { name: string; slug: string }>()
  const facilities: Record<string, unknown>[] = []
  const doctors: Record<string, unknown>[] = []
  let skippedFacilities = 0
  let skippedDoctors = 0
  const examples: string[] = []

  function rememberSpecialty(spec: { name: string; slug: string } | null) {
    if (!spec) return ""
    const byName = specialtyByName.get(norm(spec.name))
    const slug = specialtyBySlug.has(spec.slug) ? spec.slug : byName ?? spec.slug
    if (!specialtyBySlug.has(slug) && !pendingSpecialties.has(slug)) {
      pendingSpecialties.set(slug, { name: spec.name, slug })
      specialtyBySlug.set(slug, spec.name)
      specialtyByName.set(norm(spec.name), slug)
    }
    return slug
  }

  function takeFacility(row: CsvRow, specSlug: string) {
    if (!row.facilityName) return
    const name = formatOrgName(row.facilityName)
    const nameKey = norm(name)
    const address = formatAddress(row.address, row.cityName)
    const addressKey = norm(address.replace(new RegExp(`,?\\s*${row.cityName}$`, "i"), ""))
    const phone = phoneKey(row.phone)
    const addressId = addressKey ? `${nameKey}|${row.citySlug}|${addressKey}` : ""
    const phoneId = phone ? `${nameKey}|${row.citySlug}|${phone}` : ""
    const cityId = `${nameKey}|${row.citySlug}`
    const known =
      (addressId && facilityAddress.has(addressId)) ||
      (phoneId && facilityPhone.has(phoneId)) ||
      (!addressKey && !phone && facilityCity.has(cityId))
    if (known) {
      skippedFacilities++
      return
    }
    const type = facilityTypeFor(row.category, name)
    const tier = workplaceTier(row.category, name)
    const stats = mockStats(`${name}|${row.citySlug}|${address}`, tier)
    const slug = uniqueSlug(slugify(`${name} ${row.citySlug}`), usedSlugs)
    if (addressId) facilityAddress.add(addressId)
    if (phoneId) facilityPhone.set(phoneId, addressKey)
    if (!addressKey && !phone) facilityCity.add(cityId)
    facilities.push({
      slug,
      name: name.slice(0, 200),
      facility_type: type,
      phone: row.phone || null,
      address: address || null,
      specialties: specSlug ? [specSlug] : [],
      cities: [row.citySlug],
      status: "published",
      accepts_nhif: true,
      accepts_children: looksLikeChild(`${name} ${row.specialty}`),
      rating: stats.rating,
      review_count: stats.review_count,
      source: "nhif",
      is_claimed: false,
      working_hours: {},
    })
    if (examples.filter((item) => item.startsWith(row.category)).length < 1) examples.push(`${row.category} /${slug}`)
  }

  function takeDoctor(row: CsvRow, spec: { name: string; slug: string; role: string } | null, specSlug: string) {
    const sourceName = row.doctorName || (row.category === "doctors" ? row.facilityName : "")
    if (!sourceName || row.category !== "doctors") return
    const fullName = formatPerson(sourceName).replace(/^(Д-р|Доц\.|Проф\.)\s+/i, "").trim()
    if (!fullName) return
    const nameKey = personKey(fullName)
    const phone = phoneKey(row.phone)
    const id = `${nameKey}|${specSlug}|${row.citySlug}`
    if (doctorKeys.has(id) || (phone && doctorPhones.has(`${nameKey}|${phone}`))) {
      skippedDoctors++
      return
    }
    const parts = fullName.split(/\s+/).filter(Boolean)
    const last = parts.at(-1) ?? fullName
    const first = parts[0] ?? ""
    const role = spec?.role || "lekar"
    const tier = Math.max(workplaceTier(row.category, row.facilityName), /кардио|невро|хирург|онко|акуш|педиат|ортопед|уролог|гастро|ендокрин|нефро|хемат|пневмо|ревмат|очни|ушно/i.test(row.specialty) ? 1 : 0) as 0 | 1 | 2
    const stats = mockStats(`${fullName}|${specSlug}|${row.citySlug}`, tier)
    const slug = uniqueSlug(`${role}-${row.citySlug}-dr-${slugify(`${first} ${last}`)}`, usedSlugs)
    doctorKeys.add(id)
    if (phone) doctorPhones.set(`${nameKey}|${phone}`, nameKey)
    doctors.push({
      slug,
      full_name: fullName.slice(0, 160),
      title: "Д-р",
      phone: row.phone || null,
      address: formatAddress(row.address, row.cityName) || null,
      specialties: specSlug ? [specSlug] : [],
      cities: [row.citySlug],
      status: "published",
      accepts_nhif: true,
      accepts_children: looksLikeChild(row.specialty),
      rating: stats.rating,
      review_count: stats.review_count,
      source: "nhif",
      is_claimed: false,
      working_hours: {},
    })
    if (examples.filter((item) => item.startsWith("doctor")).length < 3) examples.push(`doctor /${slug}`)
  }

  let prepared = 0
  for (const cells of body) {
    if (!cells.some((cell) => cell.trim())) continue
    const city = cityByName[norm(cells[4] ?? "")]
    if (!city) continue
    const parsed: CsvRow = {
      category: (cells[1] ?? "").trim(),
      facilityName: (cells[2] ?? "").replace(/\s+/g, " ").trim(),
      cityName: city.name,
      citySlug: city.slug,
      address: cells[5] ?? "",
      phone: cleanPhone(cells[7] ?? ""),
      doctorName: (cells[8] ?? "").replace(/\s+/g, " ").trim(),
      specialty: (cells[9] ?? "").replace(/\s+/g, " ").trim(),
    }
    const spec = specialtyFor(parsed.specialty, parsed.category)
    const specSlug = rememberSpecialty(spec)
    takeFacility(parsed, specSlug)
    takeDoctor(parsed, spec, specSlug)
    prepared++
    if (prepared % 1000 === 0) console.log(`Подготвени: ${prepared}`)
  }

  const cityRows = Object.values(cityByName)
    .filter((city) => !citySlugs.has(city.slug))
    .map((city) => ({ name: city.name, slug: city.slug }))
  if (cityRows.length) await insertInBatches(supabase, "cities", cityRows)
  const specialtyResult = await insertInBatches(supabase, "specialties", [...pendingSpecialties.values()])
  const facilityResult = await insertInBatches(supabase, "facilities", facilities)
  const doctorResult = await insertInBatches(supabase, "doctors", doctors)

  console.log(`Нови заведения: ${facilityResult.done}`)
  console.log(`Нови лекари: ${doctorResult.done}`)
  console.log(`Пропуснати заведения: ${skippedFacilities}`)
  console.log(`Пропуснати лекари: ${skippedDoctors}`)
  console.log(`Нови специалности: ${specialtyResult.done}`)
  if (facilityResult.failed || doctorResult.failed) {
    console.log(`Грешки при запис: ${facilityResult.failed + doctorResult.failed}`)
  }
  console.log("Примерни адреси:")
  for (const example of examples) console.log(`- ${example}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
