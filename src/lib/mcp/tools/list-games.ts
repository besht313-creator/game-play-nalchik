import { defineTool } from "@lovable.dev/mcp-js";

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
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
