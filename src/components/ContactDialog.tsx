import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle, Send } from "lucide-react";

const PHONE = "+7 (903) 495-33-48";
const PHONE_HREF = "tel:+79034953348";
const WHATSAPP_URL = "https://wa.me/message/573SWX2JZIG6C1";
const TELEGRAM_URL = "https://t.me/Arenda_PS5";

export function ContactDialog({
  children,
}: {
  children: React.ReactNode;
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
            className="flex items-center justify-center rounded-xl px-5 py-4 transition font-display font-bold uppercase tracking-wider text-white"
          >
            {PHONE}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-5 py-4 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 transition font-display font-bold uppercase tracking-wider"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366] shrink-0" />
            <span>WhatsApp</span>
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-5 py-4 bg-[#0088cc]/20 hover:bg-[#0088cc]/30 border border-[#0088cc]/30 transition font-display font-bold uppercase tracking-wider"
          >
            <Send className="h-5 w-5 text-[#0088cc] shrink-0" />
            <span>Telegram</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
