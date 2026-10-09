import type { ReactNode } from 'react';
import { oj } from '../../oj.config';
export const metadata = { title: oj.name, robots: { index: false, follow: false }, icons: { icon: oj.logo } };
export default function Layout({ children }: { children: ReactNode }) { return <html lang="ru"><body>{children}</body></html>; }
