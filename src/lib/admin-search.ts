import type { Endpoint } from 'payload';
import { editors } from '../access';
import { contentCollections } from '../oj.config';
export const adminSearchEndpoint: Endpoint = { path: '/admin-search', method: 'get', handler: async req => {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!editors({ req })) return Response.json({ message: 'Доступ запрещён' }, { status: 403, headers });
  const q = new URL(req.url || 'http://localhost').searchParams.get('q')?.trim() || '';
  if (q.length < 2 || q.length > 80) return Response.json({ results: [] }, { headers });
  const groups = await Promise.all(contentCollections.map(async ({ slug: collection }) => {
    const result = await req.payload.find({ collection, req, overrideAccess: false, draft: true, depth: 0, limit: 4, where: { title: { contains: q } } });
    return result.docs.map(doc => ({ id: doc.id, collection, title: doc.title }));
  }));
  return Response.json({ results: groups.flat() }, { headers });
} };
