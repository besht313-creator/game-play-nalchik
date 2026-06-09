import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/game-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat;
        if (!path) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("game-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
