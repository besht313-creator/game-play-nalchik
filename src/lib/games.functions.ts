import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Sticker = "hit" | "new" | "for_two";

export type GameRow = {
  id: string;
  title: string;
  image_url: string | null;
  stickers: Sticker[];
  position: number;
};

// Public: list games sorted by position
export const listGames = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("id,title,image_url,stickers,position")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GameRow[];
});

function checkPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD не настроен");
  if (pw !== expected) throw new Error("Неверный пароль");
}

export const adminVerify = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

const StickerEnum = z.enum(["hit", "new", "for_two"]);

export const adminCreateGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      password: z.string().min(1),
      title: z.string().min(1).max(200),
      stickers: z.array(StickerEnum).max(3).default([]),
      image_url: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: maxRow } = await supabaseAdmin
      .from("games")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? 0) + 10;
    const { data: inserted, error } = await supabaseAdmin
      .from("games")
      .insert({
        title: data.title,
        stickers: data.stickers,
        image_url: data.image_url ?? null,
        position: nextPos,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted as GameRow;
  });

export const adminUpdateGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      password: z.string().min(1),
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      stickers: z.array(StickerEnum).max(3).optional(),
      image_url: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { title?: string; stickers?: string[]; image_url?: string | null } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.stickers !== undefined) patch.stickers = data.stickers;
    if (data.image_url !== undefined) patch.image_url = data.image_url;
    const { error } = await supabaseAdmin.from("games").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ password: z.string().min(1), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Best-effort cleanup of image
    const { data: row } = await supabaseAdmin
      .from("games")
      .select("image_url")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.image_url && !row.image_url.startsWith("http")) {
      await supabaseAdmin.storage.from("game-images").remove([row.image_url]);
    }
    const { error } = await supabaseAdmin.from("games").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Swap position with neighbor in given direction
export const adminMoveGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      password: z.string().min(1),
      id: z.string().uuid(),
      direction: z.enum(["up", "down"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current, error: e1 } = await supabaseAdmin
      .from("games")
      .select("id,position")
      .eq("id", data.id)
      .single();
    if (e1 || !current) throw new Error(e1?.message ?? "Игра не найдена");

    const q = supabaseAdmin
      .from("games")
      .select("id,position")
      .limit(1);
    const { data: neighbor } = data.direction === "up"
      ? await q.lt("position", current.position).order("position", { ascending: false })
      : await q.gt("position", current.position).order("position", { ascending: true });

    const n = neighbor?.[0];
    if (!n) return { ok: true };

    // Swap positions
    await supabaseAdmin.from("games").update({ position: -1 }).eq("id", current.id);
    await supabaseAdmin.from("games").update({ position: current.position }).eq("id", n.id);
    await supabaseAdmin.from("games").update({ position: n.position }).eq("id", current.id);
    return { ok: true };
  });

// Upload image as base64; returns storage path stored in image_url
export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      password: z.string().min(1),
      filename: z.string().min(1),
      contentType: z.string().min(1),
      dataBase64: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = (data.filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext || "jpg"}`;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const { error } = await supabaseAdmin.storage
      .from("game-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });
