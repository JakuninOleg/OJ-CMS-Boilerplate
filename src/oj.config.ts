/** Public branding only. Never put credentials in this file: client components import it. */
export const oj = {
  name: 'OJ CMS',
  subtitle: 'Управление контентом',
  logo: '/oj-mark.svg',
  developerURL: 'https://jakuninoleg.dev/ru',
  publicSiteURL: '/',
  timeZone: 'UTC',
  timeZoneLabel: 'UTC',
};
export const contentCollections = [
  { slug: 'pages', label: 'Страницы', create: 'Создать страницу' },
  { slug: 'posts', label: 'Публикации', create: 'Добавить публикацию' },
] as const;
