const paths: Record<string, string> = {
  pages: 'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
  posts: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h8 M8 18h5',
  products: 'M12 3 3 8v9l9 5 9-5V8z M3 8l9 5 9-5 M12 13v9',
  categories: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  documents: 'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
  news: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h8 M8 18h5',
  media: 'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M15 7h.01',
  leads: 'M3 5h18v14H3z M3 6l9 7 9-7',
  search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14 M15 15l6 6',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4',
  chart: 'M4 20V10 M10 20V4 M16 20V8 M22 20V2',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  plus: 'M12 5v14 M5 12h14',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 22v-2a8 8 0 0 1 16 0v2',
  warning: 'M12 3 2 21h20z M12 9v5 M12 17v.1',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 17v.1',
};
export default function OJIcon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.documents} /></svg>;
}
