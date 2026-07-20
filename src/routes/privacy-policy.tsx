import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности | GamePlay" },
      { name: "description", content: "Политика конфиденциальности и обработки персональных данных сайта GamePlay — аренда игровых приставок в Нальчике." },
    ],
  }),
  component: PrivacyPolicyPage,
});

const PHONE = "+7 (903) 495-33-48";
const PHONE_HREF = "tel:+79034953348";
const SITE_URL = "gameplay-nalchik.ru";
const LAST_UPDATED = "20 июля 2026 г.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display font-bold text-xl sm:text-2xl uppercase text-gradient">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-xl tracking-wider">
            <span style={{ color: "#63D8FF" }}>GAME</span>
            <span style={{ color: "#F14FF0" }}>PLAY</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition">
            ← На главную
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase">
          Политика конфиденциальности
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Последнее обновление: {LAST_UPDATED}</p>

        <p className="mt-6 text-muted-foreground leading-relaxed">
          Настоящая Политика конфиденциальности (далее — «Политика») действует в отношении
          сайта {SITE_URL} (далее — «Сайт») и описывает, какие данные посетителей Сайта
          обрабатываются, с какой целью и каким образом.
        </p>

        <Section title="1. Оператор">
          <p>
            Обработку данных в рамках использования Сайта осуществляет физическое лицо —
            владелец Сайта GamePlay (аренда игровых приставок в Нальчике). Связаться с оператором
            можно по телефону{" "}
            <a href={PHONE_HREF} className="text-primary hover:underline">{PHONE}</a>,
            указанному на Сайте, либо через мессенджеры (WhatsApp, Telegram), ссылки на которые
            размещены на Сайте.
          </p>
        </Section>

        <Section title="2. Какие данные обрабатываются">
          <p>
            <strong className="text-foreground">Контактные данные при бронировании.</strong>{" "}
            Заявки на аренду оформляются по телефону, в WhatsApp или Telegram — эти обращения
            обрабатываются напрямую в соответствующем канале связи и не сохраняются в базе
            данных Сайта.
          </p>
          <p>
            <strong className="text-foreground">Технические и статистические данные.</strong>{" "}
            При посещении Сайта, если вы дали согласие на использование cookie-файлов
            аналитики, автоматически обрабатываются: IP-адрес, тип устройства и браузера,
            источник перехода, страницы и время посещения. Эти данные собираются в
            обезличенном виде через сервисы Яндекс.Метрика и/или Google Analytics.
          </p>
        </Section>

        <Section title="3. Файлы cookie">
          <p>
            Cookie — небольшие текстовые файлы, которые сохраняются в вашем браузере. Сайт
            использует cookie только для аналитики посещаемости (если вы дали на это согласие
            в баннере при первом посещении):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Яндекс.Метрика</strong> — статистика
              посещений, поведение на сайте (карта кликов, глубина просмотра). Оператор —
              ООО «Яндекс».
            </li>
            <li>
              <strong className="text-foreground">Google Analytics</strong> — статистика
              посещений и источников трафика. Оператор — Google LLC; часть данных может
              обрабатываться на серверах за пределами РФ.
            </li>
          </ul>
          <p>
            Вы можете в любой момент отозвать согласие на использование аналитических cookie,
            очистив данные сайта в настройках браузера, либо повторно указав выбор в баннере
            согласия (он появляется снова после очистки данных браузера). Без вашего согласия
            аналитические cookie не устанавливаются.
          </p>
        </Section>

        <Section title="4. Цели обработки">
          <ul className="list-disc pl-5 space-y-1">
            <li>Обработка заявок на аренду игровых приставок и связь с клиентом;</li>
            <li>Анализ посещаемости Сайта и улучшение его удобства;</li>
            <li>Исполнение требований законодательства РФ.</li>
          </ul>
        </Section>

        <Section title="5. Передача данных третьим лицам">
          <p>
            Оператор не передаёт персональные данные третьим лицам, за исключением случаев,
            когда это необходимо для функционирования подключённых сервисов аналитики
            (Яндекс.Метрика, Google Analytics) в объёме, который они собирают самостоятельно
            согласно своим политикам конфиденциальности, либо по требованию законодательства РФ.
          </p>
        </Section>

        <Section title="6. Ваши права">
          <p>
            Вы вправе запросить информацию об обрабатываемых данных, потребовать их уточнения
            или удаления, а также отозвать согласие на обработку — для этого достаточно
            связаться с оператором по контактам, указанным в разделе 1.
          </p>
        </Section>

        <Section title="7. Изменения Политики">
          <p>
            Оператор вправе вносить изменения в настоящую Политику. Актуальная версия всегда
            доступна на этой странице.
          </p>
        </Section>
      </main>
    </div>
  );
}
