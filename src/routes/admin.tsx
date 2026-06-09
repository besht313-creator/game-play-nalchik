import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listGames,
  adminVerify,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
  adminMoveGame,
  adminUploadImage,
  CATEGORY_VALUES,
  type GameRow,
  type Sticker,
  type Category,
} from "@/lib/games.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Админ-панель | GamePlay" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const STICKER_LABELS: Record<Sticker, string> = {
  hit: "Хит",
  new: "Новинка",
  for_two: "На двоих",
};
const STICKER_LIST: Sticker[] = ["hit", "new", "for_two"];

const CATEGORY_LABELS: Record<Category, string> = {
  new: "Новинки",
  hits: "Хиты",
  coop: "На двоих/четверых",
  racing: "Гонки",
  sports: "Спортивные",
  kids: "Для детей",
  horror: "Хорроры",
  exclusive: "Эксклюзивы",
};


function StickerBadge({ s }: { s: Sticker }) {
  const styles: Record<Sticker, string> = {
    hit: "bg-[#F14FF0]/15 text-[#F14FF0] border-[#F14FF0]/40 shadow-[0_0_12px_#F14FF080]",
    new: "bg-[#63D8FF]/15 text-[#63D8FF] border-[#63D8FF]/40 shadow-[0_0_12px_#63D8FF80]",
    for_two: "bg-primary/15 text-primary border-primary/40 shadow-[var(--shadow-neon)]",
  };
  return (
    <span className={`text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles[s]}`}>
      {STICKER_LABELS[s]}
    </span>
  );
}

function gameImageSrc(image_url: string | null | undefined) {
  if (!image_url) return null;
  if (image_url.startsWith("http")) return image_url;
  return `/api/public/game-image/${image_url}`;
}

function AdminPage() {
  const [password, setPassword] = useState<string>("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_password");
    if (stored) {
      setPassword(stored);
      setAuthed(true);
    }
  }, []);

  if (!authed) return <LoginScreen onAuth={(pw) => { setPassword(pw); setAuthed(true); }} />;
  return <AdminPanel password={password} onLogout={() => {
    sessionStorage.removeItem("admin_password");
    setAuthed(false);
    setPassword("");
  }} />;
}

