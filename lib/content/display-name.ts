function stripLegalSuffix(value: string) {
  return value
    .replace(/(?:^|[\s"'“”„«»‘’‚-])(?:еоод|еад|eood|ead)\.?(?=$|[\s"'“”„«»‘’‚.,-])/giu, " ")
    .replace(/(?:^|[\s"'“”„«»‘’‚])(?:оод|ад|сд|кд|ood|ad)\.?(?=$|[\s"'“”„«»‘’‚.,])/giu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stripQuotes(value: string) {
  return value
    .replace(/["“”„«»‘’‚]+/g, " ")
    .replace(/'+/g, (match, offset: number, source: string) => {
      const before = source[offset - 1] ?? ""
      const after = source[offset + match.length] ?? ""
      if (match.length === 1 && /\p{L}/u.test(before) && /\p{L}/u.test(after)) return match
      return " "
    })
    .replace(/\s+/g, " ")
    .trim()
}

export function cleanDisplayName(value: string) {
  const collapsed = value.replace(/\s+/g, " ").trim()
  let text = collapsed
  let previous = ""
  while (text && text !== previous) {
    previous = text
    text = stripQuotes(stripLegalSuffix(text))
  }
  return text || stripQuotes(collapsed)
}
