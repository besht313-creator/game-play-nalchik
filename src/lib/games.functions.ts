import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Sticker = "hit" | "new" | "for_two" | "for_four";
export type Category =
  | "new"
  | "hits"
  | "fighting"
  | "shooter"
  | "coop"
  | "racing"
  | "sports"
  | "kids"
  | "horror"
  | "exclusive";
/** Язык озвучки и интерфейса — только эти два варианта. */
export type Lang = "ru" | "en";
/** Сколько человек может играть одновременно. */
export type Players = 1 | 2 | 4;

export const CATEGORY_VALUES: Category[] = [
  "new",
  "hits",
  "fighting",
  "shooter",
  "coop",
  "racing",
  "sports",
  "kids",
  "horror",
  "exclusive",
];
export const PLAYERS_VALUES: Players[] = [1, 2, 4];

export type GameRow = {
  id: string;
  title: string;
  image_url: string | null;
  stickers: Sticker[];
  categories: Category[];
  position: number;
  title_hidden: boolean;
  // Поля для окна с подробностями. Пустые — блок в окне просто не показывается.
  genre: string | null;
  players: Players | null;
  description: string | null;
  voice_lang: Lang | null;
  ui_lang: Lang | null;
};

// Public: list games sorted by position. Uses the anon-key client — RLS
// allows public SELECT on `games`, so no service-role key is needed here.
export const listGames = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("games")
    .select(
      "id,title,image_url,stickers,categories,position,title_hidden,genre,players,description,voice_lang,ui_lang",
    )
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GameRow[];
});

const StickerEnum = z.enum(["hit", "new", "for_two", "for_four"]);
const CategoryEnum = z.enum([
  "new",
  "hits",
  "fighting",
  "shooter",
  "coop",
  "racing",
  "sports",
  "kids",
  "horror",
  "exclusive",
]);
const LangEnum = z.enum(["ru", "en"]);
const PlayersEnum = z.union([z.literal(1), z.literal(2), z.literal(4)]);

/** Поля окна подробностей — общие для создания и редактирования игры. */
const detailsShape = {
  genre: z.string().max(80).nullable().optional(),
  players: PlayersEnum.nullable().optional(),
  description: z.string().max(600).nullable().optional(),
  voice_lang: LangEnum.nullable().optional(),
  ui_lang: LangEnum.nullable().optional(),
};

// All admin mutations below are gated by `requireSupabaseAuth`, which
// validates the caller's Supabase Auth bearer token and hands back an
// RLS-scoped client as `context.supabase`. RLS policies on `games` and the
// `game-images` storage bucket restrict writes to the `authenticated` role,
// so there is no need for the service-role key or an app-level password.

export const adminCreateGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        stickers: z.array(StickerEnum).max(3).default([]),
        categories: z.array(CategoryEnum).max(8).default([]),
        image_url: z.string().nullable().optional(),
        title_hidden: z.boolean().optional().default(false),
        ...detailsShape,
      })
      .parse(d),
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
        title_hidden: data.title_hidden ?? false,
        genre: data.genre ?? null,
        players: data.players ?? null,
        description: data.description ?? null,
        voice_lang: data.voice_lang ?? null,
        ui_lang: data.ui_lang ?? null,
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
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        stickers: z.array(StickerEnum).max(3).optional(),
        categories: z.array(CategoryEnum).max(8).optional(),
        image_url: z.string().nullable().optional(),
        title_hidden: z.boolean().optional(),
        ...detailsShape,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: {
      title?: string;
      stickers?: string[];
      categories?: string[];
      image_url?: string | null;
      title_hidden?: boolean;
      genre?: string | null;
      players?: number | null;
      description?: string | null;
      voice_lang?: string | null;
      ui_lang?: string | null;
    } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.stickers !== undefined) patch.stickers = data.stickers;
    if (data.categories !== undefined) patch.categories = data.categories;
    if (data.image_url !== undefined) patch.image_url = data.image_url;
    if (data.title_hidden !== undefined) patch.title_hidden = data.title_hidden;
    if (data.genre !== undefined) patch.genre = data.genre;
    if (data.players !== undefined) patch.players = data.players;
    if (data.description !== undefined) patch.description = data.description;
    if (data.voice_lang !== undefined) patch.voice_lang = data.voice_lang;
    if (data.ui_lang !== undefined) patch.ui_lang = data.ui_lang;
    const { error } = await supabase.from("games").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
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
    z
      .object({
        id: z.string().uuid(),
        direction: z.enum(["up", "down"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: current, error: e1 } = await supabase
      .from("games")
      .select("id,position")
      .eq("id", data.id)
      .single();
    if (e1 || !current) throw new Error(e1?.message ?? "Игра не найдена");

    const q = supabase.from("games").select("id,position").limit(1);
    const { data: neighbor } =
      data.direction === "up"
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

// Move a game to an explicit place in the list (1-based, as shown in the admin).
// Unlike adminMoveGame (single-step swap) this normally costs one UPDATE: the
// new position is the midpoint between the two games it lands between. Only
// when those neighbours sit on adjacent integers is the whole list renumbered.
export const adminReorderGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        toPosition: z.number().int().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: all, error } = await supabase
      .from("games")
      .select("id,position")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);

    const list = (all ?? []) as { id: string; position: number }[];
    const from = list.findIndex((g) => g.id === data.id);
    if (from === -1) throw new Error("Игра не найдена");

    const target = Math.min(Math.max(data.toPosition, 1), list.length) - 1;
    if (target === from) return { ok: true };

    const STEP = 1000;
    const rest = list.filter((g) => g.id !== data.id);
    const before = target > 0 ? rest[target - 1] : null;
    const after = target < rest.length ? rest[target] : null;

    let newPosition: number | null = null;
    if (!before && after) newPosition = after.position - STEP;
    else if (before && !after) newPosition = before.position + STEP;
    else if (before && after && after.position - before.position >= 2) {
      newPosition = before.position + Math.floor((after.position - before.position) / 2);
    }

    if (newPosition !== null) {
      const { error: e } = await supabase
        .from("games")
        .update({ position: newPosition })
        .eq("id", data.id);
      if (e) throw new Error(e.message);
      return { ok: true };
    }

    // Соседи стоят вплотную — свободного числа между ними нет. Раздвигаем весь
    // список с шагом STEP, попутно ставя игру на нужное место.
    const reordered = [...rest];
    reordered.splice(target, 0, list[from]);
    for (let i = 0; i < reordered.length; i++) {
      const position = (i + 1) * STEP;
      if (reordered[i].position === position) continue;
      const { error: e } = await supabase
        .from("games")
        .update({ position })
        .eq("id", reordered[i].id);
      if (e) throw new Error(e.message);
    }
    return { ok: true };
  });

// Upload image as base64; returns storage path stored in image_url
export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        filename: z.string().min(1),
        contentType: z.string().min(1),
        dataBase64: z.string().min(1),
      })
      .parse(d),
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
