import { FillIn, LegalDocument } from "@/components/legal/legal-document"
import { createPageMetadata } from "@/components/seo/page-meta"

export const metadata = createPageMetadata({
  title: "Медицински отказ от отговорност",
  description:
    "Здравен справочник е справочник, не медицинска услуга. Не дава диагноза, лечение или препоръка за конкретен специалист.",
  path: "/otgovornost",
})

export default function DisclaimerPage() {
  return (
    <LegalDocument title="Медицински отказ от отговорност" updated="28 октомври 2026">
      <section className="flex flex-col gap-3">
        <h2>1. Справочник, не медицинска услуга</h2>
        <p>
          Здравен справочник, опериран от Calma Life на zdravenspravochnik.com, е информационен справочник
          на лекари и здравни заведения. Сайтът не е лечебно заведение и не предоставя медицинска дейност.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>2. Без диагноза и без лечение</h2>
        <p>
          Текстовете, профилите и резултатите от търсене не са диагноза, лечение, рецепта или персонален
          здравен съвет. Не описват какво да предприемете при конкретно оплакване.
        </p>
        <p>Самодиагностиката и самолечението по информация от сайта са неподходящи и не се насърчават.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>3. Без препоръка на конкретен профил</h2>
        <p>
          Подредбата в списъците не е медицинска препоръка и не означава, че даден специалист или заведение
          е подходящ за вас. Изборът на лекар е ваш, след разговор със специалист.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>4. Непълни или остарели данни</h2>
        <p>
          Адрес, телефон, работно време и специалност могат да липсват или да не са актуални. Потвърдете
          часа и условията директно с кабинета или регистратурата.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>5. Кога да потърсите лекар</h2>
        <p>
          При симптоми се обърнете към лекар. При спешно състояние се обадете на телефон 112 или отидете в
          спешно отделение. Не отлагайте помощ заради информация в справочника.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>6. Контакт</h2>
        <p>
          Calma Life, <FillIn label="ЕИК" />, <FillIn label="адрес" />. Имейл: <FillIn label="имейл" />.
        </p>
      </section>
    </LegalDocument>
  )
}
