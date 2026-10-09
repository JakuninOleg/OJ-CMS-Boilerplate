import type { AdminViewServerProps } from 'payload';
import Link from 'next/link';
import OJIcon from './OJIcon';
import OJCalendar from './OJCalendar';
import { contentCollections, oj } from '../../oj.config';
import { readableDashboardCollections } from '../../lib/dashboard-access';
export default async function OJDashboard({ initPageResult }: AdminViewServerProps) {
  const { req, permissions, visibleEntities } = initPageResult;
  if (!req.user) return null;
  const visible = readableDashboardCollections(visibleEntities?.collections ?? [], permissions);
  const cards = await Promise.all(contentCollections.filter(card => visible.has(card.slug)).map(async card => {
    const [total, published, recent] = await Promise.all([
      req.payload.count({ collection: card.slug, req, overrideAccess: false }),
      req.payload.count({ collection: card.slug, req, overrideAccess: false, where: { _status: { equals: 'published' } } }),
      req.payload.find({ collection: card.slug, req, overrideAccess: false, draft: true, depth: 0, limit: 5, sort: '-updatedAt' }),
    ]);
    return { ...card, total: total.totalDocs, published: published.totalDocs, recent: recent.docs };
  }));
  const media = visible.has('media') ? await req.payload.count({ collection: 'media', req, overrideAccess: false }) : null;
  const recent = cards.flatMap(card => card.recent.map(doc => ({ ...doc, slugCollection: card.slug, label: card.label }))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const drafts = cards.reduce((sum, card) => sum + card.total - card.published, 0);
  const date = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: oj.timeZone }).format(new Date(value));
  const name = req.user.name?.trim().split(' ')[0];
  return <div className="oj-dashboard oj-overview oj-overview--starter">
    <header className="oj-overview__intro"><div><h1>{name ? `Добрый день, ${name}!` : 'Добрый день!'}</h1><p>Контент, последние изменения и быстрый доступ к работе</p></div><OJCalendar initialNow={new Date().toISOString()} /></header>
    <section className="oj-overview__stats oj-overview__stats--editor" aria-label="Контент">
      {cards.map(card => <article className="oj-overview__stat" key={card.slug}><Link href={`/admin/collections/${card.slug}`}><span className="oj-icon-tile"><OJIcon name={card.slug} /></span>{card.label}<span className="oj-overview__chevron">›</span></Link><strong>{card.total}</strong><p>{card.published} опубликовано<br /><span className="oj-overview__drafts">{card.total - card.published} в черновиках</span></p></article>)}
      {media && <article className="oj-overview__stat"><Link href="/admin/collections/media"><span className="oj-icon-tile"><OJIcon name="media" /></span>Медиа</Link><strong>{media.totalDocs}</strong><p>Загруженных файлов</p></article>}
    </section>
    <div className="oj-overview__columns"><div className="oj-overview__main"><section className="oj-panel oj-overview__changes"><header><h2>Последние изменения</h2><span>Контент сайта</span></header>
      {recent.length ? <div className="oj-overview__table-wrap"><table><thead><tr><th>Название</th><th>Тип</th><th>Статус</th><th>Дата</th></tr></thead><tbody>{recent.map(doc => <tr key={`${doc.slugCollection}-${doc.id}`}><td><Link href={`/admin/collections/${doc.slugCollection}/${doc.id}`}><span className="oj-icon-tile"><OJIcon name={doc.slugCollection} /></span><strong>{doc.title}</strong></Link></td><td>{doc.label}</td><td><span className={`oj-status oj-status--${doc._status === 'draft' ? 'draft' : 'published'}`}>{doc._status === 'draft' ? 'Черновик' : 'Опубликовано'}</span></td><td><time dateTime={doc.updatedAt}>{date(doc.updatedAt)}</time></td></tr>)}</tbody></table></div> : <p className="oj-overview__empty">Пока нет записей. Создайте первую страницу или публикацию</p>}
    </section></div><aside className="oj-overview__aside"><section className="oj-panel oj-overview__attention"><header><h2>Требует внимания {drafts > 0 && <span className="oj-attention-count">{drafts}</span>}</h2></header><p className="oj-overview__empty">{drafts ? `Неопубликованных записей: ${drafts}` : 'Неопубликованных записей нет'}</p></section>
      <section className="oj-panel oj-overview__quick"><header><h2>Быстрые действия</h2></header><div>{cards.filter(card => permissions?.collections?.[card.slug]?.create).map(card => <Link key={card.slug} href={`/admin/collections/${card.slug}/create`}><span className="oj-icon-tile"><OJIcon name={card.slug} /></span>{card.create}</Link>)}{permissions?.collections?.media?.create && <Link href="/admin/collections/media/create"><span className="oj-icon-tile"><OJIcon name="media" /></span>Загрузить медиа</Link>}<Link href="/admin/account"><span className="oj-icon-tile"><OJIcon name="user" /></span>Мой аккаунт</Link></div></section>
    </aside></div>
  </div>;
}
