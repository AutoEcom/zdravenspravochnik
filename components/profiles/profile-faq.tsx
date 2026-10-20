export function ProfileFaq({ items }: { items: { question: string; answer: string }[] }) {
  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Често задавани въпроси</h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <details key={item.question} className="glass-panel group px-4 py-3 open:pb-4">
            <summary className="cursor-pointer list-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
