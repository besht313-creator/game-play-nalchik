import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Sticker = "hit" | "new" | "for_two";
export type Category = "new" | "hits" | "coop" | "racing" | "sports" | "kids" | "horror" | "exclusive";

export const CATEGORY_VALUES: Category[] = ["new", "hits", "coop", "racing", "sports", "kids", "horror", "exclusive"];

export type GameRow = {
  id: string;
  title: string;
  image_url: string | null;
  stickers: Sticker[];
  categories: Category[];
  position: number;
};

// Public: list games sorted by position. Uses the anon-key client — RLS
// allows public SELECT on `games`, so no service-role key is needed here.
export const listGames = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("games")
    .select("id,title,image_url,stickers,categories,position")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GameRow[];
});

const StickerEnum = z.enum(["hit", "new", "for_two"]);
const CategoryEnum = z.enum(["new", "hits", "coop", "racing", "sports", "kids", "horror", "exclusive"]);

// All admin mutations below are gated by `requireSupabaseAuth`, which
// validates the caller's Supabase Auth bearer token and hands back an
// RLS-scoped client as `context.supabase`. RLS policies on `games` and the
// `game-images` storage bucket restrict writes to the `authenticated` role,
// so there is no need for the service-role key or an app-level password.

export const adminCreateGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(200),
      stickers: z.array(StickerEnum).max(3).default([]),
      categories: z.array(CategoryEnum).max(8).default([]),
      image_url: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: all } = await supabase
      .from("games")
      .select("id,position")
      .order("position", { ascending: true });
    const list = all ?? [];

    // Target slot = 7th place (index 6). If fewer than 7 existing games, append at end.
    const TARGET_INDEX = 6;
    let nextPos: number;
    if (list.length <= TARGET_INDEX) {
      const maxPos = list.length ? list[list.length - 1].position : 0;
      nextPos = maxPos + 10;
    } else {
      nextPos = list[TARGET_INDEX].position;
      // Shift games at target index and below down by +10 (descending to avoid conflicts).
      for (let i = list.length - 1; i >= TARGET_INDEX; i--) {
        await supabase
          .from("games")
          .update({ position: list[i].position + 10 })
          .eq("id", list[i].id);
      }
    }

    const { data: inserted, error } = await supabase
      .from("games")
      .insert({
        title: data.title,
        stickers: data.stickers,
        categories: data.categories,
        image_url: data.image_url ?? null,
        position: nextPos,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted as GameRow;
  });

export const adminUpdateGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      stickers: z.array(StickerEnum).max(3).optional(),
      categories: z.array(CategoryEnum).max(8).optional(),
      image_url: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: { title?: string; stickers?: string[]; categories?: string[]; image_url?: string | null } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.stickers !== undefined) patch.stickers = data.stickers;
    if (data.categories !== undefined) patch.categories = data.categories;
    if (data.image_url !== undefined) patch.image_url = data.image_url;
    const { error } = await supabase.from("games").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const adminDeleteGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Best-effort cleanup of image
    const { data: row } = await supabase
      .from("games")
      .select("image_url")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.image_url && !row.image_url.startsWith("http")) {
      await supabase.storage.from("game-images").remove([row.image_url]);
    }
    const { error } = await supabase.from("games").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Swap position with neighbor in given direction
export const adminMoveGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      direction: z.enum(["up", "down"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: current, error: e1 } = await supabase
      .from("games")
      .select("id,position")
      .eq("id", data.id)
      .single();
    if (e1 || !current) throw new Error(e1?.message ?? "Игра не найдена");

    const q = supabase
      .from("games")
      .select("id,position")
      .limit(1);
    const { data: neighbor } = data.direction === "up"
      ? await q.lt("position", current.position).order("position", { ascending: false })
      : await q.gt("position", current.position).order("position", { ascending: true });

    const n = neighbor?.[0];
    if (!n) return { ok: true };

    // Swap positions
    await supabase.from("games").update({ position: -1 }).eq("id", current.id);
    await supabase.from("games").update({ position: current.position }).eq("id", n.id);
    await supabase.from("games").update({ position: n.position }).eq("id", current.id);
    return { ok: true };
  });

// Upload image as base64; returns storage path stored in image_url
export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      filename: z.string().min(1),
      contentType: z.string().min(1),
      dataBase64: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const ext = (data.filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext || "jpg"}`;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const { error } = await supabase.storage
      .from("game-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });
