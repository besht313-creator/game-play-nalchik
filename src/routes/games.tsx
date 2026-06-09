import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FloatingContactButton } from "@/components/FloatingContactButton";
import { listGames, type Sticker, type Category } from "@/lib/games.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Полная библиотека игр | GamePlay Нальчик" },
      { name: "description", content: "Полный каталог игр для PS5 и PS4 с сортировкой по категориям: новинки, хиты, кооператив, гонки, для детей, хорроры, эксклюзивы." },
      { property: "og:title", content: "Полная библиотека игр | GamePlay" },
      { property: "og:description", content: "Большой каталог игр для аренды PS5 и PS4 в Нальчике." },
    ],
    links: [{ rel: "canonical", href: "/games" }],
  }),
  component: GamesPage,
});

const STICKER_LABELS: Record<Sticker, string> = { hit: "Хит", new: "Новинка", for_two: "На двоих" };
const STICKER_STYLES: Record<Sticker, string> = {
  hit: "bg-[#F14FF0]/20 text-[#F14FF0] border-[#F14FF0]/50 shadow-[0_0_10px_#F14FF080]",
  new: "bg-[#63D8FF]/20 text-[#63D8FF] border-[#63D8FF]/50 shadow-[0_0_10px_#63D8FF80]",
  for_two: "bg-primary/20 text-primary border-primary/50 shadow-[var(--shadow-neon)]",
};

type FilterId = "all" | Category;
const CATEGORIES: { id: FilterId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новинки" },
  { id: "hits", label: "Хиты" },
  { id: "coop", label: "На двоих/четверых" },
  { id: "racing", label: "Гонки" },
  { id: "sports", label: "Спортивные" },
  { id: "kids", label: "Для детей" },
  { id: "horror", label: "Хорроры" },
  { id: "exclusive", label: "Эксклюзивы" },
];


function gameImageSrc(url: string | null | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `/api/public/game-image/${url}`;
}

function GamesPage() {
  const [active, setActive] = useState<FilterId>("all");
  const listFn = useServerFn(listGames);
  const q = useQuery({ queryKey: ["games"], queryFn: () => listFn() });

  const filtered = useMemo(() => {
    const all = q.data ?? [];
    if (active === "all") return all;
    return all.filter((g) => g.categories?.includes(active));
  }, [q.data, active]);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-3 items-center">
          <div className="justify-self-start">
            <Link to="/" hash="games" aria-label="К разделу игр"
              className="inline-flex items-center justify-center h-10 w-10 rounded-md text-foreground hover:text-primary transition">
              <span className="text-2xl leading-none">←</span>
            </Link>
          </div>
          <Link to="/" className="justify-self-center flex items-center gap-2">
            <span className="font-display font-bold text-2xl tracking-wider">
              <span style={{ color: "#63D8FF" }}>GAME</span>
              <span style={{ color: "#F14FF0" }}>PLAY</span>
            </span>
          </Link>
          <div />
        </div>
      </header>

      <section className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-display font-bold text-4xl sm:text-6xl uppercase">
            <span className="text-gradient">Полная</span> <span className="text-gradient">библиотека игр</span>
          </h1>
          <p className="mt-4 text-muted-foreground">Многие игры уже установлены и готовы к запуску</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`px-4 py-2 rounded-full border text-xs font-display font-bold uppercase tracking-wider transition ${
                active === f.id
                  ? "border-primary bg-primary/15 text-primary shadow-[var(--shadow-neon)]"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {q.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">В этой категории пока нет игр.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((g) => {
                const src = gameImageSrc(g.image_url);
                return (
                  <div key={g.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-border hover:border-primary transition-all duration-150 hover:shadow-[var(--shadow-neon)] active:scale-[0.97]">
                    {src ? (
                      <img src={src} alt={g.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {g.stickers?.length > 0 && (
                      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
                        {g.stickers.map((s) => (
                          <span key={s} className={`text-[10px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STICKER_STYLES[s]}`}>
                            {STICKER_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-3 text-center font-display font-bold uppercase text-sm text-white drop-shadow">
                      {g.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-center text-muted-foreground text-sm mt-8">Показано: {filtered.length}</p>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4 sm:px-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} GamePlay Нальчик
      </footer>
      <FloatingContactButton />
    </div>
  );
}
