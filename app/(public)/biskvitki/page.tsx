import Link from "next/link"

import { LegalDocument } from "@/components/legal/legal-document"
import { createPageMetadata } from "@/components/seo/page-meta"

export const metadata = createPageMetadata({
  title: "Политика за бисквитки",
  description:
    "Какви бисквитки използва Здравен справочник: необходими за работата на сайта и аналитични само след съгласие.",
  path: "/biskvitki",
})

export default function CookiesPage() {
  return (
    <LegalDocument title="Политика за бисквитки" updated="28 октомври 2026">
      <section className="flex flex-col gap-3">
        <h2>1. Какво са бисквитките</h2>
        <p>
          Бисквитките са малки файлове или записи в браузъра. Те позволяват сайтът да помни сесия или избор.
          Здравен справочник се оперира от Calma Life на zdravenspravochnik.com.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>2. Необходими</h2>
        <p>Тези записи са нужни, за да работи сайтът. Не изискват съгласие.</p>
        <ul>
          <li>Сесия за вход, когато сте влезли в акаунт.</li>
          <li>Запис на избора ви за бисквитки в localStorage под ключ zs-cookie-consent.</li>
          <li>Защита на формулярите и техническа устойчивост на страницата.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>3. Аналитични</h2>
        <p>
          Аналитични бисквитки биха ни помогнали да видим обобщено кои страници се отварят. Те се зареждат
          само ако изберете „Приемам“. В момента сайтът не зарежда външни аналитични или рекламни скриптове.
          Изборът се пази, за да може такива инструменти да се включат само след съгласие.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>4. Вашият избор</h2>
        <p>
          При първо посещение можете да приемете всички категории или да оставите само необходимите. Изборът
          се пази в този браузър и банерът не се показва отново. За нов избор изчистете данните за сайта от
          настройките на браузъра.
        </p>
        <p>
          Повече за личните данни е в <Link href="/politika-za-poveritelnost">политиката за поверителност</Link>.
        </p>
      </section>
    </LegalDocument>
  )
}
