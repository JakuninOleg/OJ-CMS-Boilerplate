import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { APIError, type CollectionBeforeOperationHook, type CollectionBeforeValidateHook } from 'payload';
import { MAX_DOCUMENT_BYTES, MAX_PHOTO_BYTES, MAX_PHOTO_PIXELS, MAX_PHOTO_SIDE, MEDIA_IMAGE_WIDTHS, isUsableImageVariant } from '../lib/media-policy';

/** Supported media formats; byte signatures are checked before processing. */
export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedMediaMime = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

const ALLOWED = new Set<string>(ALLOWED_MEDIA_MIME_TYPES);

const BLOCKED_EXTENSIONS = [
  '.svg',
  '.svgz',
  '.html',
  '.htm',
  '.xhtml',
  '.xml',
  '.js',
  '.mjs',
  '.php',
  '.phtml',
];

/** How many leading bytes to inspect for ZIP/OOXML and text spoofs. */
const PROBE_LIMIT = 64 * 1024;

export type MediaPayloadKind =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'pdf'
  | 'docx'
  | 'svg'
  | 'html'
  | 'xml'
  | 'unknown';

const MIME_TO_KIND: Record<AllowedMediaMime, Exclude<MediaPayloadKind, 'svg' | 'html' | 'xml' | 'unknown'>> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function essence(mime: string): string {
  return mime.toLowerCase().split(';', 1)[0]!.trim();
}

function startsWithBytes(data: Uint8Array, signature: number[], offset = 0): boolean {
  if (data.length < offset + signature.length) return false;
  return signature.every((byte, index) => data[offset + index] === byte);
}

function latin1Probe(data: Uint8Array): string {
  const end = Math.min(data.length, PROBE_LIMIT);
  let out = '';
  for (let i = 0; i < end; i++) out += String.fromCharCode(data[i]!);
  return out;
}

function stripBomAndLeadingWs(text: string): string {
  const clean = text.replace(/^\uFEFF/, '');
  let start = 0;
  while (start < clean.length && clean.charCodeAt(start) <= 32) start++;
  return clean.slice(start);
}

function looksLikeSvgOrMarkup(data: Uint8Array): MediaPayloadKind | null {
  const head = stripBomAndLeadingWs(latin1Probe(data).slice(0, 512)).toLowerCase();
  if (!head.startsWith('<')) return null;
  if (head.startsWith('<svg') || /<svg[\s>]/i.test(head)) return 'svg';
  if (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    head.startsWith('<head') ||
    head.startsWith('<body') ||
    head.startsWith('<script')
  ) {
    return 'html';
  }
  if (head.startsWith('<?xml')) {
    if (/<svg[\s>]/i.test(latin1Probe(data).slice(0, 4096))) return 'svg';
    return 'xml';
  }
  return null;
}

function isDocxZip(data: Uint8Array): boolean {
  // Local file header, empty archive, or spanned set — all start with "PK".
  if (!startsWithBytes(data, [0x50, 0x4b])) return false;
  const third = data[2];
  if (third !== 0x03 && third !== 0x05 && third !== 0x07) return false;
  const probe = latin1Probe(data);
  // OOXML package markers. This is type detection, not malware scanning.
  return probe.includes('[Content_Types].xml') && /word\//i.test(probe);
}

/**
 * Detect container kind from file bytes (magic / safe probes only).
 * Does not decode or execute content.
 */
