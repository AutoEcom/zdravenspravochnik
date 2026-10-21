import { buttonVariants } from "@/components/ui/button"

const fieldClass =
  "h-11 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 text-base text-foreground outline-none transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm"

type Option = {
  name: string
  slug: string
}

type SearchFormProps = {
  specialties: readonly Option[]
  cities: readonly Option[]
  defaults?: {
    q?: string
    specialty?: string
    city?: string
    kind?: string
  }
}

export function SearchForm({ specialties, cities, defaults }: SearchFormProps) {
  return (
    <form action="/search" className="glass-panel grid gap-3 p-4 sm:p-6 lg:grid-cols-[1fr_1fr_1.3fr_auto] lg:items-end">
      <label className="grid gap-2 text-sm font-medium" htmlFor="search-specialty">
        Специалност
        <select
          id="search-specialty"
          name="specialty"
          defaultValue={defaults?.specialty ?? ""}
          className={fieldClass}
        >
          <option value="">Всички</option>
          {specialties.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="search-city">
        Град
        <select
          id="search-city"
          name="city"
          defaultValue={defaults?.city ?? ""}
          className={fieldClass}
        >
          <option value="">Всички</option>
          {cities.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="search-query">
        Свободен текст
        <input
          id="search-query"
          name="q"
          type="search"
          defaultValue={defaults?.q ?? ""}
          placeholder="Име на лекар или заведение"
          className={fieldClass}
        />
      </label>
      <button type="submit" className={buttonVariants({ variant: "accent", className: "w-full lg:w-auto" })}>
        Търси
      </button>
      {defaults?.kind ? <input type="hidden" name="kind" value={defaults.kind} /> : null}
    </form>
  )
}
