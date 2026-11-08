import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { adminAnalytics } from "@/lib/analytics.functions";
import type { AnalyticsReport, ReportRow } from "@/lib/metrika.server";

function today() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(new Date());
}
function daysAgo(days: number) {
  return new Date(Date.parse(today()) - days * 86400000).toISOString().slice(0, 10);
}
const number = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
const titles: Record<string, string> = {
  sources: "Откуда приходят",
  campaigns: "Рекламные метки UTM",
  cities: "Города",
  devices: "Устройства",
  pages: "Страницы входа",
  referrers: "Сайты переходов",
  goals: "Действия и конверсии",
};
const control =
  "min-h-11 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent";

function Breakdown({ report, name }: { report: AnalyticsReport; name: string }) {
  const section = report.sections[name];
  const goals = name === "goals";
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="text-lg font-semibold">{titles[name]}</h3>
      {report.errors[name] ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {report.errors[name]}
        </p>
      ) : !section?.data.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {goals
            ? "Цели пока не настроены. Добавьте JavaScript-цели в Метрике по инструкции подключения."
            : "За выбранный период данных нет."}
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th scope="col" className="pb-3 font-normal">
                    {goals ? "Действие" : "Название"}
                  </th>
                  <th scope="col" className="pb-3 pr-3 text-right font-normal">
                    {goals ? "Клики" : "Визиты"}
                  </th>
                  <th scope="col" className="pb-3 text-right font-normal">
                    {goals ? "Конверсия" : "Люди"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {section.data.map((row: ReportRow, index) => (
                  <tr key={index} className="border-t border-border">
                    <th scope="row" className="max-w-[220px] break-words py-3 pr-3 font-normal">
                      <span>
                        {row.dimensions.map((d) => d.name || "Не определено").join(" / ")}
                      </span>
                    </th>
                    <td className="py-3 pr-3 text-right tabular-nums text-accent">
                      {number(row.metrics[0] ?? 0)}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {number(row.metrics[1] ?? 0)}
                      {goals ? "%" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.sampled && (
            <p className="mt-3 text-xs text-muted-foreground">
              Метрика использовала выборку: значения приблизительные.
            </p>
          )}
          {!!section.total_rows && section.total_rows > section.data.length && (
            <p className="mt-3 text-xs text-muted-foreground">
              Показаны первые {section.data.length} из {section.total_rows} строк.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export function AdminAnalytics() {
  const [range, setRange] = useState({ from: daysAgo(6), to: today() });
  const [draft, setDraft] = useState(range);
  const [validation, setValidation] = useState("");
  const fetchReport = useServerFn(adminAnalytics);
  const query = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: () => fetchReport({ data: range }),
    staleTime: 60000,
    retry: false,
  });
  const report = query.data;
  const totals = report?.sections.summary?.totals;
  const daily =
    report?.sections.daily?.data.map((row) => ({
      date: row.dimensions[0]?.name,
      visits: row.metrics[0],
      users: row.metrics[1],
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Аналитика GamePlay</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Посещаемость и источники трафика. Даты по Москве. Данные Яндекс.Метрики обновляются с
            задержкой.
          </p>
        </div>
        <button
          className={control}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Обновление…" : "Обновить"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Быстрый выбор периода">
        {[
          { label: "Сегодня", days: 1 },
          { label: "7 дней", days: 7 },
          { label: "30 дней", days: 30 },
        ].map(({ label, days }) => (
          <button
            key={days}
            className={control}
            onClick={() => {
              const next = { from: daysAgo(days - 1), to: today() };
              setRange(next);
              setDraft(next);
              setValidation("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const days = (Date.parse(draft.to) - Date.parse(draft.from)) / 86400000;
          if (!draft.from || !draft.to || days < 0 || days >= 366 || draft.to > today()) {
            setValidation("Выберите корректный период до 366 дней, без будущих дат.");
            return;
          }
          setValidation("");
          setRange(draft);
        }}
      >
        <label className="grid gap-1 text-sm">
          С
          <input
            required
            type="date"
            max={today()}
            className={control}
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          По
          <input
            required
            type="date"
            max={today()}
            className={control}
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </label>
        <button className={`${control} text-accent`} type="submit">
          Показать
        </button>
      </form>
      {validation && (
        <p role="alert" className="text-destructive">
          {validation}
        </p>
      )}
      {query.isPending && (
        <p role="status" className="py-12 text-center text-muted-foreground">
          Загружаем отчёты Метрики…
        </p>
      )}
      {query.isError && (
        <div role="alert" className="rounded-xl border border-destructive p-5">
          <p>{query.error.message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение по инструкции docs/analytics.md в репозитории.
          </p>
        </div>
      )}
      {report && !report.configured && (
        <section className="rounded-xl border border-accent p-6">
          <h2 className="text-xl font-semibold">Подключите чтение статистики</h2>
          <p className="mt-3 text-muted-foreground">
            На хостинге задайте METRIKA_OAUTH_TOKEN с правом metrika:read. Счётчик:{" "}
            {report.counterId}. После перезапуска сайта здесь появятся настоящие отчёты, включая
            ранее собранные данные.
          </p>
          <a
            className="mt-4 inline-block text-accent underline"
            href="https://yandex.ru/dev/metrika/ru/intro/authorization"
            target="_blank"
            rel="noopener noreferrer"
          >
            Как получить токен Яндекса
          </a>
        </section>
      )}
      {report?.configured && (
        <>
          {report.errors.summary && (
            <p role="alert" className="rounded-xl border border-destructive p-4 text-destructive">
              {report.errors.summary}
            </p>
          )}
          {totals && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-3 lg:grid-cols-5">
              {[
                ["Визиты", number(totals[0] ?? 0)],
                ["Посетители", number(totals[1] ?? 0)],
                ["Просмотры", number(totals[2] ?? 0)],
                ["Отказы", `${number(totals[3] ?? 0)}%`],
                [
                  "Среднее время",
                  `${Math.floor((totals[4] ?? 0) / 60)} м ${Math.round((totals[4] ?? 0) % 60)} с`,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
                </div>
              ))}
            </div>
          )}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Посещаемость по дням</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Голубой — визиты, розовый — посетители
            </p>
            {report.errors.daily ? (
              <p role="alert" className="mt-4 text-destructive">
                {report.errors.daily}
              </p>
            ) : daily.length ? (
              <div
                className="mt-6 h-64"
                role="img"
                aria-label="График визитов и посетителей по дням"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ left: -20, right: 12 }}>
                    <CartesianGrid stroke="#293045" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#a9b1c4", fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(5).split("-").reverse().join(".")}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: "#a9b1c4", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#151a2c",
                        border: "1px solid #39415a",
                        color: "white",
                      }}
                    />
                    <Line
                      name="Визиты"
                      type="monotone"
                      dataKey="visits"
                      stroke="#63D8FF"
                      strokeWidth={2}
                      dot={daily.length < 15}
                    />
                    <Line
                      name="Посетители"
                      type="monotone"
                      dataKey="users"
                      stroke="#F14FF0"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-6 text-muted-foreground">За выбранный период данных нет.</p>
            )}
            {daily.length > 0 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Данные графика в таблице
                </summary>
                <div className="mt-3 max-h-60 overflow-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Визиты</th>
                        <th>Посетители</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((d) => (
                        <tr key={d.date}>
                          <th scope="row" className="py-1 font-normal">
                            {d.date}
                          </th>
                          <td>{d.visits}</td>
                          <td>{d.users}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            {Object.keys(titles).map((name) => (
              <Breakdown key={name} name={name} report={report} />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Клики по контактам — намерение связаться, а не подтверждённая аренда. Посетители
            обезличены; имя человека определить нельзя. Блокировщики и отказ от аналитики уменьшают
            учитываемый трафик. Для ссылок из Telegram, WhatsApp и Avito используйте UTM-метки:
            приложение может не передать источник. В таблицах — до 100 строк, цели — до 10.
            Обновлено:{" "}
            {new Date(report.updatedAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}.
          </p>
        </>
      )}
    </div>
  );
}
