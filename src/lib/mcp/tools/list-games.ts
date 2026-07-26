import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Uses the public (publishable-key) client, not the service-role admin
// client: the `games` table already grants public SELECT via RLS, so no
// privileged key is needed here — and SUPABASE_SERVICE_ROLE_KEY isn't
// exposed to this project's owner by Lovable Cloud anyway.
function createPublicServerClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`,
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default defineTool({
  name: "list_games",
  title: "List games",
  description:
    "Return the full catalog of PlayStation games available for rent at GamePlay Nalchik, ordered by display position.",
  inputSchema: {},
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async () => {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("games")
      .select("id,title,image_url,stickers,categories,position")
      .order("position", { ascending: true });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const rows = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { games: rows, count: rows.length },
    };
  },
});
