// Контакты и ссылки на мессенджеры.
//
// Раньше номер и адреса были скопированы в ContactDialog, FloatingContactButton
// и index.tsx — при смене номера пришлось бы править три файла.
//
// Главное здесь — подстановка текста в мессенджер. Клиент нажимает кнопку, и у
// него в WhatsApp или Telegram уже написано, что он с сайта и что именно хочет
// арендовать: не нужно гадать, откуда пришёл человек и о чём речь.

export const PHONE = "+7 (903) 495-33-48";
export const PHONE_HREF = "tel:+79034953348";

/** Номер WhatsApp в международном формате, только цифры. */
const WHATSAPP_PHONE = "79034953348";
/** Имя пользователя в Telegram, без @. */
const TELEGRAM_USERNAME = "Arenda_PS5";

export const INSTAGRAM_URL = "https://www.instagram.com/gameplay_nalchik?igsh=a3l4ZWFrYXp4MTh2";
export const VK_URL = "https://vk.ru/club237840986";

/**
 * Текст, который подставится в поле ввода мессенджера.
 *
 * @param about — чего хочет клиент, например «Хочу арендовать PS5.».
 *                Без него получается общее обращение.
 */
export function contactMessage(about?: string): string {
  const intro = "Здравствуйте! Пишу с сайта gameplay-nalchik.ru.";
  return about ? `${intro} ${about}` : `${intro} Хочу арендовать приставку.`;
}

/**
 * Ссылка на чат в WhatsApp с заранее подставленным текстом.
 *
 * Обязательно формат wa.me/<номер>: короткая ссылка вида wa.me/message/<код>
 * параметр text игнорирует, и текст бы не подставился.
 */
export function whatsappUrl(about?: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(contactMessage(about))}`;
}

/** Ссылка на чат в Telegram с заранее подставленным текстом. */
export function telegramUrl(about?: string): string {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(contactMessage(about))}`;
}

/** Готовые формулировки — чтобы во всех точках сайта они звучали одинаково. */
export const askAboutConsole = (name: string) => `Хочу арендовать ${name}.`;
export const askAboutGame = (title: string) => `Хочу арендовать приставку с игрой «${title}».`;
