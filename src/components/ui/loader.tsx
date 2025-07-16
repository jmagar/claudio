'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export interface LoaderProps {
  variant?:
    | 'circular'
    | 'classic'
    | 'pulse'
    | 'pulse-dot'
    | 'dots'
    | 'typing'
    | 'wave'
    | 'bars'
    | 'terminal'
    | 'text-blink'
    | 'text-shimmer'
    | 'loading-dots'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

/**
 * Displays a spinning circular loader with customizable size.
 *
 * Renders an animated circular indicator for loading states, supporting small, medium, and large sizes.
 */
export function CircularLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  return (
    <div
      className={cn(
        'border-primary animate-spin rounded-full border-2 border-t-transparent',
        sizeClasses[size],
        className,
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a classic spinner animation with 12 fading bars arranged in a circle.
 *
 * The size prop controls the overall dimensions and bar thickness. Includes a visually hidden "Loading" label for accessibility.
 */
export function ClassicLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  const barSizes = {
    sm: { height: '6px', width: '1.5px' },
    md: { height: '8px', width: '2px' },
    lg: { height: '10px', width: '2.5px' },
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div className="absolute h-full w-full">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-primary absolute animate-[spinner-fade_1.2s_linear_infinite] rounded-full"
            style={{
              top: '0',
              left: '50%',
              marginLeft:
                size === 'sm' ? '-0.75px' : size === 'lg' ? '-1.25px' : '-1px',
              transformOrigin: `${size === 'sm' ? '0.75px' : size === 'lg' ? '1.25px' : '1px'} ${size === 'sm' ? '10px' : size === 'lg' ? '14px' : '12px'}`,
              transform: `rotate(${i * 30}deg)`,
              opacity: 0,
              animationDelay: `${i * 0.1}s`,
              height: barSizes[size].height,
              width: barSizes[size].width,
            }}
          />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a pulsing circular loader animation.
 *
 * Renders a single circle with a pulsing border, sized according to the `size` prop.
 */
export function PulseLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div className="border-primary absolute inset-0 animate-[thin-pulse_1.5s_ease-in-out_infinite] rounded-full border-2" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Renders a single pulsing dot loader animation with customizable size.
 *
 * The loader displays as a circular dot that pulses continuously, suitable for indicating loading states in compact UI areas.
 */
export function PulseDotLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'size-1',
    md: 'size-2',
    lg: 'size-3',
  };

  return (
    <div
      className={cn(
        'bg-primary animate-[pulse-dot_1.2s_ease-in-out_infinite] rounded-full',
        sizeClasses[size],
        className,
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays three animated bouncing dots as a loading indicator.
 *
 * The size of the dots and container is determined by the `size` prop. Each dot animates with a staggered delay to create a sequential bounce effect. Includes a visually hidden "Loading" label for accessibility.
 */
export function DotsLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const containerSizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-1',
        containerSizes[size],
        className,
      )}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-primary animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full',
            dotSizes[size],
          )}
          style={{
            animationDelay: `${i * 160}ms`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a typing indicator with three animated dots, each appearing in sequence.
 *
 * The size of the dots and container adjusts based on the `size` prop.
 */
export function TypingLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dotSizes = {
    sm: 'h-1 w-1',
    md: 'h-1.5 w-1.5',
    lg: 'h-2 w-2',
  };

  const containerSizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-1',
        containerSizes[size],
        className,
      )}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-primary animate-[typing_1s_infinite] rounded-full',
            dotSizes[size],
          )}
          style={{
            animationDelay: `${i * 250}ms`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a wave-style loading animation with five animated vertical bars.
 *
 * The height and width of each bar are determined by the `size` prop. Each bar animates with a staggered delay to create a wave effect. Includes a visually hidden "Loading" label for accessibility.
 */
export function WaveLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const barWidths = {
    sm: 'w-0.5',
    md: 'w-0.5',
    lg: 'w-1',
  };

  const containerSizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  const heights = {
    sm: ['6px', '9px', '12px', '9px', '6px'],
    md: ['8px', '12px', '16px', '12px', '8px'],
    lg: ['10px', '15px', '20px', '15px', '10px'],
  };

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        containerSizes[size],
        className,
      )}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-primary animate-[wave_1s_ease-in-out_infinite] rounded-full',
            barWidths[size],
          )}
          style={{
            animationDelay: `${i * 100}ms`,
            height: heights[size][i],
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a loading indicator with three animated vertical bars that wave up and down.
 *
 * The size prop controls the height, width, and spacing of the bars.
 */
export function BarsLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const barWidths = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
  };

  const containerSizes = {
    sm: 'h-4 gap-1',
    md: 'h-5 gap-1.5',
    lg: 'h-6 gap-2',
  };

  return (
    <div className={cn('flex', containerSizes[size], className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-primary h-full animate-[wave-bars_1.2s_ease-in-out_infinite]',
            barWidths[size],
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a terminal-style loading indicator with a prompt and blinking cursor.
 *
 * The size prop adjusts the dimensions of the prompt and cursor.
 */
export function TerminalLoader({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const cursorSizes = {
    sm: 'h-3 w-1.5',
    md: 'h-4 w-2',
    lg: 'h-5 w-2.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const containerSizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-1',
        containerSizes[size],
        className,
      )}
    >
      <span className={cn('text-primary font-mono', textSizes[size])}>
        {'>'}
      </span>
      <div
        className={cn(
          'bg-primary animate-[blink_1s_step-end_infinite]',
          cursorSizes[size],
        )}
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Displays a text string with a blinking animation to indicate loading.
 *
 * @param text - The text to display; defaults to "Thinking"
 * @param size - The size of the text ('sm', 'md', or 'lg'); defaults to 'md'
 * @param className - Additional CSS classes to apply
 */
export function TextBlinkLoader({
  text = 'Thinking',
  className,
  size = 'md',
}: {
  text?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'animate-[text-blink_2s_ease-in-out_infinite] font-medium',
        textSizes[size],
        className,
      )}
    >
      {text}
    </div>
  );
}

/**
 * Displays a text string with a shimmering gradient animation to indicate loading.
 *
 * @param text - The text to display with the shimmer effect
 * @param size - The size of the text ('sm', 'md', or 'lg')
 * @param className - Additional CSS classes to apply
 */
export function TextShimmerLoader({
  text = 'Thinking',
  className,
  size = 'md',
}: {
  text?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'bg-[linear-gradient(to_right,var(--muted-foreground)_40%,var(--foreground)_60%,var(--muted-foreground)_80%)]',
        'bg-size-[200%_auto] bg-clip-text font-medium text-transparent',
        'animate-[shimmer_4s_infinite_linear]',
        textSizes[size],
        className,
      )}
    >
      {text}
    </div>
  );
}

/**
 * Displays a text string followed by three animated dots to indicate loading.
 *
 * The text and dot sizes are determined by the `size` prop. The dots animate in sequence to create a loading effect.
 */
export function TextDotsLoader({
  className,
  text = 'Thinking',
  size = 'md',
}: {
  className?: string
  text?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn('inline-flex items-center', className)}
    >
      <span className={cn('text-primary font-medium', textSizes[size])}>
        {text}
      </span>
      <span className="inline-flex">
        <span className="text-primary animate-[loading-dots_1.4s_infinite_0.2s]">
          .
        </span>
        <span className="text-primary animate-[loading-dots_1.4s_infinite_0.4s]">
          .
        </span>
        <span className="text-primary animate-[loading-dots_1.4s_infinite_0.6s]">
          .
        </span>
      </span>
    </div>
  );
}

