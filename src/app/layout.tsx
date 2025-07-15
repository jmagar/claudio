import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claude Code Frontend',
  description: 'A Next.js frontend for Claude Code SDK',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}