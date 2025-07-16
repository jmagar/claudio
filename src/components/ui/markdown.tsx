import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { memo, useId, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock, CodeBlockCode } from './code-block';

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

/**
 * Splits a Markdown string into an array of raw Markdown block strings.
 *
 * Each block corresponds to the raw source of a top-level Markdown token as parsed by the lexer.
 *
 * @param markdown - The Markdown text to parse into blocks
 * @returns An array of raw Markdown block strings
 */
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

/**
 * Extracts the programming language identifier from a CSS class string formatted as `language-<lang>`.
 *
 * @param className - The CSS class string to extract the language from
 * @returns The extracted language identifier, or `'plaintext'` if not found or if `className` is undefined
 */
function extractLanguage(className?: string): string {
  if (!className) {return 'plaintext';}
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : 'plaintext';
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    if (isInline) {
      return (
        <span
          className={cn(
            'bg-primary-foreground rounded-sm px-1 font-mono text-sm',
            className,
          )}
          {...props}
        >
          {children}
        </span>
      );
    }

    const language = extractLanguage(className);

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    );
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>;
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

/**
 * Renders Markdown content by splitting it into blocks and rendering each block individually with optional component overrides.
 *
 * Each Markdown block is rendered using a memoized component for performance, and a unique key is assigned to each block. Supports custom component overrides for Markdown elements.
 *
 * @param children - The Markdown text to render
 * @param id - Optional unique identifier for the rendered blocks
 * @param className - Optional CSS class for the container
 * @param components - Optional ReactMarkdown component overrides
 */
function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';

export { Markdown };
