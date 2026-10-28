import type { Metadata } from 'next';
import './globals.css';
import './design.css';
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'http://localhost:3000');
export const metadata: Metadata = { metadataBase:new URL(siteUrl), title: 'Кудайберген & Назик — 29.11.2026', description: 'Свадебное приглашение • Үйлөнүү тойго чакыруу', openGraph: { title: 'Кудайберген & Назик', description: '29 ноября 2026 • Улуу Тоо', type: 'website' }, twitter:{card:'summary_large_image',title:'Кудайберген & Назик',description:'29 ноября 2026 • Улуу Тоо'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ky"><body>{children}</body></html>}
