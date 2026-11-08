import { z } from "zod";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
  }, "Некорректная дата");
export const reportRange = z.object({ from: date, to: date }).refine(({ from, to }) => {
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  return days >= 0 && days < 366;
}, "Выберите период до 366 дней");

export type ReportRow = { dimensions: { name: string; id?: string }[]; metrics: number[] };
type Report = { data: ReportRow[]; totals: number[]; sampled?: boolean; total_rows?: number };
export type AnalyticsReport = {
  configured: boolean;
  counterId: string;
  updatedAt: string;
  sections: Record<string, Report>;
  errors: Record<string, string>;
};

// Only the server reads these variables. Never use a VITE_ prefix for the token.
export function assertAnalyticsAdmin(email: unknown) {
  const allowed = (process.env.METRIKA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (typeof email !== "string" || !allowed.includes(email.toLowerCase())) {
    throw new Error(
      "Доступ к аналитике закрыт. Добавьте email администратора в METRIKA_ADMIN_EMAILS на сервере.",
    );
  }
}

function config() {
  const counterId = process.env.METRIKA_COUNTER_ID || "111146201";
  if (!/^\d+$/.test(counterId)) throw new Error("Некорректный METRIKA_COUNTER_ID на сервере");
  return { counterId, token: process.env.METRIKA_OAUTH_TOKEN };
}

export async function metrikaRequest(path: string, params: Record<string, string> = {}) {
  const { token } = config();
  const url = new URL(path, "https://api-metrika.yandex.net");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `OAuth ${token}` },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Метрика не ответила вовремя. Повторите обновление.");
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Токен Метрики недействителен. Обновите METRIKA_OAUTH_TOKEN.",
      403: "Токен не имеет доступа к счётчику или разрешения metrika:read.",
      429: "Лимит запросов Метрики. Подождите минуту и повторите.",
    };
    throw new Error(messages[response.status] || `Ошибка отчёта Метрики (${response.status}).`);
  }
  return response.json();
}

const summaries =
  "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds";
const specs: Record<string, { dimensions?: string; metrics: string }> = {
  summary: { metrics: summaries },
  daily: { dimensions: "ym:s:date", metrics: "ym:s:visits,ym:s:users" },
  sources: {
    dimensions: "ym:s:lastTrafficSource,ym:s:lastSourceEngine",
    metrics: "ym:s:visits,ym:s:users",
  },
  campaigns: {
    dimensions: "ym:s:lastUTMSource,ym:s:lastUTMMedium,ym:s:lastUTMCampaign",
    metrics: "ym:s:visits,ym:s:users",
  },
  cities: { dimensions: "ym:s:regionCity", metrics: "ym:s:visits,ym:s:users" },
  devices: { dimensions: "ym:s:deviceCategory", metrics: "ym:s:visits,ym:s:users" },
  pages: { dimensions: "ym:s:startURLPath", metrics: "ym:s:visits,ym:s:users" },
  referrers: { dimensions: "ym:s:externalRefererDomain", metrics: "ym:s:visits,ym:s:users" },
};

const cache = new Map<string, { expires: number; report: AnalyticsReport }>();
const pending = new Map<string, Promise<AnalyticsReport>>();
export async function getAnalytics(input: { from: string; to: string }): Promise<AnalyticsReport> {
  const range = reportRange.parse(input);
  const { counterId, token } = config();
  const empty: AnalyticsReport = {
    configured: Boolean(token),
    counterId,
    updatedAt: new Date().toISOString(),
    sections: {},
    errors: {},
  };
  if (!token) return empty;
  const key = `${counterId}:${range.from}:${range.to}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.report;
  if (pending.has(key)) return pending.get(key)!;
  const work = async () => {
    const result = empty;
    const params = {
      ids: counterId,
      date1: range.from,
      date2: range.to,
      lang: "ru",
      accuracy: "full",
      timezone: "+03:00",
      filters: "ym:s:startURLPathFull!@'/admin'",
      limit: "100",
      sort: "-ym:s:visits",
    };
    // Three concurrent reports at most, to respect API quotas.
    const entries = Object.entries(specs);
    for (let i = 0; i < entries.length; i += 3) {
      await Promise.all(
        entries.slice(i, i + 3).map(async ([name, spec]) => {
          try {
            result.sections[name] = await metrikaRequest("/stat/v1/data", {
              ...params,
              ...spec,
              ...(name === "daily" ? { sort: "ym:s:date", limit: "366" } : {}),
            });
          } catch (error) {
            result.errors[name] = (error as Error).message;
          }
        }),
      );
    }
    try {
      const { goals } = await metrikaRequest(`/management/v1/counter/${counterId}/goals`);
      const selected = (goals as { id: number; name: string }[]).slice(0, 10);
      if (selected.length) {
        const response = await metrikaRequest("/stat/v1/data", {
          ...params,
          metrics: selected
            .flatMap((g) => [`ym:s:goal${g.id}reaches`, `ym:s:goal${g.id}conversionRate`])
            .join(","),
          sort: "",
        });
        result.sections.goals = {
          totals: [],
          data: selected.map((g, index) => ({
            dimensions: [{ name: g.name, id: String(g.id) }],
            metrics: response.totals.slice(index * 2, index * 2 + 2),
          })),
        };
      } else result.sections.goals = { totals: [], data: [] };
    } catch (error) {
      result.errors.goals = (error as Error).message;
    }
    // Bound memory; failed reports expire quickly so fixes do not need a restart.
    if (cache.size >= 30) cache.delete(cache.keys().next().value!);
    cache.set(key, {
      expires: Date.now() + (Object.keys(result.errors).length ? 15000 : 60000),
      report: result,
    });
    return result;
  };
  const promise = work().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
