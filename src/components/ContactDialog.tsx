import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle, Send } from "lucide-react";
import { PHONE, PHONE_HREF, telegramUrl, whatsappUrl } from "@/lib/contact";

// Прозрачность подложек кнопок записана прямо в цвете (восьмизначный hex).
// Утилиту вида bg-[#25D366]/20 Tailwind собирает через color-mix, и браузер
// без его поддержки заливает кнопку сплошным цветом — значок мессенджера того
// же цвета на ней пропадает.
export function ContactDialog({
  children,
  about,
}: {
  children: React.ReactNode;
  /**
   * Чего хочет клиент — уходит в текст сообщения. Например «Хочу арендовать
   * PS5.»: владелец сразу видит, с какой карточки пришёл человек.
   */
  about?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </button>
      <DialogContent className="sm:max-w-md border border-border bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase text-center">
            Свяжитесь с нами
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-display font-bold uppercase tracking-widest text-[10px] opacity-70">
            GAMEPLAY / НАЛЬЧИК
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <a
            href={PHONE_HREF}
            className="flex items-center justify-center rounded-xl px-5 py-4 transition font-display font-bold uppercase tracking-wider text-white text-xl"
          >
            {PHONE}
          </a>
          <a
            href={whatsappUrl(about)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-xl px-5 py-4 bg-[#25D36633] hover:bg-[#25D3664D] border border-[#25D3664D] transition font-display font-bold uppercase tracking-wider"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366] shrink-0" />
            <span>WhatsApp</span>
          </a>
          <a
            href={telegramUrl(about)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-xl px-5 py-4 bg-[#0088CC33] hover:bg-[#0088CC4D] border border-[#0088CC4D] transition font-display font-bold uppercase tracking-wider"
          >
            <Send className="h-5 w-5 text-[#0088cc] shrink-0" />
            <span>Telegram</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
