import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DataScope – Enterprise Data Discovery & Intelligence Platform',
  description:
    'Modern Enterprise Data Discovery & Intelligence Platform designed to explore, search, filter, analyze, and manage millions of structured business records.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-clip">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-clip">
        {children}
      </body>
    </html>
  );
}
