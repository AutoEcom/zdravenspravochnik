import type { ReactNode } from "react"

import { looksLikeHtml, sanitizeArticleHtml } from "@/lib/content/article-html"

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let index = 0

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) nodes.push(text.slice(last, start))
    if (match[1] && match[2]) {
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={match[2]}
          className="text-primary underline underline-offset-4"
          rel="noopener noreferrer"
        >
          {match[1]}
        </a>
      )
    } else if (match[3]) {
      nodes.push(<strong key={`${keyPrefix}-strong-${index}`}>{match[3]}</strong>)
    } else if (match[4]) {
      nodes.push(<em key={`${keyPrefix}-em-${index}`}>{match[4]}</em>)
    }
    last = start + match[0].length
    index += 1
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function linesOf(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function ArticleBody({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="flex flex-col gap-4 text-base leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-5 [&_h4]:text-lg [&_h4]:font-semibold [&_img]:my-2 [&_img]:max-h-96 [&_img]:w-full [&_img]:rounded-2xl [&_img]:object-cover [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(content) }}
      />
    )
  }

  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="flex flex-col gap-4 text-base leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = linesOf(block)
        const heading = lines.length === 1 ? /^(#{1,3})\s+(.+)$/.exec(lines[0]) : null
        if (heading) {
          const text = heading[2]
          if (heading[1].length < 3) return <h2 key={blockIndex}>{inline(text, `h-${blockIndex}`)}</h2>
          return <h3 key={blockIndex}>{inline(text, `h-${blockIndex}`)}</h3>
        }

        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={blockIndex} className="list-disc space-y-2 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.replace(/^[-*]\s+/, ""), `ul-${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          )
        }

        if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          return (
            <ol key={blockIndex} className="list-decimal space-y-2 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.replace(/^\d+\.\s+/, ""), `ol-${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ol>
          )
        }

        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {inline(line, `p-${blockIndex}-${lineIndex}`)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
