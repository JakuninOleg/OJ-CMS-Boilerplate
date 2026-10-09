/** Only relationship fields and upload nodes, never arbitrary text containing an ID. */
export function referencesMedia(value: unknown, id: string | number): boolean {
  const matches = (relation: unknown): boolean => Array.isArray(relation) ? relation.some(matches) : relation != null && String(typeof relation === 'object' ? (relation as { id?: unknown }).id : relation) === String(id);
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(child => referencesMedia(child, id));
  const record = value as Record<string, unknown>;
  if (['cover', 'image'].some(key => matches(record[key]))) return true;
  if (record.type === 'upload' && record.relationTo === 'media' && matches(record.value)) return true;
  return Object.values(record).some(child => referencesMedia(child, id));
}
