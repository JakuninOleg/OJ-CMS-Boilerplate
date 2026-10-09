/** Shared upload policy, with no server dependencies so help text cannot drift. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const MAX_PHOTO_PIXELS = 40_000_000;
export const MAX_PHOTO_SIDE = 10_000;
export const MEDIA_IMAGE_WIDTHS = { mobile: 480, content: 960, wide: 1600 } as const;

export const MEDIA_UPLOAD_HELP = 'Фото: JPEG (.jpg/.jpeg), PNG или WebP, до 10 МБ. Анимация, GIF, HEIC и SVG не поддерживаются. Документы: PDF или DOCX, до 20 МБ. Для сайта автоматически создаются WebP-копии; оригинал сохраняется. Повреждённый файл или ошибка обработки отменяют сохранение.';

export type ImageVariant = {
  filename?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
};

export function isUsableImageVariant(value: ImageVariant | null | undefined): value is ImageVariant & { filename: string; width: number; height: number } {
  return Boolean(value?.filename && value.mimeType === 'image/webp'
    && Number.isSafeInteger(value.width) && value.width! > 0 && value.width! <= MAX_PHOTO_SIDE
    && Number.isSafeInteger(value.height) && value.height! > 0 && value.height! <= MAX_PHOTO_SIDE
    && value.width! * value.height! <= MAX_PHOTO_PIXELS
    && value.filesize && value.filesize > 0 && value.filesize <= MAX_PHOTO_BYTES);
}
