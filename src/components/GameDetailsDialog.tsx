import { useCallback, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Volume2, Languages } from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";
import { askAboutGame } from "@/lib/contact";
import type { GameRow, Lang, Players } from "@/lib/games.functions";
import { gameImageSrc } from "@/lib/game-display";

const DURATION = 340;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const VOICE_LABELS: Record<Lang, string> = { ru: "Русская", en: "Английская" };
const UI_LABELS: Record<Lang, string> = { ru: "Русский", en: "Английский" };

function reducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Силуэты «один / двое / четверо» — сплошные глифы, берут цвет текста. */
export function PlayersIcon({ count, className }: { count: Players; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className,
    "aria-hidden": true,
  } as const;

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

/**
 * Начальный кадр раскрытия: окно уже построено целиком, но показан только
 * кусок размером с карточку — и сдвинут так, чтобы лечь ровно на неё.
 *
 * Раньше здесь был scale(), из-за которого окно именно «увеличивалось»:
 * вместе с рамкой растягивался и текст. Обрезка (clip-path) ничего не
 * искажает — карточка разворачивается, открывая содержимое как есть.
 */
function collapsedFrame(card: DOMRect, panel: DOMRect) {
  const width = Math.min(card.width, panel.width);
  const height = Math.min(card.height, panel.height);
  // По горизонтали раскрываемся из центра, по вертикали — от верхнего края,
  // где у окна стоит обложка: так стык с карточкой наименее заметен.
  const left = (panel.width - width) / 2;
  const top = 0;
  return {
    transform: `translate(${card.left - (panel.left + left)}px, ${card.top - (panel.top + top)}px)`,
    clipPath: `inset(${top}px ${panel.width - left - width}px ${panel.height - top - height}px ${left}px round 12px)`,
  };
}

const EXPANDED_FRAME = { transform: "translate(0px, 0px)", clipPath: "inset(0px round 16px)" };

export function GameDetailsDialog({
  details,
  onClosed,
}: {
  details: GameDetails | null;
  /** Вызывается после окончания анимации закрытия — тогда и убираем окно. */
  onClosed: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  // Анимацию запускает callback-ref панели, а не эффект этого компонента:
  // Radix монтирует содержимое в портал позже, и на момент эффекта родителя
  // panelRef ещё пуст — раньше из-за этого анимация молча не проигрывалась,
  // и окно просто возникало на экране целиком.
  const detailsRef = useRef(details);
  detailsRef.current = details;
  // Ref срабатывает не один раз за открытие. Без этой отметки повторный вызов
  // мерил уже сдвинутую анимацией панель и перезапускал раскрытие с нулевым
  // сдвигом — окно раскрывалось на месте, а не из карточки.
  const animatedFor = useRef<GameDetails | null>(null);

  const attachPanel = useCallback((node: HTMLDivElement | null) => {
    panelRef.current = node;
    const current = detailsRef.current;
    if (!node || !current || animatedFor.current === current) return;
    animatedFor.current = current;
    closingRef.current = false;

    overlayRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: DURATION,
      easing: EASING,
      fill: "both",
    });

    if (reducedMotion()) {
      node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "both" });
      return;
    }

    // Меряем панель без наложенных анимаций — иначе в размер попадёт сдвиг.
    node.getAnimations().forEach((a) => a.cancel());
    const to = node.getBoundingClientRect();
    if (!to.width || !to.height) return;
    node.animate([collapsedFrame(current.rect, to), EXPANDED_FRAME], {
      duration: DURATION,
      easing: EASING,
      fill: "both",
    });
    // Содержимое проявляется следом за рамкой — так раскрытие читается как
    // разворот карточки, а не как появление готового окна.
    contentRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: DURATION - 80, delay: 80, easing: EASING, fill: "both" },
    );
  }, []);

  // Закрытие: то же движение в обратную сторону, и только потом размонтируем.
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const panel = panelRef.current;
    const content = contentRef.current;
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
      panel
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "both" })
        .finished.then(finish, finish);
      return;
    }

    // Сначала снимаем анимацию открытия (она заканчивается на «окно целиком»),
    // потом меряем — иначе в размер попадёт незавершённый сдвиг.
    panel.getAnimations().forEach((a) => a.cancel());
    const to = panel.getBoundingClientRect();
    content?.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(8px)" },
      ],
      { duration: DURATION * 0.5, easing: EASING, fill: "both" },
    );
    panel
      .animate([EXPANDED_FRAME, collapsedFrame(details.rect, to)], {
        duration: DURATION * 0.85,
        easing: EASING,
        fill: "both",
      })
      .finished.then(finish, finish);
  }, [details, onClosed]);

  const game = details?.game ?? null;
  const cover = gameImageSrc(game?.image_url);
  const hasDetails = Boolean(
    game && (game.genre || game.players || game.description || game.voice_lang || game.ui_lang),
  );

  return (
    <DialogPrimitive.Root
      open={details !== null}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Клик по затемнению закрывает окно: слой Content растянут на весь
            экран, поэтому «клик снаружи» сам по себе не срабатывает. */}
        <DialogPrimitive.Overlay
          ref={overlayRef}
          onClick={close}
          className="fixed inset-0 z-50 backdrop-blur-sm [background-color:rgba(0,0,0,0.8)]"
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Radix сам ставит этому слою pointer-events: auto, поэтому он
          // растянут на весь экран и перехватывает клики — «клик снаружи» у
          // Radix не срабатывает. Закрываем сами, если кликнули мимо окна.
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          aria-describedby={undefined}
        >
          <div
            ref={attachPanel}
            className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-neon)] will-change-[transform,clip-path]"
          >
            {/* Обложка остаётся фоном окна: карточка разворачивается, а не подменяется. */}
            <div className="absolute inset-0 bg-card" aria-hidden>
              {cover ? (
                // Обложка остаётся фоном окна, но приглушённой: размытие плюс
                // низкая прозрачность поверх сплошного bg-card. Так текст
                // читается на любой картинке — хоть тёмной, хоть светлой.
                <img
                  src={cover}
                  alt=""
                  className="h-full w-full scale-110 object-cover opacity-10 blur-[6px]"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-accent opacity-25" />
              )}
            </div>

            {game && (
              <div className="relative max-h-[88vh] overflow-y-auto overflow-x-hidden">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Закрыть"
                  // z-10 обязателен: блок с текстом анимируется transform'ом и
                  // из-за этого перекрывал бы кнопку.
                  className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-foreground backdrop-blur transition [background-color:rgba(4,6,19,0.7)] hover:[background-color:rgba(4,6,19,0.95)] active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>

                <div ref={contentRef} className="p-5 pt-6 sm:p-6">
                  <DialogPrimitive.Title className="pr-12 font-display text-2xl leading-tight font-bold uppercase">
                    {game.title}
                  </DialogPrimitive.Title>

                  {(game.players || game.genre) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                      {game.players && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium [background-color:rgba(241,79,240,0.12)] [border-color:rgba(241,79,240,0.45)]">
                          <PlayersIcon count={game.players} className="h-4 w-4 text-[#F14FF0]" />
                          {game.players} {game.players === 1 ? "игрок" : "игрока"}
                        </span>
                      )}
                      {game.genre && <span className="text-muted-foreground">{game.genre}</span>}
                    </div>
                  )}

                  {(game.voice_lang || game.ui_lang) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      {game.voice_lang && (
                        <span className="inline-flex items-center gap-1.5">
                          <Volume2 className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">Озвучка:</span>
                          <span className="font-medium">{VOICE_LABELS[game.voice_lang]}</span>
                        </span>
                      )}
                      {game.ui_lang && (
                        <span className="inline-flex items-center gap-1.5">
                          <Languages className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">Интерфейс:</span>
                          <span className="font-medium">{UI_LABELS[game.ui_lang]}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {game.description && (
                    <p className="mt-4 leading-relaxed text-muted-foreground">{game.description}</p>
                  )}

                  {!hasDetails && (
                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      Подробности об игре уточним при бронировании.
                    </p>
                  )}

                  <div className="mt-6 [&>button]:w-full">
                    <ContactDialog about={askAboutGame(game.title)}>
                      <span className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-display font-bold tracking-wider uppercase text-primary-foreground transition-all duration-150 hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.97]">
                        Забронировать
                      </span>
                    </ContactDialog>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
