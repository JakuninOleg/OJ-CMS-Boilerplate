import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor, FixedToolbarFeature, EXPERIMENTAL_TableFeature } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { ru } from '@payloadcms/translations/languages/ru';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { Users, Media, Pages, Posts } from './collections';
import { databasePool } from './lib/database-pool';
import { MAX_DOCUMENT_BYTES } from './lib/media-policy';
import { adminSearchEndpoint } from './lib/admin-search';
import { oj } from './oj.config';
const directory = path.dirname(fileURLToPath(import.meta.url));
const secret = process.env.PAYLOAD_SECRET;
if (!secret || secret.length < 32) throw new Error('PAYLOAD_SECRET must contain at least 32 characters');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (process.env.S3_BUCKET && ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].some(key => !process.env[key])) throw new Error('Complete all S3 settings or leave S3_BUCKET empty');
const smtp = process.env.SMTP_HOST;
export default buildConfig({
  secret, serverURL: process.env.PUBLIC_SITE_URL || 'http://127.0.0.1:3200',
  ...(smtp ? { email: nodemailerAdapter({ defaultFromAddress: process.env.SMTP_FROM_ADDRESS || '', defaultFromName: process.env.SMTP_FROM_NAME || oj.name,
    transport: nodemailer.createTransport({ host: smtp, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASSWORD || '' } }) }) } : {}),
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru', translations: { ru: { general: { payloadSettings: 'Настройки OJ CMS' } } } },
  routes: { admin: '/admin' },
  admin: { user: 'users', theme: 'light', dateFormat: 'dd.MM.yyyy, HH:mm',
    meta: { titleSuffix: ` · ${oj.name}`, icons: { icon: oj.logo, shortcut: oj.logo } },
    importMap: { baseDir: directory }, components: {
      beforeLogin: ['/components/cms/OJLoginIntro'], afterLogin: ['/components/cms/OJLoginCredit'],
      Nav: '/components/cms/OJNav', header: ['/components/cms/OJHeader'],
      graphics: { Logo: '/components/cms/OJBrand', Icon: '/components/cms/OJBrand' },
      views: { dashboard: { Component: '/components/cms/OJDashboard' } },
    } },
  collections: [Users, Pages, Posts, Media], endpoints: [adminSearchEndpoint],
  editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature(), EXPERIMENTAL_TableFeature()] }),
  db: postgresAdapter({ pool: databasePool(), push: process.env.NODE_ENV !== 'production' }),
  typescript: { outputFile: path.resolve(directory, 'payload-types.ts') }, sharp,
  upload: { limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 }, requestSizeLimit: MAX_DOCUMENT_BYTES + 2 * 1024 * 1024,
    abortOnLimit: true, responseOnLimit: 'Фото: до 10 МБ; PDF и DOCX: до 20 МБ' },
  plugins: process.env.S3_BUCKET ? [s3Storage({ bucket: process.env.S3_BUCKET, collections: { media: { prefix: process.env.S3_PREFIX || 'media' } },
    config: { endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } } })] : [],
});
