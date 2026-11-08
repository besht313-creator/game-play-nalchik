import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getCookieConsent,
  setCookieConsent,
  loadAnalytics,
  type CookieConsentValue,
} from "@/lib/analytics";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="hover:text-primary transition normal-case tracking-normal"
      onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
    >
      Настройки аналитики
    </button>
  );
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === "accepted") {
      loadAnalytics();
    } else if (consent === null) {
      setVisible(true);
    }
    const open = () => setVisible(true);
    window.addEventListener("open-cookie-settings", open);
    return () => window.removeEventListener("open-cookie-settings", open);
  }, []);

  const handle = (value: CookieConsentValue) => {
    const revoke = value === "declined" && getCookieConsent() === "accepted";
    setCookieConsent(value);
    // Reload to stop the already running Metrika script, including Webvisor.
    if (revoke) window.location.reload();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Настройки аналитики"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-[var(--shadow-neon)] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left flex-1">
          Разрешить аналитику Яндекс.Метрики? Она помогает понять, откуда приходят посетители и как
          они пользуются сайтом. Выбор можно изменить в подвале сайта.{" "}
          <Link to="/privacy-policy" className="text-primary underline hover:brightness-110">
            Политика конфиденциальности
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handle("declined")}
            className="rounded-full px-4 py-2 border border-border text-xs font-medium hover:border-primary hover:text-primary transition"
          >
            Отклонить
          </button>
          <button
            onClick={() => handle("accepted")}
            className="rounded-full px-5 py-2 bg-primary text-primary-foreground font-display font-bold uppercase text-xs tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.96] transition-all"
          >
            Разрешить
          </button>
        </div>
      </div>
    </div>
  );
}
