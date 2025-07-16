'use client';

import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Markdown } from './markdown';

type ReasoningContextType = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const ReasoningContext = createContext<ReasoningContextType | undefined>(
  undefined,
);

/**
 * Provides access to the current Reasoning context values.
 *
 * @returns The context object containing `isOpen` and `onOpenChange`.
 * @throws Error if called outside of a Reasoning provider.
 */
function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error(
      'useReasoningContext must be used within a Reasoning provider',
    );
  }
  return context;
}

export type ReasoningProps = {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isStreaming?: boolean
}
/**
 * Provides context and state management for a collapsible reasoning section, supporting both controlled and uncontrolled open state and automatic expansion when streaming.
 *
 * Wraps its children in a context provider, allowing descendant components to access and control the open state.
 *
 * @param open - If provided, controls whether the reasoning section is open.
 * @param onOpenChange - Callback invoked when the open state changes.
 * @param isStreaming - If true, automatically opens the section while streaming is active.
 */
function Reasoning({
  children,
  className,
  open,
  onOpenChange,
  isStreaming,
}: ReasoningProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [wasAutoOpened, setWasAutoOpened] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    if (isStreaming && !wasAutoOpened) {
      if (!isControlled) {setInternalOpen(true);}
      setWasAutoOpened(true);
    }

    if (!isStreaming && wasAutoOpened) {
      if (!isControlled) {setInternalOpen(false);}
      setWasAutoOpened(false);
    }
  }, [isStreaming, wasAutoOpened, isControlled]);

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <div className={className}>{children}</div>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLButtonElement>

/**
 * Renders a button that toggles the open state of the Reasoning section.
 *
 * Displays its children alongside a chevron icon that rotates to indicate expansion or collapse.
 */
function ReasoningTrigger({
  children,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, onOpenChange } = useReasoningContext();

  return (
    <button
      className={cn('flex cursor-pointer items-center gap-2', className)}
      onClick={() => onOpenChange(!isOpen)}
      {...props}
    >
      <span className="text-primary">{children}</span>
      <div
        className={cn(
          'transform transition-transform',
          isOpen ? 'rotate-180' : '',
        )}
      >
        <ChevronDownIcon className="size-4" />
      </div>
    </button>
  );
}

export type ReasoningContentProps = {
  children: React.ReactNode
  className?: string
  markdown?: boolean
  contentClassName?: string
} & React.HTMLAttributes<HTMLDivElement>

/**
 * Displays collapsible content for the reasoning section, with optional Markdown rendering and animated height transitions.
 *
 * When open, the content smoothly expands to fit its inner content; when closed, it collapses with a transition. If `markdown` is true, the children are rendered as Markdown.
 *
 * @param markdown - If true, renders the children as Markdown instead of raw React nodes.
 * @param contentClassName - Additional class name for the inner content container.
 */
function ReasoningContent({
  children,
  className,
  contentClassName,
  markdown = false,
  ...props
}: ReasoningContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { isOpen } = useReasoningContext();

  useEffect(() => {
    if (!contentRef.current || !innerRef.current) {return;}

    const observer = new ResizeObserver(() => {
      if (contentRef.current && innerRef.current && isOpen) {
        contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
      }
    });

    observer.observe(innerRef.current);

    if (isOpen) {
      contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
    }

    return () => observer.disconnect();
  }, [isOpen]);

  const content = markdown ? (
    <Markdown>{children as string}</Markdown>
  ) : (
    children
  );

  return (
    <div
      ref={contentRef}
      className={cn(
        'overflow-hidden transition-[max-height] duration-150 ease-out',
        className,
      )}
      style={{
        maxHeight: isOpen ? contentRef.current?.scrollHeight : '0px',
      }}
      {...props}
    >
      <div
        ref={innerRef}
        className={cn(
          'text-muted-foreground prose prose-sm dark:prose-invert',
          contentClassName,
        )}
      >
        {content}
      </div>
    </div>
  );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
