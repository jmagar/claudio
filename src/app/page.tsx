import { ThemeProvider } from '@/context/theme';
import { ClaudeMaxInterface } from '@/components/claude-max-interface';

export default function Home() {
  return (
    <ThemeProvider>
      <ClaudeMaxInterface />
    </ThemeProvider>
  );
}