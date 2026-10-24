import type { Metadata } from 'next';
import './globals.css';
import './design.css';
export const metadata: Metadata = { title: 'Кудайберген & Назик — 29.11.2026', description: 'Свадебное приглашение • Үйлөнүү тойго чакыруу', openGraph: { title: 'Кудайберген & Назик', description: '29 ноября 2026 • Улуу Тоо', type: 'website' } };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ky"><body>{children}</body></html>}
