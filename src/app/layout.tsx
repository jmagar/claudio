import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claude Code Frontend',
  description: 'A Next.js frontend for Claude Code SDK',
};

/**
 * Defines the root layout for the application, setting the HTML language to English and applying global body styles.
 *
 * Renders the provided child components within the main HTML structure.
 *
 * @param children - The content to be rendered inside the layout
 */
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