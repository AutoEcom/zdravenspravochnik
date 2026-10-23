import Link from "next/link"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { FacilityCard } from "@/components/facilities/facility-card"
import { JsonLd } from "@/components/seo/json-ld"
import { createPageMetadata } from "@/components/seo/page-meta"
import { websiteJsonLd } from "@/components/seo/schemas"
import { SearchForm } from "@/components/search/search-form"
import { buttonVariants } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { getSearchOptions } from "@/lib/content/catalog"
import { formatCount } from "@/lib/content/listing"
import {
  placeholderArticles,
  placeholderDoctors,
  placeholderFacilities,
  popularSpecialties,
} from "@/lib/content/placeholders"
import { formatBgDate, presentDoctor, presentFacility } from "@/lib/content/present"
import { getFeaturedDoctors, getFeaturedFacilities, getPublishedArticles, getPublishedCounts } from "@/lib/supabase/queries"
import { safeQuery } from "@/lib/supabase/safe"

function evenGridClass(count: number) {
  if (count > 1 && count % 2 === 0 && count % 3 !== 0) {
    return "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
  }
  if (count >= 3) return "grid gap-4 md:grid-cols-3"
  if (count === 2) return "grid gap-4 sm:grid-cols-2"
  return "grid gap-4"
}

export const metadata = createPageMetadata({
  title: "Здравен справочник – лекари и здравни заведения",
  description:
    "Публичен справочник на лекари и здравни заведения в България. Търсене по специалност, град и име, с възможност профилът да бъде заявен.",
  path: "/",
  absoluteTitle: true,
})

export default async function HomePage() {
  const [{ specialties, cities }, featuredDoctors, featuredFacilities, articles, counts] = await Promise.all([
    getSearchOptions(),
    safeQuery(getFeaturedDoctors, []),
    safeQuery(getFeaturedFacilities, []),
    safeQuery(() => getPublishedArticles(3), []),
    safeQuery(getPublishedCounts, { doctors: 0, facilities: 0 }),
  ])
  const doctors = featuredDoctors.slice(0, 6).map((doctor) => presentDoctor(doctor, specialties, cities))
  const facilities = featuredFacilities.slice(0, 3).map((facility) => presentFacility(facility, specialties, cities))
  const specialtyCards = popularSpecialties.flatMap((item) => {
    const match = specialties.find(
      (specialty) =>
        specialty.slug === item.slug ||
        specialty.aliases.includes(item.slug) ||
        specialty.name === item.name
    )
    return match ? [match] : []
  })
  const highlightedSpecialties = specialtyCards.length > 0 ? specialtyCards : specialties.slice(0, 8)

  return (
    <main>
      <JsonLd data={websiteJsonLd()} />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-12 pb-6 sm:pt-20 sm:pb-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Здравен справочник</p>
          <h1 className="mt-3">Лекари и здравни заведения в България</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Публичен справочник с контакти по специалност и град. Ако сте специалистът или управлявате
            заведението, можете да заявите профила и да редактирате данните.
          </p>
          {counts.doctors > 0 || counts.facilities > 0 ? (
            <p className="mt-4 text-sm font-medium tabular-nums">
              {formatCount(counts.doctors)} специалисти
              <span className="mx-2 font-normal text-muted-foreground">·</span>
              {formatCount(counts.facilities)} здравни заведения
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a href="#tursene" className={buttonVariants({ variant: "accent", className: "w-full sm:w-auto" })}>
              Търсене
            </a>
            <Link href="/specialisti" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
              Специалисти
            </Link>
            <Link href="/zavedenia" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
              Здравни заведения
            </Link>
          </div>
        </div>
        <div id="tursene">
          <SearchForm specialties={specialties} cities={cities} />
        </div>
      </section>

      <section
        id="specialnosti"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:py-16"
        aria-labelledby="specialties-heading"
      >
        <div className="max-w-2xl">
          <h2 id="specialties-heading">Най-търсени специалности</h2>
          <p className="mt-2 text-muted-foreground">
            Изберете специалност и отворете списъка със специалисти.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlightedSpecialties.map((specialty) => (
            <li key={specialty.slug}>
              <Link
                href={`/category/specialisti/${specialty.slug}`}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <GlassCard variant="panel" className="h-full transition-shadow duration-200 group-hover:shadow-md">
                  <h3>{specialty.name}</h3>
                  {"description" in specialty && specialty.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{specialty.description}</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Вижте специалистите</p>
                  )}
                </GlassCard>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:py-16"
        aria-labelledby="doctors-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="doctors-heading">Специалисти</h2>
            <p className="mt-2 text-muted-foreground">
              {doctors.length > 0
                ? "Подбрани публикувани профили. Пълният списък е при специалистите."
                : "Публикуваните профили ще се появят тук."}
            </p>
          </div>
          <Link href="/specialisti" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}>
            Към специалистите
          </Link>
        </div>
        <ul className={evenGridClass(doctors.length > 0 ? doctors.length : placeholderDoctors.length)}>
          {doctors.length > 0
            ? doctors.map((doctor) => (
                <li key={doctor.slug ?? doctor.full_name}>
                  <DoctorCard doctor={doctor} />
                </li>
              ))
            : placeholderDoctors.map((doctor) => (
                <li key={doctor.full_name}>
                  <DoctorCard doctor={{ ...doctor, example: true }} />
                </li>
              ))}
        </ul>
      </section>

      <section
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:py-16"
        aria-labelledby="facilities-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="facilities-heading">Здравни заведения</h2>
            <p className="mt-2 text-muted-foreground">
              {facilities.length > 0
                ? "Болници, медицински центрове, лаборатории и дентални практики."
                : "Публикуваните заведения ще се появят тук."}
            </p>
          </div>
          <Link
            href="/zavedenia"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Към здравните заведения
          </Link>
        </div>
        <ul className={evenGridClass(facilities.length > 0 ? facilities.length : placeholderFacilities.length)}>
          {facilities.length > 0
            ? facilities.map((facility) => (
                <li key={facility.slug ?? facility.name}>
                  <FacilityCard facility={facility} />
                </li>
              ))
            : placeholderFacilities.map((facility) => (
                <li key={facility.name}>
                  <FacilityCard facility={{ ...facility, example: true }} />
                </li>
              ))}
        </ul>
      </section>

      <section
        id="statii"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 pb-20 sm:py-16"
        aria-labelledby="articles-heading"
      >
        <div className="max-w-2xl">
          <h2 id="articles-heading">Последни статии</h2>
          <p className="mt-2 text-muted-foreground">Кратки материали преди посещение при специалист.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {articles.length > 0
            ? articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <GlassCard variant="panel" className="flex h-full flex-col gap-3 transition-shadow duration-200 group-hover:shadow-md">
                      <h3>{article.title}</h3>
                      {article.excerpt ? <p className="text-sm text-muted-foreground">{article.excerpt}</p> : null}
                      <p className="mt-auto text-sm text-muted-foreground">{formatBgDate(article.published_at)}</p>
                    </GlassCard>
                  </Link>
                </li>
              ))
            : placeholderArticles.map((article) => (
                <li key={article.title}>
                  <GlassCard variant="panel" className="flex h-full flex-col gap-3">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Пример</p>
                    <h3>{article.title}</h3>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                    <p className="mt-auto text-sm text-muted-foreground">{article.date}</p>
                  </GlassCard>
                </li>
              ))}
        </ul>
      </section>
    </main>
  )
}
