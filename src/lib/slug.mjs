const transliteration = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Accepts imported (possibly mixed-case / underscore) and newly generated slugs. */
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Stable readable URL segment from a Russian (or Latin) title.
 * Does not invent meaning: digits and Latin model codes stay as-is.
 * @param {string} title
 * @returns {string}
 */
export function generateSlug(title) {
  if (typeof title !== 'string') return '';
  return [...title.normalize('NFKC').toLowerCase()]
    .map((letter) => transliteration[letter] ?? letter)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isValidSlug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 100 && SLUG_PATTERN.test(value);
}

/**
 * Normalize editor input without changing an already-valid imported slug.
 * Empty / whitespace-only → ''.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSlugInput(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.normalize('NFKC').trim();
  if (!trimmed) return '';
  if (isValidSlug(trimmed)) return trimmed;
  return generateSlug(trimmed);
}
