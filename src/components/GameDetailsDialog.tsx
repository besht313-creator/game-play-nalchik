import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Volume2, Languages } from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";
import type { GameRow, Lang, Players } from "@/lib/games.functions";

const DURATION = 340;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const VOICE_LABELS: Record<Lang, string> = { ru: "Русская", en: "Английская" };
const UI_LABELS: Record<Lang, string> = { ru: "Русский", en: "Английский" };

// На сервере useLayoutEffect ругается в логах, а замер всё равно нужен только в браузере.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function gameImageSrc(url: string | null | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `/api/public/game-image/${url}`;
}

/** Силуэты «один / двое / четверо» — сплошные глифы, берут цвет текста. */
export function PlayersIcon({ count, className }: { count: Players; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "currentColor", className, "aria-hidden": true } as const;

  if (count === 1) {
    return (
      <svg {...common}>
        <circle cx="12" cy="7" r="4" />
        <path d="M12 12.6c-4.3 0-7.8 2.6-7.8 5.9v.6c0 .6.5 1.1 1.1 1.1h13.4c.6 0 1.1-.5 1.1-1.1v-.6c0-3.3-3.5-5.9-7.8-5.9Z" />
      </svg>
    );
  }

  if (count === 2) {
    return (
      <svg {...common}>
        <circle cx="8" cy="7.3" r="3.4" />
        <circle cx="16.6" cy="7.3" r="3.4" />
        <path d="M16.6 12.1c-1.3 0-2.6.3-3.7 1 1.6 1.1 2.6 2.7 2.6 4.5v1.6h6.2c.6 0 1-.4 1-1v-1.1c0-2.8-2.7-5-6.1-5Z" />
        <path d="M8 12.1c-3.4 0-6.1 2.2-6.1 5v1.1c0 .6.4 1 1 1h10.2c.6 0 1-.4 1-1v-1.1c0-2.8-2.7-5-6.1-5Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="4.8" cy="8" r="2.7" />
      <path d="M8.1 12.3a5.3 5.3 0 0 0-3.3-1.1A4.6 4.6 0 0 0 .2 15.8v.9c0 .5.4.9.9.9h4.3v-1.2c0-1.7.9-3.2 2.7-4.1Z" />
      <circle cx="19.2" cy="8" r="2.7" />
      <path d="M19.2 11.2c-1.2 0-2.3.4-3.3 1.1 1.8.9 2.7 2.4 2.7 4.1v1.2h4.3c.5 0 .9-.4.9-.9v-.9a4.6 4.6 0 0 0-4.6-4.6Z" />
      <circle cx="12" cy="7" r="3.4" />
      <path d="M12 11.8c-3.3 0-6 2-6 4.6v2.1c0 .5.4.9.9.9h10.2c.5 0 .9-.4.9-.9v-2.1c0-2.6-2.7-4.6-6-4.6Z" />
    </svg>
  );
}

export type GameDetails = { game: GameRow; rect: DOMRect };

/**
 * Состояние окна: запоминаем не только игру, но и положение карточки,
 * из которой окно должно «вырасти».
 */
export function useGameDetails() {
  const [details, setDetails] = useState<GameDetails | null>(null);
  const open = useCallback((game: GameRow, el: HTMLElement) => {
    setDetails({ game, rect: el.getBoundingClientRect() });
  }, []);
  const clear = useCallback(() => setDetails(null), []);
  return { details, open, clear };
}

export function GameDetailsDialog({
  details,
  onClosed,
}: {
  details: GameDetails | null;
  /** Вызывается после окончания анимации закрытия — тогда и убираем окно. */
  onClosed: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  // Открытие: панель разворачивается из прямоугольника карточки (приём FLIP).
  useIsomorphicLayoutEffect(() => {
    if (!details) return;
    closingRef.current = false;
    const panel = panelRef.current;
    overlayRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION, easing: EASING, fill: "both" });
    if (!panel) return;

    if (reducedMotion()) {
      panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "both" });
      return;
    }

    const to = panel.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const from = details.rect;
    panel.animate(
      [
        {
          transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${
            from.top + from.height / 2 - (to.top + to.height / 2)
          }px) scale(${from.width / to.width}, ${from.height / to.height})`,
          opacity: 0.4,
          borderRadius: "12px",
        },
        { transform: "none", opacity: 1, borderRadius: "16px" },
      ],
      { duration: DURATION, easing: EASING, fill: "both" },
    );
  }, [details]);

  // Закрытие: та же анимация в обратную сторону, и только потом размонтируем.
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const panel = panelRef.current;
    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURATION * 0.85,
      easing: EASING,
      fill: "both",
    });

    if (!panel || !details) {
      onClosed();
      return;
    }

    const finish = () => onClosed();
    if (reducedMotion()) {
      panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "both" }).finished.then(finish, finish);
      return;
    }

    const to = panel.getBoundingClientRect();
    const from = details.rect;
    panel
      .animate(
        [
          { transform: "none", opacity: 1, borderRadius: "16px" },
          {
            transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${
              from.top + from.height / 2 - (to.top + to.height / 2)
            }px) scale(${from.width / to.width}, ${from.height / to.height})`,
            opacity: 0.2,
            borderRadius: "12px",
          },
        ],
        { duration: DURATION * 0.85, easing: EASING, fill: "both" },
      )
      .finished.then(finish, finish);
  }, [details, onClosed]);

  const game = details?.game ?? null;
  const cover = gameImageSrc(game?.image_url);

  return (
    <DialogPrimitive.Root
      open={details !== null}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay ref={overlayRef} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none focus:outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <div
            ref={panelRef}
            className="pointer-events-auto w-full max-w-md max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-neon)] will-change-transform"
          >
            {game && (
              <>
                <div className="relative aspect-video bg-secondary">
                  {cover ? (
                    <img src={cover} alt={game.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Закрыть"
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-foreground hover:bg-background active:scale-90 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative -mt-8 p-5">
                  <DialogPrimitive.Title className="font-display font-bold text-2xl uppercase leading-tight">
                    {game.title}
                  </DialogPrimitive.Title>

                  {(game.genre || game.players) && (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{game.genre}</span>
                      {game.players && (
                        <span className="shrink-0 flex items-center gap-1.5 text-sm font-medium">
                          <PlayersIcon count={game.players} className="w-5 h-5 text-primary" />
                          {game.players} {game.players === 1 ? "игрок" : "игрока"}
                        </span>
                      )}
                    </div>
                  )}

                  {game.description && (
                    <p className="mt-4 text-muted-foreground leading-relaxed">{game.description}</p>
                  )}

                  {(game.voice_lang || game.ui_lang) && (
                    <div className="mt-5 pt-4 border-t border-border grid gap-2 text-sm">
                      {game.voice_lang && (
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">Озвучка:</span>
                          <span className="font-medium">{VOICE_LABELS[game.voice_lang]}</span>
                        </div>
                      )}
                      {game.ui_lang && (
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">Интерфейс:</span>
                          <span className="font-medium">{UI_LABELS[game.ui_lang]}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 [&>button]:w-full">
                    <ContactDialog>
                      <span className="w-full inline-flex items-center justify-center rounded-full px-6 py-3 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.97] transition-all duration-150">
                        Забронировать
                      </span>
                    </ContactDialog>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