function LoginScreen({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const verify = useServerFn(adminVerify);
  const mutation = useMutation({
    mutationFn: (password: string) => verify({ data: { password } }),
    onSuccess: (_d, password) => {
      sessionStorage.setItem("admin_password", password);
      onAuth(password);
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка входа"),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <form
        onSubmit={(e) => { e.preventDefault(); if (pw) mutation.mutate(pw); }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-neon)]"
      >
        <h1 className="font-display font-bold text-3xl uppercase text-center">
          <span style={{ color: "#63D8FF" }}>ADMIN</span>
          <span style={{ color: "#F14FF0" }}>PANEL</span>
        </h1>
        <p className="text-center text-muted-foreground text-sm mt-2">Введите пароль для входа</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Пароль"
          className="mt-6 w-full bg-input border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !pw}
          className="mt-4 w-full rounded-md py-3 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.97] transition disabled:opacity-50"
        >
          {mutation.isPending ? "Проверка..." : "Войти"}
        </button>
        <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-primary">← На главную</Link>
      </form>
    </div>
  );
}

function AdminPanel({ password, onLogout }: { password: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const list = useServerFn(listGames);
  const create = useServerFn(adminCreateGame);
  const update = useServerFn(adminUpdateGame);
  const del = useServerFn(adminDeleteGame);
  const move = useServerFn(adminMoveGame);
  const upload = useServerFn(adminUploadImage);

  const games = useQuery({ queryKey: ["games"], queryFn: () => list() });

  const refresh = () => qc.invalidateQueries({ queryKey: ["games"] });

  const moveMut = useMutation({
    mutationFn: (v: { id: string; direction: "up" | "down" }) =>
      move({ data: { password, ...v } }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { password, id } }),
    onSuccess: () => { refresh(); toast.success("Удалено"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [editing, setEditing] = useState<GameRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="font-display font-bold text-xl tracking-wider">
            <span style={{ color: "#63D8FF" }}>GAME</span>
            <span style={{ color: "#F14FF0" }}>PLAY</span>
            <span className="text-muted-foreground text-sm ml-2 normal-case font-normal">/ admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdding(true)}
              className="rounded-full px-4 py-2 bg-primary text-primary-foreground font-display font-bold uppercase text-xs tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.96] transition"
            >
              + Добавить
            </button>
            <button
              onClick={onLogout}
              className="rounded-full px-4 py-2 border border-border text-xs font-medium hover:border-primary hover:text-primary transition"
            >
              Выход
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {games.isLoading && <p className="text-muted-foreground text-center py-12">Загрузка...</p>}
        {games.error && <p className="text-destructive text-center py-12">Ошибка: {(games.error as Error).message}</p>}
        {games.data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {games.data.map((g, idx) => (
              <article key={g.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
                  {gameImageSrc(g.image_url) ? (
                    <img src={gameImageSrc(g.image_url)!} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs uppercase">
                      нет фото
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {(g.stickers || []).map((s) => <StickerBadge key={s} s={s} />)}
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] bg-background/70 backdrop-blur px-2 py-0.5 rounded">
                    #{idx + 1}
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <h3 className="font-display font-bold text-sm leading-tight">{g.title}</h3>
                  <div className="mt-auto flex items-center gap-1 flex-wrap">
                    <button onClick={() => moveMut.mutate({ id: g.id, direction: "up" })} className="w-8 h-8 rounded border border-border hover:border-primary text-sm" title="Вверх">↑</button>
                    <button onClick={() => moveMut.mutate({ id: g.id, direction: "down" })} className="w-8 h-8 rounded border border-border hover:border-primary text-sm" title="Вниз">↓</button>
                    <button onClick={() => setEditing(g)} className="ml-auto px-3 h-8 rounded border border-border hover:border-primary text-xs">Изменить</button>
                    <button
                      onClick={() => { if (confirm(`Удалить «${g.title}»?`)) delMut.mutate(g.id); }}
                      className="px-3 h-8 rounded border border-destructive/40 text-destructive text-xs hover:bg-destructive/10"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {(adding || editing) && (
        <GameForm
          password={password}
          game={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { refresh(); setAdding(false); setEditing(null); }}
          createFn={create}
          updateFn={update}
          uploadFn={upload}
        />
      )}
    </div>
  );
}

function GameForm({
  password, game, onClose, onSaved, createFn, updateFn, uploadFn,
}: {
  password: string;
  game: GameRow | null;
  onClose: () => void;
  onSaved: () => void;
  createFn: ReturnType<typeof useServerFn<typeof adminCreateGame>>;
  updateFn: ReturnType<typeof useServerFn<typeof adminUpdateGame>>;
  uploadFn: ReturnType<typeof useServerFn<typeof adminUploadImage>>;
}) {
  const [title, setTitle] = useState(game?.title ?? "");
  const [stickers, setStickers] = useState<Sticker[]>(game?.stickers ?? []);
  const [categories, setCategories] = useState<Category[]>(game?.categories ?? []);
  const [imageUrl, setImageUrl] = useState<string | null>(game?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewSrc = useMemo(() => gameImageSrc(imageUrl), [imageUrl]);

  const toggleSticker = (s: Sticker) => {
    setStickers((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= 3 ? cur : [...cur, s],
    );
  };

  const toggleCategory = (c: Category) => {
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  };


  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл больше 5 МБ"); return; }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const dataBase64 = btoa(binary);
      const res = await uploadFn({
        data: { password, filename: file.name, contentType: file.type || "image/jpeg", dataBase64 },
      });
      setImageUrl(res.path);
      toast.success("Фото загружено");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    try {
      if (game) {
        await updateFn({ data: { password, id: game.id, title: title.trim(), stickers, image_url: imageUrl } });
        toast.success("Сохранено");
      } else {
        await createFn({ data: { password, title: title.trim(), stickers, image_url: imageUrl } });
        toast.success("Игра добавлена");
      }
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl uppercase">
            <span className="text-gradient">{game ? "Редактировать" : "Новая игра"}</span>
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
        </div>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
          placeholder="GTA VI"
        />

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Фото игры</label>
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 rounded-lg border border-border bg-secondary overflow-hidden flex-shrink-0">
            {previewSrc ? (
              <img src={previewSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase">пусто</div>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="rounded-md px-3 py-2 border border-border text-sm text-center cursor-pointer hover:border-primary transition">
              {uploading ? "Загрузка..." : (imageUrl ? "Заменить фото" : "Загрузить фото")}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </label>
            {imageUrl && (
              <button onClick={() => setImageUrl(null)} className="text-xs text-destructive hover:underline text-left">Удалить фото</button>
            )}
          </div>
        </div>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Стикеры (до 3)</label>
        <div className="flex flex-wrap gap-2">
          {STICKER_LIST.map((s) => {
            const active = stickers.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSticker(s)}
                className={`px-3 py-1.5 rounded-md border text-xs font-display font-bold uppercase tracking-wider transition ${
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-[var(--shadow-neon)]"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {STICKER_LABELS[s]}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md py-2.5 border border-border text-sm hover:border-foreground">Отмена</button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 rounded-md py-2.5 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider text-sm hover:brightness-110 hover:shadow-[var(--shadow-neon)] disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
