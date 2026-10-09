'use client';

import { useEffect, useRef, useState } from 'react';
import OJIcon from './OJIcon';
import { oj } from '../../oj.config';

const ZONE = oj.timeZone;
const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const localDay = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = (name: string) => Number(parts.find(item => item.type === name)?.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day'), 12));
};
const label = (day: Date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(day);
const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();

/** A local calendar, not a task scheduler. Time zone is configured per project. */
export default function OJCalendar({ initialNow }: { initialNow: string }) {
  const [now, setNow] = useState(initialNow);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => localDay(initialNow));
  const [view, setView] = useState(() => localDay(initialNow));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const monthSelect = useRef<HTMLSelectElement>(null);
  const today = localDay(now);
  const year = view.getUTCFullYear();
  const month = view.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1, 12));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(Date.UTC(year, month, index - offset + 1, 12)));
  const years = Array.from(new Set([...Array.from({ length: 21 }, (_, i) => today.getUTCFullYear() - 10 + i), year])).sort((a, b) => a - b);
  const shift = (amount: number) => setView(new Date(Date.UTC(year, month + amount, 1, 12)));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().toISOString()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!open) return;
    monthSelect.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  return <div className="oj-calendar" ref={root} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" className="oj-calendar__trigger" aria-label="Открыть календарь" aria-expanded={open} aria-controls="oj-calendar-panel" aria-haspopup="dialog" onClick={() => setOpen(!open)}>
      <OJIcon name="calendar" /><span>{label(today)}<small>{new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: ZONE }).format(new Date(now))} · {oj.timeZoneLabel}</small></span>
    </button>
    {open && <div id="oj-calendar-panel" className="oj-calendar__panel" role="dialog" aria-label="Календарь">
      <header><button type="button" aria-label="Предыдущий месяц" onClick={() => shift(-1)}>‹</button>
        <select ref={monthSelect} aria-label="Месяц" value={month} onChange={event => setView(new Date(Date.UTC(year, Number(event.target.value), 1, 12)))}>{months.map((name, i) => <option key={name} value={i}>{name}</option>)}</select>
        <select aria-label="Год" value={year} onChange={event => setView(new Date(Date.UTC(Number(event.target.value), month, 1, 12)))}>{years.map(item => <option key={item}>{item}</option>)}</select>
        <button type="button" aria-label="Следующий месяц" onClick={() => shift(1)}>›</button>
      </header>
      <table aria-label={`${months[month]} ${year}`}><thead><tr>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <th key={day} scope="col">{day}</th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map(day => <td key={day.toISOString()}><button type="button" aria-label={label(day)} aria-pressed={sameDay(day, selected)} aria-current={sameDay(day, today) ? 'date' : undefined} className={day.getUTCMonth() !== month ? 'is-adjacent' : undefined} onClick={() => { setSelected(day); setView(day); }}>{day.getUTCDate()}</button></td>)}</tr>)}</tbody>
      </table>
      <footer><span aria-live="polite">{label(selected)}</span><button type="button" onClick={() => { setSelected(today); setView(today); }}>Сегодня</button></footer>
    </div>}
  </div>;
}
