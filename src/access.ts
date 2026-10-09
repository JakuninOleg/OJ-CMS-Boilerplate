import type { Access, PayloadRequest } from 'payload';

const role = (user: unknown) => (user as { role?: string } | null)?.role;
export const administrators = ({ req }: { req: PayloadRequest }): boolean => role(req.user) === 'administrator';
export const administratorsField = administrators;
export const editors = ({ req }: { req: PayloadRequest }): boolean => ['administrator', 'editor'].includes(role(req.user) || '');
export const publishedOrEditor: Access = args => editors(args) ? true : { _status: { equals: 'published' } };
