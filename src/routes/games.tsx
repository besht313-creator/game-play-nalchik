import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { FloatingContactButton } from "@/components/FloatingContactButton";

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

type Category = "all" | "new" | "hits" | "coop" | "racing" | "kids" | "horror" | "exclusive";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новинки" },
  { id: "hits", label: "Хиты" },
  { id: "coop", label: "На двоих/четверых" },
  { id: "racing", label: "Гонки" },
  { id: "kids", label: "Для детей" },
  { id: "horror", label: "Хорроры" },
  { id: "exclusive", label: "Эксклюзивы" },
];

type Game = { title: string; cats: Category[] };

const GAMES: Game[] = [
  { title: "GTA V", cats: ["hits"] },
  { title: "GTA VI", cats: ["new", "hits", "exclusive"] },
  { title: "FIFA 26", cats: ["new", "hits", "coop"] },
  { title: "EA FC 25", cats: ["coop", "hits"] },
  { title: "Mortal Kombat 1", cats: ["coop", "hits"] },
  { title: "UFC 5", cats: ["coop"] },
  { title: "Call of Duty MW III", cats: ["hits", "coop"] },
  { title: "Spider-Man 2", cats: ["exclusive", "hits"] },
  { title: "God of War Ragnarok", cats: ["exclusive", "hits"] },
  { title: "The Last of Us Part II", cats: ["exclusive", "horror"] },
  { title: "Horizon Forbidden West", cats: ["exclusive"] },
  { title: "Gran Turismo 7", cats: ["racing", "exclusive"] },
  { title: "Need for Speed Unbound", cats: ["racing"] },
  { title: "F1 24", cats: ["racing", "new"] },
  { title: "Crash Bandicoot 4", cats: ["kids", "coop"] },
  { title: "Sackboy: A Big Adventure", cats: ["kids", "coop", "exclusive"] },
  { title: "Minecraft", cats: ["kids", "coop"] },
  { title: "LEGO Star Wars", cats: ["kids", "coop"] },
  { title: "Ratchet & Clank", cats: ["kids", "exclusive"] },
  { title: "Resident Evil 4 Remake", cats: ["horror", "hits"] },
  { title: "Resident Evil Village", cats: ["horror"] },
  { title: "Alan Wake 2", cats: ["horror", "new"] },
  { title: "Dead Space Remake", cats: ["horror"] },
  { title: "It Takes Two", cats: ["coop", "hits"] },
  { title: "A Way Out", cats: ["coop"] },
  { title: "Overcooked! 2", cats: ["coop", "kids"] },
  { title: "Mortal Kombat XL", cats: ["coop"] },
  { title: "Tekken 8", cats: ["new", "coop"] },
  { title: "Street Fighter 6", cats: ["coop", "new"] },
  { title: "Hogwarts Legacy", cats: ["hits"] },
  { title: "Elden Ring", cats: ["hits"] },
  { title: "Cyberpunk 2077", cats: ["hits"] },
  { title: "Assassin's Creed Shadows", cats: ["new"] },
  { title: "Death Stranding 2", cats: ["new", "exclusive"] },
  { title: "Returnal", cats: ["exclusive", "horror"] },
  { title: "Demon's Souls", cats: ["exclusive"] },
];

function GamesPage() {
  const [active, setActive] = useState<Category>("all");

  const filtered = useMemo(
    () => active === "all" ? GAMES : GAMES.filter((g) => g.cats.includes(active)),
    [active]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display font-bold text-2xl tracking-wider">
              <span style={{ color: "#63D8FF" }}>GAME</span>
              <span style={{ color: "#F14FF0" }}>PLAY</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
            ← На главную
          </Link>
        </div>
      </header>

      <section className="pt-32 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-display font-bold text-4xl sm:text-6xl uppercase">
            Полная <span className="text-gradient">библиотека игр</span>
          </h1>
          <p className="mt-4 text-muted-foreground">Все игры уже установлены и готовы к запуску</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-display font-bold uppercase tracking-wider border transition active:scale-[0.96] ${
                active === c.id
                  ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-neon)]"
                  : "bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">В этой категории пока нет игр.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((g) => (
                <div
                  key={g.title}
                  className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center p-4 text-center font-display font-bold uppercase hover:border-primary transition hover:shadow-[var(--shadow-neon)]"
                >
                  {g.title}
                </div>
              ))}
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
