import { useState } from "react";
import { Phone, MessageCircle, Send, Plus, X } from "lucide-react";

const PHONE_HREF = "tel:+79034953348";
const WHATSAPP_URL = "https://wa.me/message/573SWX2JZIG6C1";
const TELEGRAM_URL = "https://t.me/Arenda_PS5";
const VK_URL = "https://vk.ru/club237840986";

const VkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.685-1.565-1.765-1.602-.313-3.486 1.81-2.35 4.207-5.59 2.16-5.59h-3.66c-.787 0-.854.444-1.131 1.114-1.012 2.428-2.91 5.4-3.62 4.94-.74-.477-.4-2.413-.345-5.802.015-.736.005-1.244-1.12-1.504-.611-.141-1.205-.205-1.756-.205-2.21 0-3.74.97-2.88 1.13.853.158 1.418.428 1.418 2.131 0 2.213.286 4.358-1.18 4.358-.69 0-2.27-2.213-3.27-4.778-.45-1.146-.32-1.847-1.84-1.847H1.74c-.94 0-1.74.176-1.74.794 0 1.052.802 3.96 3.61 7.66 2.243 2.97 4.62 4.96 7.94 4.96.7 0 1.205-.072 1.612-.137z"/>
  </svg>
);

const actions = [
  { icon: Phone, href: PHONE_HREF, label: "Позвонить", color: "#22c55e", shadow: "#22c55e80" },
  { icon: MessageCircle, href: WHATSAPP_URL, label: "WhatsApp", color: "#25D366", shadow: "#25D36680" },
  { icon: Send, href: TELEGRAM_URL, label: "Telegram", color: "#0088cc", shadow: "#0088cc80" },
  { icon: VkIcon, href: VK_URL, label: "VK", color: "#0077FF", shadow: "#0077FF80" },
];

export function FloatingContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-3" aria-hidden={!open}>
        {actions.map((a, i) => {
          const Icon = a.icon;
          const total = actions.length;
          const delay = open ? i * 0.05 : (total - 1 - i) * 0.05;
          return (
            <a
              key={a.label}
              href={a.href}
              target={a.href.startsWith("tel:") ? undefined : "_blank"}
              rel={a.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
              aria-label={a.label}
              tabIndex={open ? 0 : -1}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border hover:scale-110 active:scale-90 active:brightness-125"
              style={{
                color: a.color,
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
                pointerEvents: open ? "auto" : "none",
                transition: `opacity 0.25s ease-out ${delay}s, transform 0.25s ease-out ${delay}s, border-color 0.15s, box-shadow 0.15s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = a.color;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 15px ${a.shadow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              <Icon className="w-6 h-6" />
            </a>
          );
        })}
      </div>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Закрыть" : "Связаться"}
        className={`relative w-[60px] h-[60px] rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:brightness-110 active:scale-90 active:brightness-125 transition-all duration-200 ${open ? "shadow-[var(--shadow-neon)]" : "animate-attention"}`}
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      >
        <Phone
          className="w-7 h-7 absolute transition-all duration-300"
          style={{ opacity: open ? 0 : 1, transform: open ? "scale(0.5) rotate(-180deg)" : "scale(1) rotate(0deg)" }}
        />
        <X
          className="w-7 h-7 absolute transition-all duration-300"
          style={{ opacity: open ? 1 : 0, transform: open ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(180deg)" }}
        />
      </button>
    </div>
  );
}
