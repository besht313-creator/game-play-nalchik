import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({ from: z.string(), to: z.string() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertAnalyticsAdmin, getAnalytics } = await import("./metrika.server");
    assertAnalyticsAdmin(context.claims.email);
    return getAnalytics(data);
  });
