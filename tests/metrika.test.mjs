import { test } from "node:test";
import assert from "node:assert/strict";
import { getAnalytics, assertAnalyticsAdmin, reportRange } from "../src/lib/metrika.server.ts";

test("invalid dates and excessive periods are rejected", () => {
  for (const range of [
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-11-05", to: "2026-11-04" },
    { from: "2024-01-01", to: "2026-01-01" },
  ]) {
    assert.throws(() => reportRange.parse(range));
  }
  assert.doesNotThrow(() => reportRange.parse({ from: "2026-11-01", to: "2026-11-05" }));
});

test("analytics access fails closed, including authenticated non-admins", () => {
  delete process.env.METRIKA_ADMIN_EMAILS;
  assert.throws(() => assertAnalyticsAdmin("owner@example.com"));
  process.env.METRIKA_ADMIN_EMAILS = "owner@example.com, second@example.com";
  assert.doesNotThrow(() => assertAnalyticsAdmin("OWNER@example.com"));
  assert.throws(() => assertAnalyticsAdmin("stranger@example.com"));
  assert.throws(() => assertAnalyticsAdmin(undefined));
});

test("missing token returns setup state without network access", async () => {
  delete process.env.METRIKA_OAUTH_TOKEN;
  const result = await getAnalytics({ from: "2026-10-01", to: "2026-10-02" });
  assert.equal(result.configured, false);
  assert.deepEqual(result.sections, {});
});

test("real report request contract, cache, goal mapping and partial errors", async (t) => {
  process.env.METRIKA_OAUTH_TOKEN = "test-secret";
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(options.headers.Authorization, "OAuth test-secret");
    const address = new URL(url);
    assert.equal(address.origin, "https://api-metrika.yandex.net");
    if (address.pathname.endsWith("/goals"))
      return Response.json({ goals: [{ id: 123, name: "WhatsApp" }] });
    assert.equal(address.searchParams.get("date1"), "2026-10-03");
    assert.equal(address.searchParams.get("timezone"), "+03:00");
    assert.match(address.searchParams.get("filters"), /admin/);
    if (address.searchParams.get("dimensions") === "ym:s:regionCity")
      return new Response("unavailable", { status: 429 });
    if (address.searchParams.get("metrics").includes("goal123"))
      return Response.json({ totals: [4, 20], data: [] });
    return Response.json({
      totals: [20, 15, 30, 10, 60],
      data: [{ dimensions: [{ name: "2026-10-03" }], metrics: [20, 15] }],
    });
  });
  const range = { from: "2026-10-03", to: "2026-10-04" };
  const [a, b] = await Promise.all([getAnalytics(range), getAnalytics(range)]);
  assert.equal(a, b);
  assert.equal(calls, 10);
  assert.ok(a.errors.cities.includes("Лимит"));
  assert.equal(a.sections.summary.totals[0], 20);
  assert.deepEqual(a.sections.goals.data[0].metrics, [4, 20]);
  assert.ok(!JSON.stringify(a).includes("test-secret"));
  await getAnalytics(range);
  assert.equal(calls, 10);
});
