import { test } from "node:test";
import assert from "node:assert/strict";
import { trackGoal, trackPageView } from "../src/lib/analytics.ts";

test("tracking is SSR-safe, requires consent and excludes the admin", () => {
  assert.doesNotThrow(() => trackGoal("contact_phone"));
  const calls = [];
  let consent = "declined";
  globalThis.window = {
    location: { pathname: "/", origin: "https://gameplay-nalchik.ru" },
    localStorage: { getItem: () => consent },
    ym: (...args) => calls.push(args),
  };
  try {
    trackGoal("contact_phone");
    assert.equal(calls.length, 0);
    consent = "accepted";
    trackGoal("contact_whatsapp");
    assert.deepEqual(calls, [[111146201, "reachGoal", "contact_whatsapp"]]);
    window.location.pathname = "/admin";
    trackGoal("contact_phone");
    trackPageView("/admin");
    assert.equal(calls.length, 1);
  } finally {
    delete globalThis.window;
  }
});
