'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

export type CodeBlockProps = {
  children?: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

/**
 * Renders a styled container for displaying code or related content.
 *
 * Applies consistent layout, border, background, and text styling, and merges any additional class names or div props.
 */
function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'not-prose flex w-full flex-col overflow-clip border',
        'border-border bg-card text-card-foreground rounded-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type CodeBlockCodeProps = {
  code: string
  language?: string
  theme?: string
  className?: string
} & React.HTMLProps<HTMLDivElement>

/**
 * Renders a syntax-highlighted code block using the specified language and theme.
 *
 * If the highlighted HTML is not yet available (such as during server-side rendering), falls back to displaying the raw code in a plain code block.
 *
 * @param code - The source code to display and highlight
 * @param language - The programming language for syntax highlighting (defaults to 'tsx')
 * @param theme - The color theme for syntax highlighting (defaults to 'github-light')
 * @returns A styled div containing the highlighted or plain code block
 */
function CodeBlockCode({
  code,
  language = 'tsx',
  theme = 'github-light',
  className,
  ...props
}: CodeBlockCodeProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    async function highlight() {
      if (!code) {
        setHighlightedHtml('<pre><code></code></pre>');
        return;
      }

      const html = await codeToHtml(code, { lang: language, theme });
      setHighlightedHtml(html);
    }
    highlight();
  }, [code, language, theme]);

  const classNames = cn(
    'w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4',
    className,
  );

  // SSR fallback: render plain code if not hydrated yet
  return highlightedHtml ? (
    <div
      className={classNames}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  ) : (
    <div className={classNames} {...props}>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Renders a flex container for grouping related code blocks or elements with customizable styling.
 *
 * Children are displayed in a horizontal row, centered and spaced between.
 */
function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock };
