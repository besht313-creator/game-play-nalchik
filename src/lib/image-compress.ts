/**
 * Оптимизация фото перед загрузкой в Supabase Storage.
 *
 * Пайплайн повторяет админку MERAKI (includes/image.php): ресайз до ≤1800px по
 * длинной стороне + перекодирование в WebP (качество 80). Разница в том, что
 * здесь всё считается в браузере — ещё до отправки, поэтому экономится и
 * трафик загрузки, и место в хранилище.
 *
 * EXIF-поворот применяется при декодировании (imageOrientation: "from-image"),
 * так что фото с телефона не оказываются повёрнутыми на бок.
 */

export const MAX_SIDE = 1800;
export const WEBP_QUALITY = 0.8;
export const JPEG_QUALITY = 0.85;

/** Форматы, которые есть смысл (и безопасно) перекодировать. */
const RE_ENCODABLE = ["image/jpeg", "image/png", "image/webp"];

export type OptimizedImage = {
  blob: Blob;
  filename: string;
  contentType: string;
  originalSize: number;
  /** false — отдали оригинал как есть (неподдерживаемый формат или сбой декодирования). */
  optimized: boolean;
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function baseName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 60) || "photo";
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  const asIs: OptimizedImage = {
    blob: file,
    filename: file.name,
    contentType: file.type || "image/jpeg",
    originalSize: file.size,
    optimized: false,
  };

  // GIF (анимация), SVG, HEIC и прочую экзотику через canvas не гоняем —
  // потеряется больше, чем сэкономится.
  if (!RE_ENCODABLE.includes(file.type)) return asIs;

  let source: ImageBitmap | HTMLImageElement | null = null;
  let objectUrl: string | null = null;

  try {
    try {
      source = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Браузер не смог через createImageBitmap — пробуем обычный <img>,
      // он тоже уважает EXIF-ориентацию.
      objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;
      await img.decode();
      source = img;
    }

    const w = source.width;
    const h = source.height;
    if (!w || !h) return asIs;

    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const nw = Math.max(1, Math.round(w * scale));
    const nh = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return asIs;
    ctx.drawImage(source as CanvasImageSource, 0, 0, nw, nh);

    let blob = await toBlob(canvas, "image/webp", WEBP_QUALITY);
    let ext = "webp";
    // Старые Safari не кодируют WebP и молча отдают PNG — тогда уходим в JPEG.
    if (!blob || blob.type !== "image/webp") {
      blob = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
      ext = "jpg";
    }
    if (!blob) return asIs;

    // Мелкие картинки после перекодирования иногда тяжелеют — тогда оригинал лучше.
    if (scale === 1 && blob.size >= file.size) return asIs;

    return {
      blob,
      filename: `${baseName(file.name)}.${ext}`,
      contentType: blob.type,
      originalSize: file.size,
      optimized: true,
    };
  } catch {
    return asIs;
  } finally {
    if (source && "close" in source) source.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** base64 без префикса data:...;base64, — в таком виде его ждёт adminUploadImage. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(",");
  return comma === -1 ? "" : dataUrl.slice(comma + 1);
}