/**
 * Renders a loading animation based on the specified variant and size.
 *
 * Selects and displays one of several animated loader components, such as spinners, dots, bars, or text-based effects. The loader can be customized by variant, size, optional text (for text-based loaders), and additional CSS classes.
 *
 * @param variant - The style of loader animation to display (e.g., 'circular', 'classic', 'pulse', etc.).
 * @param size - The size of the loader ('sm', 'md', or 'lg').
 * @param text - Optional text to display for text-based loaders.
 * @param className - Additional CSS classes to apply to the loader.
 * @returns The corresponding loader component for the chosen variant.
 */
function Loader({
  variant = 'circular',
  size = 'md',
  text,
  className,
}: LoaderProps) {
  switch (variant) {
    case 'circular':
      return <CircularLoader size={size} className={className} />;
    case 'classic':
      return <ClassicLoader size={size} className={className} />;
    case 'pulse':
      return <PulseLoader size={size} className={className} />;
    case 'pulse-dot':
      return <PulseDotLoader size={size} className={className} />;
    case 'dots':
      return <DotsLoader size={size} className={className} />;
    case 'typing':
      return <TypingLoader size={size} className={className} />;
    case 'wave':
      return <WaveLoader size={size} className={className} />;
    case 'bars':
      return <BarsLoader size={size} className={className} />;
    case 'terminal':
      return <TerminalLoader size={size} className={className} />;
    case 'text-blink':
      return <TextBlinkLoader text={text} size={size} className={className} />;
    case 'text-shimmer':
      return <TextShimmerLoader text={text} size={size} className={className} />;
    case 'loading-dots':
      return <TextDotsLoader text={text} size={size} className={className} />;
    default:
      return <CircularLoader size={size} className={className} />;
  }
}

export { Loader };
