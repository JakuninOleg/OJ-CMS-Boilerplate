'use client';
import { useEffect, useRef, useState } from 'react';
import { NavToggler, useAuth, useNav } from '@payloadcms/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OJIcon from './OJIcon';
import { oj } from '../../oj.config';

type Result = { id: number; collection: string; title: string };
const labels: Record<string, string> = { pages: 'Страница', posts: 'Публикация' };
export default function OJHeader() {
  const { user } = useAuth();
  const { navOpen, setNavOpen } = useNav();
  const [query, setQuery] = useState(''), [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [expanded, setExpanded] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if (event.key === 'Escape') { setExpanded(false); setNavOpen(false); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); setExpanded(true); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [setNavOpen]);
  useEffect(() => { setExpanded(false); if (window.innerWidth <= 1024) setNavOpen(false); }, [pathname, setNavOpen]);
  useEffect(() => {
    if (query.trim().length < 2) { setStatus('idle'); setResults([]); return; }
    const controller = new AbortController();
    setStatus('loading');
    const timeout = setTimeout(() => {
      fetch(`/api/admin-search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal, cache: 'no-store' })
        .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
        .then(data => { if (!controller.signal.aborted) { setResults(data.results); setStatus('ready'); } })
        .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    }, 250);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query]);
  if (!user) return null;
  return <><header className={`oj-header${navOpen ? ' is-nav-open' : ''}`}>
    <NavToggler className="oj-header__menu"><OJIcon name="menu" /></NavToggler>
    <div className="oj-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}>
      <OJIcon name="search" size={18} /><input ref={input} aria-label="Поиск по содержимому сайта" placeholder="Поиск по страницам и публикациям…" value={query} maxLength={80} autoComplete="off" onFocus={() => setExpanded(true)} onChange={event => { setQuery(event.target.value); setExpanded(true); }} onKeyDown={event => { if (event.key === 'Escape') { setExpanded(false); input.current?.blur(); } }} /><kbd>Ctrl + K</kbd>
      {expanded && query.trim().length >= 2 && <div className="oj-search__results" aria-live="polite">
        {status === 'loading' ? <p>Ищем записи…</p> : status === 'error' ? <p>Поиск недоступен. Попробуйте ещё раз.</p> : results.length ? results.map(item => <Link href={`/admin/collections/${item.collection}/${item.id}`} key={`${item.collection}-${item.id}`} onClick={() => setExpanded(false)}><OJIcon name={item.collection} /><span>{item.title}<small>{labels[item.collection]}</small></span></Link>) : <p>Ничего не найдено.</p>}
      </div>}
    </div>
    <Link href={oj.publicSiteURL} target="_blank" rel="noopener noreferrer" className="oj-header__site"><OJIcon name="arrow" size={17} /><span>Открыть сайт</span></Link>
    <Link href="/admin/account" className="oj-header__user"><span className="oj-header__avatar"><OJIcon name="user" size={23} /></span><span>{user.name || user.email}<small>{user.role === 'administrator' ? 'Администратор' : 'Редактор'}</small></span><span aria-hidden="true">⌄</span></Link>
  </header>{navOpen && <button type="button" className="oj-nav-backdrop" aria-label="Закрыть боковое меню" onClick={() => setNavOpen(false)} />}</>;
}
