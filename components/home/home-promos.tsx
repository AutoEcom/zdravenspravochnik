import Image from "next/image"

export function HomePromos() {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2">
      <a
        href="https://myveggy.com/"
        target="_blank"
        rel="noopener sponsored"
        className="group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl border border-[#0d5c4d]/15 p-6 shadow-[0_12px_32px_rgb(13_92_77_/_0.08)] transition-shadow duration-200 hover:shadow-[0_16px_36px_rgb(13_92_77_/_0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d5c4d]/40 sm:p-8"
        style={{ background: "linear-gradient(145deg, #f7f3e8 0%, #e7f6ee 46%, #d8f3e4 100%)" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-8 size-40 rounded-full bg-[#b7e4c7]/70 blur-2xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-12 left-8 size-36 rounded-full bg-[#f6d7a8]/50 blur-2xl"
        />
        <div className="relative max-w-[16rem] sm:max-w-sm">
          <Image src="/logomyveggy.png" alt="My Veggy" width={1223} height={420} className="h-12 w-auto sm:h-14" />
          <h2 className="mt-4 text-balance text-[#0d5c4d]">My Veggy — рецепти за по-лек избор</h2>
          <p className="mt-2 leading-relaxed text-[#0d5c4d]/80">Вегетариански и веган идеи за всеки ден.</p>
        </div>
        <div className="relative mt-6">
          <span className="inline-flex h-11 items-center rounded-xl bg-[#0d5c4d] px-4 text-sm font-medium text-white transition-colors duration-200 group-hover:bg-[#0a4a3e]">
            Към My Veggy
          </span>
        </div>
        <span className="absolute right-6 bottom-6 text-xs text-muted-foreground sm:right-8 sm:bottom-8">
          Партньорско представяне
        </span>
      </a>
      <aside
        aria-label="Реклама"
        className="glass flex h-full min-h-[260px] items-center justify-center rounded-2xl p-6"
      >
        <p className="text-sm text-muted-foreground">Реклама</p>
      </aside>
    </div>
  )
}
