// Общие константы отображения каталога.
//
// Раньше эти таблицы лежали копиями в index.tsx, games.tsx и admin.tsx:
// добавление стикера или категории требовало правки в трёх местах, и они
// успевали разъезжаться. Значения самих категорий и стикеров живут в
// games.functions.ts — здесь только то, как они показываются человеку.
import type { Category, Sticker } from "@/lib/games.functions";

export const STICKER_LABELS: Record<Sticker, string> = {
  hit: "Хит",
  new: "Новинка",
  for_two: "2 🎮",
  for_four: "4 🎮",
};

/** Яркий вариант — на обложке игры, поверх картинки. */
export const STICKER_STYLES: Record<Sticker, string> = {
  hit: "bg-[#F14FF0] text-white border-white/50 shadow-[0_0_8px_#F14FF0aa]",
  new: "bg-[#63D8FF] text-black border-white/50 shadow-[0_0_8px_#63D8FFaa]",
  for_two: "bg-[#4D8CFF] text-white border-white/50 shadow-[0_0_8px_#4D8CFFaa]",
  for_four: "bg-[#A78BFA] text-white border-white/50 shadow-[0_0_8px_#A78BFAaa]",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  new: "Новинки",
  hits: "Хиты",
  fighting: "Файтинги",
  shooter: "Стрелялки",
  coop: "На двоих/четверых",
  racing: "Гонки",
  sports: "Спортивные",
  kids: "Для детей",
  horror: "Хорроры",
  exclusive: "Эксклюзивы",
};

/**
 * Обложка игры. В базе лежит либо готовый внешний адрес, либо путь внутри
 * бакета game-images — второй отдаётся через наш прокси /api/public/game-image.
 */
export function gameImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `/api/public/game-image/${url}`;
}
