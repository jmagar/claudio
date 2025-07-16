import { ThemeProvider } from '@/context/theme';
import { ClaudeMaxInterface } from '@/components/claude-max-interface';

/**
 * Renders the ClaudeMaxInterface component within a theme context provider.
 *
 * This component serves as the main entry point, ensuring that the interface receives theme context from ThemeProvider.
 *
 * @returns The JSX element tree for the home page.
 */
export default function Home() {
  return (
    <ThemeProvider>
      <ClaudeMaxInterface />
    </ThemeProvider>
  );
}