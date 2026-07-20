import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getCookieConsent, setCookieConsent, loadAnalytics, type CookieConsentValue } from "@/lib/analytics";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === "accepted") {
      loadAnalytics();
    } else if (consent === null) {
      setVisible(true);
    }
  }, []);

  const handle = (value: CookieConsentValue) => {
    setCookieConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-[var(--shadow-neon)] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left flex-1">
          Мы используем файлы cookie для аналитики и улучшения работы сайта. Продолжая
          пользоваться сайтом, вы соглашаетесь с{" "}
          <Link to="/privacy-policy" className="text-primary underline hover:brightness-110">
            Политикой конфиденциальности
          </Link>.
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
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
