import { APIError, type FieldHook, type Where } from 'payload';
import { generateSlug, normalizeSlugInput } from '../lib/slug.mjs';
/** Titles can change without silently changing saved URLs. */
export const automaticSlug: FieldHook = async ({ value, data, originalDoc, req, collection }) => {
  if (originalDoc?.slug && (!value || value === originalDoc.slug)) return originalDoc.slug;
  const provided = normalizeSlugInput(value);
  const base = provided || generateSlug(String(data?.title || ''));
  if (!base) throw new APIError('Введите название или адрес страницы', 400);
  const taken = async (candidate: string) => {
    const and: Where[] = [{ slug: { equals: candidate } }];
    if (originalDoc?.id) and.push({ id: { not_equals: originalDoc.id } });
    return (await req.payload.count({ collection: collection!.slug, req, overrideAccess: true, where: { and } })).totalDocs > 0;
  };
  if (provided) {
    if (await taken(provided)) throw new APIError('Такой адрес уже занят. Укажите другой', 400);
    return provided;
  }
  for (let index = 1; index < 1000; index++) {
    const suffix = index === 1 ? '' : `-${index}`;
    const candidate = base.slice(0, 100 - suffix.length) + suffix;
    if (!(await taken(candidate))) return candidate;
  }
  throw new APIError('Не удалось подобрать свободный адрес. Введите его вручную', 400);
};
