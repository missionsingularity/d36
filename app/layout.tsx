import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'BrahmaGPT — Government workspace', description: 'An illustrative government work demonstrator' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
