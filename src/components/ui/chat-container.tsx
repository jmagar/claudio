'use client';

import { cn } from '@/lib/utils';
import { StickToBottom } from 'use-stick-to-bottom';

export type ChatContainerRootProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export type ChatContainerContentProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export type ChatContainerScrollAnchorProps = {
  className?: string
  ref?: React.RefObject<HTMLDivElement>
} & React.HTMLAttributes<HTMLDivElement>

/**
 * Provides a scrollable container for chat content that automatically sticks to the bottom, ensuring new messages are visible.
 *
 * Wraps children in a flexbox layout with vertical overflow scrolling and configures stick-to-bottom behavior for chat logs. Supports additional HTML div attributes.
 */
function ChatContainerRoot({
  children,
  className,
  ...props
}: ChatContainerRootProps) {
  return (
    <StickToBottom
      className={cn('flex overflow-y-auto', className)}
      resize="smooth"
      initial="instant"
      role="log"
      {...props}
    >
      {children}
    </StickToBottom>
  );
}

/**
 * Provides a scrollable content area for chat messages within a chat container.
 *
 * Wraps its children in a flex column layout using `StickToBottom.Content`, allowing for automatic scroll management and additional HTML div attributes.
 */
function ChatContainerContent({
  children,
  className,
  ...props
}: ChatContainerContentProps) {
  return (
    <StickToBottom.Content
      className={cn('flex w-full flex-col', className)}
      {...props}
    >
      {children}
    </StickToBottom.Content>
  );
}

/**
 * Renders an invisible scroll anchor element for chat containers.
 *
 * This anchor helps maintain scroll position at the bottom of the chat when new messages are added. It is visually minimal, does not shrink, and is hidden from assistive technologies.
 */
function ChatContainerScrollAnchor({
  className,
  ...props
}: ChatContainerScrollAnchorProps) {
  return (
    <div
      className={cn('h-px w-full shrink-0 scroll-mt-4', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor };
