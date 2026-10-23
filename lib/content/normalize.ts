const specialtyLabels: Record<string, string> = {
  "очни болести": "Офталмология",
  офталмология: "Офталмология",
  "нервни болести": "Неврология",
  неврология: "Неврология",
  "кожни и венерически болести": "Дерматология",
  дерматология: "Дерматология",
  "ендокринология и болести на обмяната": "Ендокринология",
  ендокринология: "Ендокринология",
  "клинична алергология": "Алергология",
  алергология: "Алергология",
  "ушно носно гърлени болести": "УНГ",
  "ушно-носно-гърлени болести": "УНГ",
  унг: "УНГ",
  "общопрактикуващ лекар": "Обща медицина",
  "обща медицина": "Обща медицина",
  стоматология: "Дентална медицина",
  "дентална медицина": "Дентална медицина",
  гинекология: "Акушерство и гинекология",
  "акушерство и гинекология": "Акушерство и гинекология",
  ортопедия: "Ортопедия и травматология",
  "ортопедия и травматология": "Ортопедия и травматология",
  пневмология: "Пневмология и фтизиатрия",
  "пневмология и фтизиатрия": "Пневмология и фтизиатрия",
  онкология: "Медицинска онкология",
  "медицинска онкология": "Медицинска онкология",
}

export function humanLabel(value: string) {
  let text = value.replace(/\s+/g, " ").trim()
  text = text.replace(/^(?:гр\.|г\.|с\.|село|град)\s+/iu, "")
  text = text.replace(/^гр\s+/iu, "")
  text = text.replace(/^гр\.(?=\S)/iu, "")
  text = text.replace(/(?:\s+град|\s*-\s*град)$/iu, "")
  text = text.replace(/\s+/g, " ").trim()
  if (text && text === text.toLocaleLowerCase("bg")) {
    text = text.charAt(0).toLocaleUpperCase("bg") + text.slice(1)
  }
  return text
}

export function specialtyDisplay(value: string) {
  const human = humanLabel(value)
  return specialtyLabels[human.toLocaleLowerCase("bg")] ?? human
}

export function normalizeIdentity(value: string) {
  return value
    .toLocaleLowerCase("bg")
    .replace(/[„“”"'`.]/g, " ")
    .replace(/^(?:д-р|доктор|проф\.?|доц\.?)\s+/iu, "")
    .replace(/\s+/g, " ")
    .trim()
}
