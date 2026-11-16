import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ReduxProvider } from '@/store/provider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#020617',
};

export const metadata: Metadata = {
  title: 'DataScope Enterprise Data Discovery & Intelligence Platform',
  description:
    'Modern Enterprise Data Discovery & Intelligence Platform designed to explore, search, filter, analyze, and manage structured business records.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-clip" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('datascope_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased overflow-x-clip">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
