import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  listGames,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
  adminMoveGame,
  adminReorderGame,
  adminUploadImage,
  CATEGORY_VALUES,
  PLAYERS_VALUES,
  type GameRow,
  type Sticker,
  type Category,
  type Lang,
  type Players,
} from "@/lib/games.functions";
import { optimizeImage, blobToBase64, formatBytes } from "@/lib/image-compress";
import { CATEGORY_LABELS, STICKER_LABELS, gameImageSrc } from "@/lib/game-display";

// Оригинал может быть тяжёлым: перед отправкой он всё равно ужимается в браузере.
const MAX_UPLOAD_MB = 25;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Админ-панель | GamePlay" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminPage,
});

const STICKER_LIST: Sticker[] = ["hit", "new", "for_two", "for_four"];

function StickerBadge({ s }: { s: Sticker }) {
  const styles: Record<Sticker, string> = {
    hit: "bg-[#F14FF0]/15 text-[#F14FF0] border-[#F14FF0]/40 shadow-[0_0_12px_#F14FF080]",
    new: "bg-[#63D8FF]/15 text-[#63D8FF] border-[#63D8FF]/40 shadow-[0_0_12px_#63D8FF80]",
    for_two: "bg-primary/15 text-primary border-primary/40 shadow-[var(--shadow-neon)]",
    for_four: "bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/40 shadow-[0_0_12px_#A78BFA80]",
  };
  return (
    <span
      className={`text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles[s]}`}
    >
      {STICKER_LABELS[s]}
    </span>
  );
}

