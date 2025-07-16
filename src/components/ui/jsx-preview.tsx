import * as React from 'react';
import JsxParser from 'react-jsx-parser';
import type { TProps as JsxParserProps } from 'react-jsx-parser';

/**
 * Finds and parses the first JSX tag in a string.
 *
 * Returns an object containing the matched tag, its name, type (`'opening'`, `'closing'`, or `'self-closing'`), attributes, and its position in the input string, or `null` if no tag is found.
 */
function matchJsxTag(code: string) {
  if (code.trim() === '') {
    return null;
  }

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\s*([^>]*?)(\/)?>/;
  const match = code.match(tagRegex);

  if (!match || typeof match.index === 'undefined') {
    return null;
  }

  const [fullMatch, tagName, attributes, selfClosing] = match;

  const type = selfClosing
    ? 'self-closing'
    : fullMatch.startsWith('</')
      ? 'closing'
      : 'opening';

  return {
    tag: fullMatch,
    tagName,
    type,
    attributes: attributes.trim(),
    startIndex: match.index,
    endIndex: match.index + fullMatch.length,
  };
}

/**
 * Completes any unclosed JSX tags in the input string by appending the necessary closing tags.
 *
 * Iteratively parses the input JSX string, tracks opened and closed tags, and ensures that all opened tags are properly closed at the end of the string.
 *
 * @param code - The JSX string to process
 * @returns The input string with any missing closing tags appended to form valid JSX
 */
function completeJsxTag(code: string) {
  const stack: string[] = [];
  let result = '';
  let currentPosition = 0;

  while (currentPosition < code.length) {
    const match = matchJsxTag(code.slice(currentPosition));
    if (!match) {break;}
    const { tagName, type, endIndex } = match;

    if (type === 'opening') {
      stack.push(tagName);
    } else if (type === 'closing') {
      stack.pop();
    }

    result += code.slice(currentPosition, currentPosition + endIndex);
    currentPosition += endIndex;
  }

  return (
    result +
    stack
      .reverse()
      .map((tag) => `</${tag}>`)
      .join('')
  );
}

export type JSXPreviewProps = {
  jsx: string
  isStreaming?: boolean
} & JsxParserProps

/**
 * Renders a JSX string using a parser component, optionally completing unclosed tags for streaming input.
 *
 * If `isStreaming` is true, the input JSX string is processed to ensure all opened tags are properly closed before rendering.
 *
 * @param jsx - The JSX string to render
 * @param isStreaming - If true, completes unclosed tags in the JSX string before rendering
 * @returns The rendered JSX content as a React element
 */
function JSXPreview({ jsx, isStreaming = false, ...props }: JSXPreviewProps) {
  const processedJsx = React.useMemo(
    () => (isStreaming ? completeJsxTag(jsx) : jsx),
    [jsx, isStreaming],
  );

  // Cast JsxParser to any to work around the type incompatibility
  const Parser = JsxParser as unknown as React.ComponentType<JsxParserProps>;

  return <Parser jsx={processedJsx} {...props} />;
}

export { JSXPreview };
