import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';

export const viewport: Viewport = {
  themeColor: '#1a8cd8',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: { default: 'Omnia — One AI subscription that replaces them all', template: '%s | Omnia' },
  description: 'AI Assistant, Planner, Notes, Content Studio, Document Builder — all in one beautiful app.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Omnia',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(240 8% 9%)',
              color: 'hsl(0 0% 90%)',
              border: '1px solid hsl(240 6% 16%)',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}` }} />
      </body>
    </html>
  );
}
