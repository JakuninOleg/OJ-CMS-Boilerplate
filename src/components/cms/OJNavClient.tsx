'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNav } from '@payloadcms/ui'

export type OJNavLink = {
  href: string
  id: string
  label: string
  slug?: string
  exact?: boolean
}

const ICON_PATHS: Record<string, string> = {
  pages: 'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
  posts: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h8 M8 18h5',
  leads: 'M3 5h18v14H3z M3 6l9 7 9-7',
  categories: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  products: 'M12 3 3 8v9l9 5 9-5V8z M3 8l9 5 9-5 M12 13v9 M7.5 5.5l9 5',
  news: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h3 M14 15h2 M8 18h8',
  documents: 'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
  media: 'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M15 7h.01',
  users: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M1 21v-2a7 7 0 0 1 14 0v2 M16 4a4 4 0 0 1 0 7 M18 14a6 6 0 0 1 5 5v2',
}

function CollectionIcon({ slug }: { slug?: string }) {
  return <span className="oj-nav__link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"><path d={ICON_PATHS[slug || ''] || ICON_PATHS.documents} /></svg></span>
}

type OJNavClientProps = {
  links: OJNavLink[]
  dashboardHref: string
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  const current = pathname.replace(/\/$/, '')
  const target = href.replace(/\/$/, '')
  if (exact) return current === target
  return current === target || current.startsWith(`${target}/`)
}

/**
 * Client nav links — active route + close mobile drawer via Payload useNav.
 */
export default function OJNavClient({ links, dashboardHref }: OJNavClientProps) {
  const pathname = usePathname()
  const { setNavOpen } = useNav()

  const closeMobile = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) setNavOpen(false)
  }

  return (
    <>
      <Link
        className={`oj-nav__link${isActive(pathname, dashboardHref, true) ? ' is-active' : ''}`}
        href={dashboardHref}
        id="nav-dashboard"
        prefetch={false}
        aria-current={isActive(pathname, dashboardHref, true) ? 'page' : undefined}
        onClick={closeMobile}
      >
        <span className="oj-nav__link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <rect x="14" y="3" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <rect x="3" y="14" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <rect x="14" y="14" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <span className="oj-nav__link-label">Обзор</span>
      </Link>

      {links.length > 0 ? (
        <>
          <ul className="oj-nav__list" aria-label="Разделы сайта">
            {links.map((link) => {
              const active = isActive(pathname, link.href, link.exact)
              return (
                <li key={link.id}>
                  {active && pathname.replace(/\/$/, '') === link.href.replace(/\/$/, '') ? (
                    <div className="oj-nav__link is-active" id={link.id} aria-current="page">
                      <CollectionIcon slug={link.slug} />
                      <span className="oj-nav__link-label">{link.label}</span>
                    </div>
                  ) : (
                    <Link
                      className={`oj-nav__link${active ? ' is-active' : ''}`}
                      href={link.href}
                      id={link.id}
                      prefetch={false}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMobile}
                    >
                      <CollectionIcon slug={link.slug} />
                      <span className="oj-nav__link-label">{link.label}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </>
  )
}
