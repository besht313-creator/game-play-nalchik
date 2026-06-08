import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import heroImg from "@/assets/hero-ps5.jpg";
import ps5Asset from "@/assets/ps5.jpg.asset.json";
import ps4Asset from "@/assets/ps4.jpg.asset.json";
const ps5Img = ps5Asset.url;
const ps4Img = ps4Asset.url;
import { ContactDialog } from "@/components/ContactDialog";
import { FloatingContactButton } from "@/components/FloatingContactButton";
import { MessageCircle, Send, Instagram, Monitor, Phone, PackageCheck, Gamepad2 } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/gameplay_nalchik?igsh=a3l4ZWFrYXp4MTh2";
const VK_URL = "https://vk.ru/club237840986";

const VkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.685-1.565-1.765-1.602-.313-3.486 1.81-2.35 4.207-5.59 2.16-5.59h-3.66c-.787 0-.854.444-1.131 1.114-1.012 2.428-2.91 5.4-3.62 4.94-.74-.477-.4-2.413-.345-5.802.015-.736.005-1.244-1.12-1.504-.611-.141-1.205-.205-1.756-.205-2.21 0-3.74.97-2.88 1.13.853.158 1.418.428 1.418 2.131 0 2.213.286 4.358-1.18 4.358-.69 0-2.27-2.213-3.27-4.778-.45-1.146-.32-1.847-1.84-1.847H1.74c-.94 0-1.74.176-1.74.794 0 1.052.802 3.96 3.61 7.66 2.243 2.97 4.62 4.96 7.94 4.96.7 0 1.205-.072 1.612-.137z"/>
  </svg>
);


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GamePlay | Аренда PS5 & PS4 в Нальчике" },
      { name: "description", content: "Посуточная аренда игровых приставок PlayStation 5 и PlayStation 4 в Нальчике. Большая библиотека игр, доставка, низкие цены." },
      { property: "og:title", content: "GamePlay | Аренда PS5 & PS4 в Нальчике" },
      { property: "og:description", content: "Посуточная аренда игровых приставок PlayStation 5 и PlayStation 4 в Нальчике." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const PHONE = "+7 (903) 495-33-48";
const PHONE_HREF = "tel:+79034953348";

const consoles = [
  { name: "PS4 SLIM", tag: "Classic", desc: "Идеально для вечерних посиделок", price: "700", img: ps4Img },
  { name: "PS5", tag: "ХИТ", desc: "Максимум графики и мощности", price: "1100", img: ps5Img },
];

const steps = [
  { n: "01", title: "Выбор", text: "Выбираете консоль на нашем сайте.", icon: Monitor },
  { n: "02", title: "Заявка", text: "Позвоните или напишите нам в WhatsApp/Telegram для брони.", icon: Phone },
  { n: "03", title: "Получение", text: "Забираете комплект (потребуется паспорт для оформления договора).", icon: PackageCheck },
  { n: "04", title: "Игра", text: "Подключаете к ТВ и наслаждаетесь классной игровой атмосферой!", icon: Gamepad2 },
];

const games = ["GTA V", "FIFA 26", "Mortal Kombat 1", "UFC 5", "Call of Duty", "Spider-Man 2"];

const AVITO_URL = "https://www.avito.ru/nalchik/predlozheniya_uslug/arenda_ps5ps4_prokat_pleysteshen_5_3639072809";

const reviews = [
  { name: "Тембулат Петров", date: "12 февраля", text: "Все отлично. Сразу ответили, проинформировали. Приехал, забрал, всю ночь играл — никаких проблем не было." },
  { name: "ИП Лавров", date: "20 мая", text: "Очень удобный сервис! Приставка с двумя контроллерами и всеми проводами, удобно упакована в рюкзак для перевозки. Большой выбор игр. Однозначно буду пользоваться!" },
  { name: "Archer", date: "23 января", text: "Хороший парень, все чётко, добровестный прокатчик… 👌🤝" },
];

const faqs = [
  { q: "Что входит в комплект?", a: "В стандартный комплект входит: игровая приставка, 2 беспроводных геймпада (DualSense для PS5 или DualShock 4 для PS4), а также все необходимые провода: кабель питания, HDMI-кабель и 2 шнура для зарядки джойстиков." },
  { q: "А что если я случайно сломаю геймпад?", a: "Согласно договору аренды, арендатор несёт полную имущественную ответственность за порчу или поломку арендованного имущества. Мы просим относиться к технике бережно." },
  { q: "Нужен ли залог или паспорт?", a: "Для оформления аренды заключается официальный договор. В качестве залога вы можете оставить либо паспорт, либо денежную сумму (размер залога уточняется при бронировании), на ваше усмотрение." },
  { q: "До скольки можно играть?", a: "Минимальный срок аренды составляет 24 часа. Например, если вы взяли приставку в 14:00, её необходимо будет вернуть на следующий день в это же время (14:00)." },
];

function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="font-display font-bold text-2xl tracking-wider"><span style={{ color: "#63D8FF" }}>GAME</span><span style={{ color: "#F14FF0" }}>PLAY</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#consoles" className="hover:text-foreground transition">Приставки</a>
            <a href="#how" className="hover:text-foreground transition">Как это работает</a>
            <a href="#games" className="hover:text-foreground transition">Игры</a>
            <a href="#reviews" className="hover:text-foreground transition">Отзывы</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <ContactDialog>
            <span className="hidden md:inline-flex items-center gap-2 rounded-full px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.92] active:brightness-125 transition-all duration-150 shadow-[var(--shadow-neon)] cursor-pointer">
              Забронировать
            </span>
          </ContactDialog>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-foreground p-2 rounded-lg hover:bg-primary/10 active:scale-[0.88] active:brightness-125 transition-all duration-150" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M18 6 6 18M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-8 flex flex-col gap-6 text-2xl font-display font-bold uppercase tracking-wider">
            <a href="#consoles" onClick={() => setMenuOpen(false)} className="hover:text-primary transition">Приставки</a>
            <a href="#how" onClick={() => setMenuOpen(false)} className="hover:text-primary transition">Как это работает</a>
            <a href="#games" onClick={() => setMenuOpen(false)} className="hover:text-primary transition">Игры</a>
            <a href="#reviews" onClick={() => setMenuOpen(false)} className="hover:text-primary transition">Отзывы</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="hover:text-primary transition">FAQ</a>
            <ContactDialog>
              <span className="text-primary cursor-pointer">{PHONE}</span>
            </ContactDialog>
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border flex-wrap">
              <a href="https://wa.me/message/573SWX2JZIG6C1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-[#25D366] hover:border-[#25D366] hover:shadow-[0_0_20px_#25D36680] hover:scale-110 active:scale-90 active:brightness-125 transition-all duration-150">
                <MessageCircle className="w-7 h-7" />
              </a>
              <a href="https://t.me/Arenda_PS5" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-[#0088cc] hover:border-[#0088cc] hover:shadow-[0_0_20px_#0088cc80] hover:scale-110 active:scale-90 active:brightness-125 transition-all duration-150">
                <Send className="w-7 h-7" />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-[#E1306C] hover:border-[#E1306C] hover:shadow-[0_0_20px_#E1306C80] hover:scale-110 active:scale-90 active:brightness-125 transition-all duration-150">
                <Instagram className="w-7 h-7" />
              </a>
              <a href={VK_URL} target="_blank" rel="noopener noreferrer" aria-label="VK" className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-[#0077FF] hover:border-[#0077FF] hover:shadow-[0_0_20px_#0077FF80] hover:scale-110 active:scale-90 active:brightness-125 transition-all duration-150">
                <VkIcon className="w-7 h-7" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40" width={1280} height={1280} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-8xl leading-[0.95] uppercase">
<span><span style={{ color: "#63D8FF" }}>GAME</span><span style={{ color: "#F14FF0" }}>PLAY</span></span> — <br />
            посуточная аренда<br />
            игровых приставок
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-lg text-muted-foreground">
            Хотите окунуться в мир новейших игр и развлечений? Возьмите в прокат Sony PlayStation 5!
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#consoles" className="rounded-full px-8 py-4 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.92] active:brightness-125 transition-all duration-150 shadow-[var(--shadow-neon)]">
              Каталог приставок
            </a>
          </div>
        </div>
      </section>

      {/* Consoles */}
      <section id="consoles" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionTitle>Каталог приставок</SectionTitle>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {consoles.map((c) => (
              <div key={c.name} className="group relative rounded-2xl bg-card border border-border overflow-hidden hover:border-primary transition">
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img src={c.img} alt={c.name} loading="lazy" width={800} height={800} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-2xl">{c.name}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold uppercase">{c.tag}</span>
                  </div>
                  <p className="text-muted-foreground italic">«{c.desc}»</p>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <span className="font-display text-4xl font-bold text-gradient">{c.price} ₽</span>
                      <span className="text-muted-foreground ml-2">/ сутки</span>
                    </div>
                    <ContactDialog>
                      <span className="rounded-full px-5 py-3 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.92] active:brightness-125 transition-all duration-150 cursor-pointer">
                        Арендовать
                      </span>
                    </ContactDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-24 px-4 sm:px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <SectionTitle>Как это работает</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="relative p-8 rounded-2xl bg-card border border-border hover:neon-border transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-display text-5xl font-bold text-gradient">{s.n}</div>
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="games" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <SectionTitle align="left">Библиотека игр</SectionTitle>
              <p className="text-muted-foreground mt-2">уже установлено и готово к игре!</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {games.map((g) => (
              <div key={g} className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center p-4 text-center font-display font-bold uppercase hover:border-primary transition-all duration-150 hover:shadow-[var(--shadow-neon)] active:scale-[0.97] active:brightness-110">
                {g}
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link to="/games" className="rounded-full px-8 py-4 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-neon)] active:scale-[0.92] active:brightness-125 transition-all duration-150 shadow-[var(--shadow-neon)]">
              Полная библиотека игр
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-24 px-4 sm:px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-center uppercase">
            Более 150 положительных<br/>
            <span className="text-gradient">отзывов на Avito</span>
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4 text-accent">
            {"★★★★★".split("").map((s, i) => <span key={i} className="text-2xl">{s}</span>)}
            <span className="ml-2 text-foreground font-semibold">Рейтинг 5.0</span>
          </div>
          <div className="mt-12 relative overflow-hidden group" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
            <div className="flex gap-6 w-max animate-marquee group-hover:[animation-play-state:paused]">
              {[...reviews, ...reviews].map((r, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-card border border-border w-[320px] sm:w-[360px] shrink-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-primary-foreground">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{r.name}</div>
                      <div className="text-muted-foreground text-xs">{r.date} · Клиент</div>
                      <div className="text-accent text-xs mt-0.5">★★★★★</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">"{r.text}"</p>
                  <div className="mt-4 text-xs text-primary font-semibold">✓ Сделка состоялась</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <a href={AVITO_URL} target="_blank" rel="noopener noreferrer" className="rounded-full px-8 py-4 bg-accent text-accent-foreground font-display font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[var(--shadow-cyan)] active:scale-[0.92] active:brightness-125 transition-all duration-150 shadow-[var(--shadow-cyan)]">
              Смотреть отзывы на Avito
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <SectionTitle>FAQ</SectionTitle>
          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-6 flex items-center justify-between text-left font-display font-bold text-lg">
                  <span>{f.q}</span>
                  <span className={`text-primary transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-muted-foreground">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <div className="font-display font-bold text-2xl"><span style={{ color: "#63D8FF" }}>GAME</span><span style={{ color: "#F14FF0" }}>PLAY</span></div>
            <p className="text-muted-foreground text-sm mt-2">Аренда консолей в Нальчике</p>
          </div>
          <div>
            <a href={PHONE_HREF} className="font-display text-xl font-bold hover:text-primary transition">{PHONE}</a>
            <p className="text-muted-foreground text-sm mt-2">Работаем ежедневно</p>
          </div>
          <div className="flex justify-center md:justify-end items-start gap-3 flex-wrap">
            <a href="https://wa.me/message/573SWX2JZIG6C1" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-[#25D366] hover:border-[#25D366] hover:shadow-[0_0_15px_#25D36680] hover:scale-110 transition" aria-label="WhatsApp">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="https://t.me/Arenda_PS5" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-[#0088cc] hover:border-[#0088cc] hover:shadow-[0_0_15px_#0088cc80] hover:scale-110 transition" aria-label="Telegram">
              <Send className="w-5 h-5" />
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-[#E1306C] hover:border-[#E1306C] hover:shadow-[0_0_15px_#E1306C80] hover:scale-110 transition" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href={VK_URL} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-[#0077FF] hover:border-[#0077FF] hover:shadow-[0_0_15px_#0077FF80] hover:scale-110 transition" aria-label="VK">
              <VkIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground uppercase tracking-widest">
          © 2026 GAMEPLAY NALCHIK. Все права защищены.
        </div>
      </footer>
      {!menuOpen && <FloatingContactButton />}
    </div>
  );
}

function SectionTitle({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "left" }) {
  return (
    <h2 className={`font-display font-bold text-4xl sm:text-5xl uppercase ${align === "center" ? "text-center" : ""}`}>
      <span className="text-gradient">{children}</span>
    </h2>
  );
}
