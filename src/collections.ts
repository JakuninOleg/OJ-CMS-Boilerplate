import { APIError, type CollectionConfig, type Field } from 'payload';
import { administrators, administratorsField, editors, publishedOrEditor } from './access';
import { automaticSlug } from './hooks/slug';
import { isValidSlug } from './lib/slug.mjs';
import { ALLOWED_MEDIA_MIME_TYPES, validateMediaBeforeOperation, validateMediaUpload } from './hooks/media';
import { MAX_PHOTO_PIXELS, MEDIA_UPLOAD_HELP } from './lib/media-policy';
import { referencesMedia } from './lib/media-references';

export const Users: CollectionConfig = {
  slug: 'users', auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000 },
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'], group: 'Система' },
  access: {
    admin: editors, create: administrators, delete: administrators,
    read: args => administrators(args) ? true : args.req.user ? { id: { equals: args.req.user.id } } : false,
    update: args => administrators(args) ? true : args.req.user ? { id: { equals: args.req.user.id } } : false,
  },
  hooks: { beforeDelete: [async ({ id, req }) => {
    const user = await req.payload.findByID({ collection: 'users', id, req, overrideAccess: true });
    if (user.role === 'administrator' && (await req.payload.count({ collection: 'users', req, overrideAccess: true, where: { role: { equals: 'administrator' } } })).totalDocs <= 1) {
      throw new APIError('Нельзя удалить последнего администратора', 400);
    }
  }], beforeChange: [async ({ data, originalDoc, req, operation }) => {
    if (operation === 'create' && (await req.payload.count({ collection: 'users', req, overrideAccess: true })).totalDocs === 0) data.role = 'administrator';
    if (originalDoc?.role === 'administrator' && data.role && data.role !== 'administrator' &&
      (await req.payload.count({ collection: 'users', req, overrideAccess: true, where: { role: { equals: 'administrator' } } })).totalDocs <= 1) {
      throw new APIError('Нельзя изменить роль последнего администратора', 400);
    }
    return data;
  }] },
  fields: [
    { name: 'name', label: 'Имя', type: 'text' },
    { name: 'role', label: 'Роль', type: 'select', required: true, defaultValue: 'editor',
      options: [{ label: 'Администратор', value: 'administrator' }, { label: 'Редактор', value: 'editor' }],
      access: { create: administratorsField, update: administratorsField },
      admin: { description: 'Редактор управляет контентом. Пользователей и удаление контролирует администратор.' } },
  ],
};

export const Media: CollectionConfig = {
  slug: 'media', labels: { singular: 'Файл', plural: 'Медиа' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['filename', 'title', 'mimeType', 'updatedAt'],
    description: MEDIA_UPLOAD_HELP, components: { Description: '/components/cms/OJMediaDescription' } },
  access: { read: () => true, create: editors, update: editors, delete: administrators },
  hooks: { beforeOperation: [validateMediaBeforeOperation], beforeValidate: [validateMediaUpload], beforeDelete: [async ({ id, req }) => {
    for (const collection of ['pages', 'posts'] as const) {
      const [published, drafts, versions] = await Promise.all([
        req.payload.find({ collection, req, depth: 0, pagination: false, overrideAccess: true }),
        req.payload.find({ collection, req, draft: true, depth: 0, pagination: false, overrideAccess: true }),
        req.payload.findVersions({ collection, req, depth: 0, pagination: false, overrideAccess: true }),
      ]);
      if ([published.docs, drafts.docs, versions.docs.map(item => item.version)].some(records => referencesMedia(records, id))) throw new APIError('Файл используется в записи или сохранённой версии. Сначала уберите ссылки на него', 409);
    }
  }] },
  upload: {
    staticDir: '.data/media', adminThumbnail: 'mobile', pasteURL: false, allowRestrictedFileTypes: false,
    mimeTypes: [...ALLOWED_MEDIA_MIME_TYPES], constructorOptions: { limitInputPixels: MAX_PHOTO_PIXELS, failOn: 'warning' },
    imageSizes: [480, 960, 1600].map((width, index) => ({ name: ['mobile', 'content', 'wide'][index]!, width,
      fit: 'inside' as const, withoutEnlargement: true, formatOptions: { format: 'webp' as const, options: { quality: 85, effort: 4 } } })),
  },
  fields: [{ name: 'title', type: 'text', label: 'Название' }, { name: 'alt', type: 'text', label: 'Описание изображения', admin: { description: 'Что изображено на фото. Используется для доступности.' } }],
};

const contentFields = (): Field[] => [
  { name: 'title', type: 'text', required: true, label: 'Заголовок' },
  { name: 'slug', type: 'text', unique: true, index: true, label: 'Адрес страницы',
    hooks: { beforeValidate: [automaticSlug] }, validate: (value: unknown) => !value || isValidSlug(value) || 'Латинские буквы, цифры и дефис',
    admin: { position: 'sidebar', description: 'Заполняется из заголовка. Изменение заголовка не меняет существующий адрес. Редиректы настраиваются отдельно в проекте.' } },
  { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обложка' },
  { name: 'excerpt', type: 'textarea', label: 'Краткое описание' },
  { name: 'content', type: 'richText', label: 'Содержание' },
  { name: 'seo', type: 'group', label: 'Поисковая оптимизация', fields: [
    { name: 'title', type: 'text', label: 'Заголовок в поиске' },
    { name: 'description', type: 'textarea', label: 'Описание в поиске' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение для соцсетей' },
    { name: 'noIndex', type: 'checkbox', label: 'Не индексировать страницу', defaultValue: false },
  ] },
];
const contentAccess = { read: publishedOrEditor, create: editors, update: editors, delete: administrators };
export const Pages: CollectionConfig = { slug: 'pages', labels: { singular: 'Страница', plural: 'Страницы' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'slug', '_status', 'updatedAt'] },
  access: contentAccess, versions: { drafts: true }, fields: contentFields() };
export const Posts: CollectionConfig = { slug: 'posts', labels: { singular: 'Публикация', plural: 'Публикации' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'slug', '_status', 'updatedAt'] },
  access: contentAccess, versions: { drafts: true },
  fields: [...contentFields(), { name: 'publishedAt', type: 'date', label: 'Дата публикации', admin: { position: 'sidebar' } }] };
