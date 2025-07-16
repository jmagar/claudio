'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VariantProps } from 'class-variance-authority';

export type PromptSuggestionProps = {
  children: React.ReactNode
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  className?: string
  highlight?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Renders a button that optionally highlights a substring within its text content.
 *
 * If a `highlight` string is provided and the children are a string, the component visually emphasizes the first occurrence of the highlight substring within the button text. Otherwise, it renders a standard button with configurable styling.
 *
 * @param highlight - Optional substring to highlight within the button's text content. If not provided or empty, no highlighting occurs.
 */
function PromptSuggestion({
  children,
  variant,
  size,
  className,
  highlight,
  ...props
}: PromptSuggestionProps) {
  const isHighlightMode = highlight !== undefined && highlight.trim() !== '';
  const content = typeof children === 'string' ? children : '';

  if (!isHighlightMode) {
    return (
      <Button
        variant={variant || 'outline'}
        size={size || 'lg'}
        className={cn('rounded-full', className)}
        {...props}
      >
        {children}
      </Button>
    );
  }

  if (!content) {
    return (
      <Button
        variant={variant || 'ghost'}
        size={size || 'sm'}
        className={cn(
          'w-full cursor-pointer justify-start rounded-xl py-2',
          'hover:bg-accent',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }

  const trimmedHighlight = highlight.trim();
  const contentLower = content.toLowerCase();
  const highlightLower = trimmedHighlight.toLowerCase();
  const shouldHighlight = contentLower.includes(highlightLower);

  return (
    <Button
      variant={variant || 'ghost'}
      size={size || 'sm'}
      className={cn(
        'w-full cursor-pointer justify-start gap-0 rounded-xl py-2',
        'hover:bg-accent',
        className,
      )}
      {...props}
    >
      {shouldHighlight ? (
        (() => {
          const index = contentLower.indexOf(highlightLower);
          if (index === -1)
            {return (
              <span className="text-muted-foreground whitespace-pre-wrap">
                {content}
              </span>
            );}

          const actualHighlightedText = content.substring(
            index,
            index + highlightLower.length,
          );

          const before = content.substring(0, index);
          const after = content.substring(index + actualHighlightedText.length);

          return (
            <>
              {before && (
                <span className="text-muted-foreground whitespace-pre-wrap">
                  {before}
                </span>
              )}
              <span className="text-primary font-medium whitespace-pre-wrap">
                {actualHighlightedText}
              </span>
              {after && (
                <span className="text-muted-foreground whitespace-pre-wrap">
                  {after}
                </span>
              )}
            </>
          );
        })()
      ) : (
        <span className="text-muted-foreground whitespace-pre-wrap">
          {content}
        </span>
      )}
    </Button>
  );
}

export { PromptSuggestion };
