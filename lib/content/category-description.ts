export const categoryDescriptionTemplates: Record<string, string> = {
  partneri:
    "Материали от партньори на платформата. Етикетирани като спонсорирано съдържание.",
  "simptomi-i-sastoyaniya":
    "Чести оплаквания и кога обикновено се търси помощ. При главоболие и световъртеж често се насочват към [невролог](/category/specialisti/nevrologia); при кожни промени — към [дерматолог](/category/specialisti/dermatologia); при гръдна болка или високо налягане — към [кардиолог](/category/specialisti/kardiologia).",
  "izsledvaniya-i-podgotovka":
    "Какво означават често назначавани изследвания. Резултатите се тълкуват с лекуващия лекар — [ендокринолог](/category/specialisti/endokrinologia), [гастроентеролог](/category/specialisti/gastroenterologia) или друг [специалист](/specialisti) според случая.",
  "detsko-zdrave":
    "Теми около здравето на децата. Първа линия е [педиатър](/category/specialisti/pediatria); при нужда се включват и други детски направления от справочника.",
  "jensko-zdrave":
    "Профилактика, цикъл, бременност и свързани теми. Най-често се работи с [акушер-гинеколог](/category/specialisti/ginekologia); при хормонални въпроси — и с [ендокринолог](/category/specialisti/endokrinologia).",
  "psihichno-zdrave":
    "Кога е разумно да се потърси подкрепа. В справочника можете да намерите [психиатър](/category/specialisti/psihiatria) и свързани профили.",
  "saveti-predi-pregled":
    "Практически бележки около посещението при специалист. Изберете направление от [каталога](/specialisti) и уточнете детайлите директно с кабинета.",
  "hranene-i-metabolizam":
    "Храна и навици в контекста на здравето. При метаболитни и хормонални въпроси често се търси [ендокринолог](/category/specialisti/endokrinologia).",
}

export function categoryDescription(slug: string, stored: string | null | undefined, name: string) {
  const value = stored?.trim()
  if (value) return value
  return categoryDescriptionTemplates[slug] ?? `Материали в тема „${name}“.`
}

export function descriptionPlainText(value: string) {
  return value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
}
