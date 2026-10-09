import type { PayloadRequest, ServerProps } from 'payload'
import { getTranslation } from '@payloadcms/translations'
import { Logout } from '@payloadcms/ui'
import { EntityType, getNavGroups } from '@payloadcms/ui/shared'
import { NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { formatAdminURL } from 'payload/shared'
import Link from 'next/link'
import OJBrand from './OJBrand'
import OJNavClient, { type OJNavLink } from './OJNavClient'
import './oj-admin.scss'
import { oj } from '../../oj.config'

export type OJNavProps = {
  req?: PayloadRequest
} & ServerProps

const COLLECTION_ORDER = [
  'pages',
  'posts',
  'media',
  'users',
] as const

function sortSlug(a: string, b: string): number {
  const ai = COLLECTION_ORDER.indexOf(a as (typeof COLLECTION_ORDER)[number])
  const bi = COLLECTION_ORDER.indexOf(b as (typeof COLLECTION_ORDER)[number])
  const av = ai === -1 ? COLLECTION_ORDER.length : ai
  const bv = bi === -1 ? COLLECTION_ORDER.length : bi
  if (av !== bv) return av - bv
  return a.localeCompare(b)
}

/**
 * OJ-styled Payload admin Nav (server). Uses authenticated req permissions
 * via visibleEntities + getNavGroups — no demo/localStorage roles.
 * Keeps native NavWrapper / hamburger / Logout mechanisms.
 */
export default async function OJNav(props: OJNavProps) {
  const {
    i18n,
    payload,
    permissions,
    user,
    visibleEntities,
  } = props

  if (!payload?.config || !visibleEntities) {
    return null
  }

  const adminRoute = payload.config.routes.admin
  const dashboardHref = formatAdminURL({ adminRoute, path: '/' })
  const accountHref = formatAdminURL({ adminRoute, path: '/account' })

  const groups = getNavGroups(
    permissions ?? {},
    visibleEntities,
    payload.config,
    i18n,
  )

  const collectionLinks: OJNavLink[] = groups
    .flatMap((group) => group.entities)
    .filter((entity) => entity.type === EntityType.collection)
    .map((entity) => ({
      slug: entity.slug,
      href: formatAdminURL({
        adminRoute,
        path: `/collections/${entity.slug}`,
      }),
      id: `nav-${entity.slug}`,
      label: getTranslation(entity.label, i18n),
    }))
    .sort((a, b) => sortSlug(a.slug, b.slug))
    .map(({ href, id, label, slug }) => ({ href, id, label, slug }))

  const display =
    (user as { name?: string | null; email?: string } | null | undefined)?.name?.trim() ||
    (user as { email?: string } | null | undefined)?.email ||
    'редактор'

  const role = (user as { role?: string } | null | undefined)?.role
  const roleLabel =
    role === 'administrator' ? 'Администратор' : role === 'editor' ? 'Редактор' : null

  return (
    <NavWrapper baseClass="nav">
      <div className="oj-nav">
        <div className="oj-nav__brand-row">
          <Link
            className="oj-nav__brand"
            href={dashboardHref}
            prefetch={false}
            aria-label={`${oj.name}: обзор сайта`}
          >
            <OJBrand />
          </Link>
        </div>

        <nav className="oj-nav__navigation" aria-label="Основная навигация">
          <OJNavClient links={collectionLinks} dashboardHref={dashboardHref} />
          {collectionLinks.length === 0 ? (
            <p className="oj-nav__empty">Нет доступных коллекций для вашей роли.</p>
          ) : null}
        </nav>

        <div className="oj-nav__footer">
          <a className="oj-nav__help" href={oj.developerURL} target="_blank" rel="noopener noreferrer"><strong>Нужна помощь?</strong><span>Вопросы по сайту и системе управления</span><b>Написать разработчику</b></a>
          <div className="oj-nav__user" aria-label="Текущий пользователь">
            <strong className="oj-nav__user-name">{display}</strong>
            {roleLabel ? <small className="oj-nav__user-role">{roleLabel}</small> : null}
          </div>

          <div className="oj-nav__actions">
            <Link
              className="oj-nav__action"
              href={accountHref}
              prefetch={false}
              id="nav-account"
            >
              Аккаунт
            </Link>
            <Link
              className="oj-nav__action"
              href={oj.publicSiteURL}
              prefetch={false}
              id="nav-public-site"
              target="_blank"
              rel="noreferrer"
            >
              Публичный сайт
            </Link>
            <div className="oj-nav__logout">
              <Logout />
            </div>
          </div>

          <a className="oj-nav__credit" href={oj.developerURL} target="_blank" rel="noopener noreferrer">
            <span><strong>OJ CMS</strong><br />Разработка: Олег Якунин</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  )
}
