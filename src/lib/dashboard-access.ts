import type { CollectionSlug, SanitizedPermissions } from 'payload';

/** Visibility is a presentation setting, not permission to query a collection. */
export function readableDashboardCollections(
  visible: CollectionSlug[],
  permissions: SanitizedPermissions | undefined,
): Set<CollectionSlug> {
  return new Set(visible.filter(slug => permissions?.collections?.[slug]?.read === true));
}