function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Загрузка...
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return <AdminPanel onLogout={() => supabase.auth.signOut()} />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const mutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка входа"),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email && pw) mutation.mutate({ email, password: pw });
        }}
        // ym-disable-keys запрещает Вебвизору Яндекс.Метрики записывать нажатия
        // клавиш внутри формы. Без этого логин и пароль администратора попадали
        // бы в записи визитов, если в счётчике включено «Записывать все поля».
        className="ym-disable-keys w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-neon)]"
      >
        <h1 className="font-display font-bold text-3xl uppercase text-center">
          <span style={{ color: "#63D8FF" }}>ADMIN</span>
          <span style={{ color: "#F14FF0" }}>PANEL</span>
        </h1>
        <p className="text-center text-muted-foreground text-sm mt-2">Войдите, чтобы продолжить</p>
        <div className="mt-6">
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="username"
            className="ym-disable-keys w-full bg-input border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative mt-3">
          <input
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Пароль"
            autoComplete="current-password"
            className="ym-disable-keys w-full bg-input border border-border rounded-md pl-4 pr-20 py-3 text-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Скрыть пароль" : "Показать пароль"}
            className="absolute inset-y-0 right-2 my-1 px-3 rounded text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            {showPw ? "Скрыть" : "Показать"}
          </button>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending || !email || !pw}
          className="mt-4 w-full rounded-md py-3 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.97] transition disabled:opacity-50"
        >
          {mutation.isPending ? "Проверка..." : "Войти"}
        </button>
        <Link
          to="/"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-primary"
        >
          ← На главную
        </Link>
      </form>
    </div>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const list = useServerFn(listGames);
  const create = useServerFn(adminCreateGame);
  const update = useServerFn(adminUpdateGame);
  const del = useServerFn(adminDeleteGame);
  const move = useServerFn(adminMoveGame);
  const reorder = useServerFn(adminReorderGame);
  const upload = useServerFn(adminUploadImage);

  const games = useQuery({ queryKey: ["games"], queryFn: () => list() });

  const refresh = () => qc.invalidateQueries({ queryKey: ["games"] });

  const moveMut = useMutation({
    mutationFn: (v: { id: string; direction: "up" | "down" }) => move({ data: v }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const reorderMut = useMutation({
    mutationFn: (v: { id: string; toPosition: number }) => reorder({ data: v }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      refresh();
      toast.success("Удалено");
    },
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
            <span className="text-muted-foreground text-sm ml-2 normal-case font-normal">
              / admin
            </span>
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
        {games.error && (
          <p className="text-destructive text-center py-12">
            Ошибка: {(games.error as Error).message}
          </p>
        )}
        {games.data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {games.data.map((g, idx) => (
              <article
                key={g.id}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
                  {gameImageSrc(g.image_url) ? (
                    <img
                      src={gameImageSrc(g.image_url)!}
                      alt={g.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs uppercase">
                      нет фото
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {(g.stickers || []).map((s) => (
                      <StickerBadge key={s} s={s} />
                    ))}
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] bg-background/70 backdrop-blur px-2 py-0.5 rounded">
                    #{idx + 1}
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <h3 className="font-display font-bold text-sm leading-tight flex items-center gap-2">
                    {g.title}
                    {g.title_hidden && (
                      <span
                        className="shrink-0 text-[9px] font-normal normal-case tracking-normal text-muted-foreground border border-border rounded px-1.5 py-0.5"
                        title="Название скрыто на сайте, но доступно в поиске"
                      >
                        скрыто
                      </span>
                    )}
                  </h3>
                  <div className="mt-auto flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => moveMut.mutate({ id: g.id, direction: "up" })}
                      className="w-8 h-8 rounded border border-border hover:border-primary text-sm"
                      title="На одну позицию вверх"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveMut.mutate({ id: g.id, direction: "down" })}
                      className="w-8 h-8 rounded border border-border hover:border-primary text-sm"
                      title="На одну позицию вниз"
                    >
                      ↓
                    </button>
                    <PositionControl
                      index={idx}
                      total={games.data.length}
                      disabled={reorderMut.isPending}
                      onMove={(toPosition) => reorderMut.mutate({ id: g.id, toPosition })}
                    />
                    <button
                      onClick={() => setEditing(g)}
                      className="ml-auto px-3 h-8 rounded border border-border hover:border-primary text-xs"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить «${g.title}»?`)) delMut.mutate(g.id);
                      }}
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
          game={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            refresh();
            setAdding(false);
            setEditing(null);
          }}
          createFn={create}
          updateFn={update}
          uploadFn={upload}
        />
      )}
    </div>
  );
}

/**
 * Перестановка карточки: вписываем номер места и жмём → (или Enter).
 * Раньше для этого приходилось десятки раз кликать по стрелке.
 */
function PositionControl({
  index,
  total,
  disabled,
  onMove,
}: {
  index: number;
  total: number;
  disabled?: boolean;
  onMove: (position: number) => void;
}) {
  const [value, setValue] = useState(String(index + 1));

  // После перемещения список перестраивается — держим поле в согласии с реальным местом.
  useEffect(() => {
    setValue(String(index + 1));
  }, [index]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed) || parsed === index + 1) {
      setValue(String(index + 1));
      return;
    }
    onMove(Math.min(Math.max(parsed, 1), total));
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        max={total}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={`Место в каталоге, сейчас ${index + 1} из ${total}`}
        title={`Сейчас ${index + 1}-е место из ${total}. Впишите нужное и нажмите Enter`}
        className="w-12 h-8 rounded border border-border bg-input text-center text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="submit"
        disabled={disabled}
        title="Переместить на указанное место"
        className="w-8 h-8 rounded border border-border hover:border-primary text-sm disabled:opacity-50"
      >
        →
      </button>
    </form>
  );
}

/** Кнопка-переключатель в стиле стикеров и категорий. */
function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border text-xs font-display font-bold uppercase tracking-wider transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-neon)]"
          : "border-border text-muted-foreground hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

function LangPicker({
  value,
  onChange,
}: {
  value: Lang | null;
  onChange: (v: Lang | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <OptionButton active={value === "ru"} onClick={() => onChange(value === "ru" ? null : "ru")}>
        Русский
      </OptionButton>
      <OptionButton active={value === "en"} onClick={() => onChange(value === "en" ? null : "en")}>
        Английский
      </OptionButton>
      <OptionButton active={value === null} onClick={() => onChange(null)}>
        Не указано
      </OptionButton>
    </div>
  );
}

function GameForm({
  game,
  onClose,
  onSaved,
  createFn,
  updateFn,
  uploadFn,
}: {
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
  const [titleHidden, setTitleHidden] = useState(game?.title_hidden ?? false);
  const [genre, setGenre] = useState(game?.genre ?? "");
  const [players, setPlayers] = useState<Players | null>(game?.players ?? null);
  const [description, setDescription] = useState(game?.description ?? "");
  const [voiceLang, setVoiceLang] = useState<Lang | null>(game?.voice_lang ?? null);
  const [uiLang, setUiLang] = useState<Lang | null>(game?.ui_lang ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewSrc = useMemo(() => gameImageSrc(imageUrl), [imageUrl]);

  const STICKER_ORDER: Sticker[] = ["new", "hit", "for_two", "for_four"];
  const toggleSticker = (s: Sticker) => {
    setStickers((cur) => {
      const next = cur.includes(s)
        ? cur.filter((x) => x !== s)
        : cur.length >= 3
          ? cur
          : [...cur, s];
      return [...next].sort((a, b) => STICKER_ORDER.indexOf(a) - STICKER_ORDER.indexOf(b));
    });
  };

  const toggleCategory = (c: Category) => {
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`Файл больше ${MAX_UPLOAD_MB} МБ`);
      return;
    }
    setUploading(true);
    try {
      // Сжимаем прямо в браузере: ≤1800px по длинной стороне + WebP 80.
      const image = await optimizeImage(file);
      const dataBase64 = await blobToBase64(image.blob);
      const res = await uploadFn({
        data: {
          filename: image.filename,
          contentType: image.contentType || "image/jpeg",
          dataBase64,
        },
      });
      setImageUrl(res.path);
      toast.success(
        image.optimized
          ? `Фото загружено · ${formatBytes(image.originalSize)} → ${formatBytes(image.blob.size)}`
          : "Фото загружено",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Введите название");
      return;
    }
    setSaving(true);
    // Пустая строка в поле = «не заполнено», в базе это null.
    const details = {
      genre: genre.trim() || null,
      players,
      description: description.trim() || null,
      voice_lang: voiceLang,
      ui_lang: uiLang,
    };
    try {
      if (game) {
        await updateFn({
          data: {
            id: game.id,
            title: title.trim(),
            stickers,
            categories,
            image_url: imageUrl,
            title_hidden: titleHidden,
            ...details,
          },
        });
        toast.success("Сохранено");
      } else {
        await createFn({
          data: {
            title: title.trim(),
            stickers,
            categories,
            image_url: imageUrl,
            title_hidden: titleHidden,
            ...details,
          },
        });
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
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl uppercase">
            <span className="text-gradient">{game ? "Редактировать" : "Новая игра"}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Название
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
          placeholder="GTA VI"
        />
        <label className="mt-2 flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={titleHidden}
            onChange={(e) => setTitleHidden(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground leading-snug">
            Скрыть название на сайте — карточка останется в каталоге и будет находиться через поиск,
            но подпись под обложкой не покажется.
          </span>
        </label>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
          Фото игры
        </label>
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 rounded-lg border border-border bg-secondary overflow-hidden flex-shrink-0">
            {previewSrc ? (
              <img src={previewSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase">
                пусто
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="rounded-md px-3 py-2 border border-border text-sm text-center cursor-pointer hover:border-primary transition">
              {uploading ? "Загрузка..." : imageUrl ? "Заменить фото" : "Загрузить фото"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Сжимается автоматически: до 1800px по длинной стороне, формат WebP.
            </p>
            {imageUrl && (
              <button
                onClick={() => setImageUrl(null)}
                className="text-xs text-destructive hover:underline text-left"
              >
                Удалить фото
              </button>
            )}
          </div>
        </div>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
          Стикеры (до 3)
        </label>
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
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-neon)]"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {STICKER_LABELS[s]}
              </button>
            );
          })}
        </div>

        <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
          Категории
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_VALUES.map((c) => {
            const active = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={`px-3 py-1.5 rounded-md border text-xs font-display font-bold uppercase tracking-wider transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-neon)]"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Окно игры{" "}
            <span className="normal-case tracking-normal opacity-70">
              — незаполненные поля в окне не показываются
            </span>
          </p>

          <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1">
            Жанр
          </label>
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            maxLength={80}
            placeholder="Файтинг, гонки, кооперативное приключение..."
            className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
          />

          <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
            Сколько игроков
          </label>
          <div className="flex flex-wrap gap-2">
            {PLAYERS_VALUES.map((p) => (
              <OptionButton
                key={p}
                active={players === p}
                onClick={() => setPlayers(players === p ? null : p)}
              >
                {p}
              </OptionButton>
            ))}
            <OptionButton active={players === null} onClick={() => setPlayers(null)}>
              Не указано
            </OptionButton>
          </div>

          <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1">
            Описание{" "}
            <span className="normal-case tracking-normal opacity-70">
              — 1–2 фразы, {description.length}/600
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Коротко и по делу: почему в это стоит сыграть сегодня вечером."
            className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:border-primary resize-y"
          />

          <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
            Озвучка
          </label>
          <LangPicker value={voiceLang} onChange={setVoiceLang} />

          <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
            Интерфейс
          </label>
          <LangPicker value={uiLang} onChange={setUiLang} />
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md py-2.5 border border-border text-sm hover:border-foreground"
          >
            Отмена
          </button>
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