export function detectMediaPayloadKind(data: Uint8Array): MediaPayloadKind {
  if (!data || data.length === 0) return 'unknown';

  const markup = looksLikeSvgOrMarkup(data);
  if (markup) return markup;

  // JPEG SOI
  if (startsWithBytes(data, [0xff, 0xd8, 0xff])) return 'jpeg';

  // PNG signature
  if (startsWithBytes(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';

  // RIFF....WEBP
  if (
    startsWithBytes(data, [0x52, 0x49, 0x46, 0x46]) &&
    data.length >= 12 &&
    startsWithBytes(data, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'webp';
  }

  // PDF: optional leading whitespace then %PDF
  {
    let i = 0;
    while (i < Math.min(data.length, 1024) && data[i]! <= 0x20) i++;
    if (
      i + 4 <= data.length &&
      data[i] === 0x25 &&
      data[i + 1] === 0x50 &&
      data[i + 2] === 0x44 &&
      data[i + 3] === 0x46
    ) {
      return 'pdf';
    }
  }

  if (isDocxZip(data)) return 'docx';

  return 'unknown';
}

function looksBlockedFilenameOrMime(filename: string, mime: string): string | null {
  const name = filename.toLowerCase();
  const type = essence(mime);

  if (
    type === 'image/svg+xml' ||
    type === 'text/html' ||
    type === 'application/xhtml+xml' ||
    type === 'text/xml' ||
    type === 'application/xml' ||
    type.includes('svg')
  ) {
    return 'SVG, HTML и XML загружать нельзя.';
  }

  if (BLOCKED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return 'Этот тип файла запрещён (SVG/HTML/скрипты).';
  }

  if (!type) {
    return 'Не удалось определить тип файла.';
  }

  if (!ALLOWED.has(type)) {
    return `Допустимы JPEG, PNG, WebP, PDF и DOCX. Получен: ${type}.`;
  }

  return null;
}

/**
 * Validate claimed MIME + filename against actual bytes.
 * Rejects SVG/HTML/XML spoofs renamed to .png/.jpg etc.
 * Returns null when allowed; otherwise a Russian error message.
 */
export function validateMediaBytes(
  filename: string,
  mime: string,
  data: Uint8Array | Buffer | null | undefined,
): string | null {
  const nameMimeReason = looksBlockedFilenameOrMime(filename, mime);
  if (nameMimeReason) return nameMimeReason;

  if (!data || data.length === 0) {
    return 'Не удалось прочитать содержимое файла для проверки типа.';
  }

  const type = essence(mime) as AllowedMediaMime;
  const expected = MIME_TO_KIND[type];
  const kind = detectMediaPayloadKind(data);

  if (kind === 'svg' || kind === 'html' || kind === 'xml') {
    return 'SVG, HTML и XML загружать нельзя.';
  }

  if (kind === 'unknown' || kind !== expected) {
    return `Содержимое файла не соответствует типу ${type}.`;
  }

  return null;
}

async function readUploadBytes(file: {
  data?: Buffer;
  tempFilePath?: string;
  size?: number;
}): Promise<Buffer | null> {
  if (file.data && file.data.length > 0) {
    return file.data;
  }
  if (file.tempFilePath) {
    const raw = await readFile(file.tempFilePath);
    return raw;
  }
  return null;
}

function animatedPng(bytes: Buffer): boolean {
  if (detectMediaPayloadKind(bytes) !== 'png') return false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    if (offset + length + 12 > bytes.length) return false;
    if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') return true;
    offset += length + 12;
  }
  return false;
}

export async function validatePhoto(bytes: Buffer): Promise<string | null> {
  try {
    if (animatedPng(bytes)) return 'Анимированные изображения не поддерживаются. Загрузите неподвижное фото JPEG, PNG или WebP.';
    const image = sharp(bytes, { limitInputPixels: MAX_PHOTO_PIXELS, failOn: 'warning' });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width > MAX_PHOTO_SIDE || meta.height > MAX_PHOTO_SIDE
      || meta.width * meta.height > MAX_PHOTO_PIXELS) {
      return 'Изображение слишком большое для безопасной обработки. Уменьшите его в Squoosh и загрузите снова.';
    }
    if ((meta.pages ?? 1) > 1) return 'Анимированные изображения не поддерживаются. Загрузите неподвижное фото JPEG, PNG или WebP.';
    // metadata() alone accepts truncated files. stats() decodes the entire raster.
    await image.stats();
    return null;
  } catch (error) {
    if (error instanceof Error && /pixel limit/i.test(error.message)) {
      return 'Изображение слишком большое для безопасной обработки. Уменьшите его в Squoosh и загрузите снова.';
    }
    return 'Не удалось полностью прочитать фото. Файл повреждён или имеет неподдерживаемое кодирование. Экспортируйте его заново в JPEG, PNG или WebP.';
  }
}

export async function validateUploadFile(file: { name: string; mimetype: string; size: number; data?: Buffer; tempFilePath?: string }): Promise<void> {
  const photo = essence(file.mimetype).startsWith('image/');
  const maximum = photo ? MAX_PHOTO_BYTES : MAX_DOCUMENT_BYTES;
  const actualSize = file.data?.length || (file.tempFilePath ? (await stat(file.tempFilePath)).size : 0);
  if (Math.max(file.size || 0, actualSize) > maximum) {
    throw new APIError(photo ? 'Фото должно весить не больше 10 МБ. Уменьшите файл и загрузите снова.' : 'Документ должен весить не больше 20 МБ.', 400);
  }
  const bytes = await readUploadBytes(file);
  const reason = validateMediaBytes(file.name, file.mimetype, bytes) || (photo && bytes ? await validatePhoto(bytes) : null);
  if (reason) throw new APIError(reason, 400);
}

/** Runs before Payload allocates/resizes the image, including Local API uploads. */
export const validateMediaBeforeOperation: CollectionBeforeOperationHook = async ({ operation, req, args }) => {
  if (operation !== 'create' && operation !== 'update') return;
  const submitted = 'data' in args ? args.data as { url?: unknown } : undefined;
  // The S3 adapter updates its URL metadata after upload under this server-only context.
  if (!req.context?.skipCloudStorage && !req.file && typeof submitted?.url === 'string' && /^https?:/i.test(submitted.url)) {
    throw new APIError('Загрузите файл с компьютера. Загрузка по внешней ссылке не поддерживается.', 400);
  }
  if (req.file) await validateUploadFile(req.file);
};

/** Confirm successful encoding before persisted media can become a relationship. */
export const validateMediaUpload: CollectionBeforeValidateHook = async ({ req, data }) => {
  // Payload's beforeValidate is AFTER generateFileData. Verify the actual encoded
  // buffers before DB save / S3 upload, not merely the presence of a filename.
  if (!req.file?.mimetype?.startsWith('image/') && !req.payloadUploadSizes) return;
  for (const [name, maximumWidth] of Object.entries(MEDIA_IMAGE_WIDTHS)) {
    const variant = data?.sizes?.[name];
    const buffer = req.payloadUploadSizes?.[name];
    if (!isUsableImageVariant(variant) || variant.width > maximumWidth || !buffer?.length
      || buffer.length !== variant.filesize || detectMediaPayloadKind(buffer) !== 'webp') {
      throw new APIError('Не удалось создать WebP-копии для сайта. Фото не сохранено. Попробуйте загрузить его снова.', 400);
    }
    const reason = await validatePhoto(buffer);
    const meta = await sharp(buffer, { limitInputPixels: MAX_PHOTO_PIXELS }).metadata();
    if (reason || meta.width !== variant.width || meta.height !== variant.height) {
      throw new APIError('Проверка обработанного фото не пройдена. Фото не сохранено. Экспортируйте исходник заново и повторите загрузку.', 400);
    }
  }
};
