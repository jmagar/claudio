import {
  Sparkles,
  Terminal,
  Search,
  FolderOpen,
  FileText,
  Edit,
  Code,
  Database,
  Wrench,
  Globe,
  Play,
  CheckCircle
} from 'lucide-react';

export interface ToolConfig {
  icon: typeof Sparkles;
  color: string;
  getDescription: (input: Record<string, unknown>) => string;
}

// Icon mapping for different tools
export const TOOL_ICONS = {
  Task: Sparkles,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
  LS: FolderOpen,
  Read: FileText,
  Edit: Edit,
  MultiEdit: Edit,
  Write: Code,
  NotebookRead: Database,
  NotebookEdit: Database,
  WebFetch: Globe,
  TodoWrite: CheckCircle,
  WebSearch: Globe,
  exit_plan_mode: Play
} as const;

// Color schemes for different tool types
export const TOOL_COLORS = {
  Task: 'from-purple-500 to-pink-500',
  Bash: 'from-green-500 to-teal-500', 
  Glob: 'from-blue-500 to-indigo-500',
  Grep: 'from-blue-500 to-indigo-500',
  LS: 'from-orange-500 to-amber-500',
  Read: 'from-cyan-500 to-blue-500',
  Edit: 'from-yellow-500 to-orange-500',
  MultiEdit: 'from-yellow-500 to-orange-500',
  Write: 'from-emerald-500 to-green-500',
  NotebookRead: 'from-violet-500 to-purple-500',
  NotebookEdit: 'from-violet-500 to-purple-500',
  WebFetch: 'from-indigo-500 to-blue-500',
  TodoWrite: 'from-green-500 to-emerald-500',
  WebSearch: 'from-blue-500 to-purple-500',
  exit_plan_mode: 'from-pink-500 to-rose-500'
} as const;

// Tool description functions
export const TOOL_DESCRIPTIONS = {
  Task: (input: Record<string, unknown>) => 
    (input.description as string) || 'Execute task',
  
  Bash: (input: Record<string, unknown>) => 
    (input.description as string) || `Run: ${(input.command as string)?.substring(0, 30) || 'command'}...`,
  
  Glob: (input: Record<string, unknown>) => 
    `Find files: ${input.pattern as string}`,
  
  Grep: (input: Record<string, unknown>) => 
    `Search: "${input.pattern as string}"`,
  
  LS: (input: Record<string, unknown>) => 
    `List: ${(input.path as string) || 'current directory'}`,
  
  Read: (input: Record<string, unknown>) => 
    `Read: ${(input.file_path as string)?.split('/').pop() || 'file'}`,
  
  Edit: (input: Record<string, unknown>) => 
    `Edit: ${(input.file_path as string)?.split('/').pop() || 'file'}`,
  
  MultiEdit: (input: Record<string, unknown>) => 
    `Edit: ${(input.file_path as string)?.split('/').pop() || 'file'}`,
  
  Write: (input: Record<string, unknown>) => 
    `Write: ${(input.file_path as string)?.split('/').pop() || 'file'}`,
  
  NotebookRead: (input: Record<string, unknown>) => 
    `Read: ${(input.notebook_path as string)?.split('/').pop() || 'notebook'}`,
  
  NotebookEdit: (input: Record<string, unknown>) => 
    `Edit: ${(input.notebook_path as string)?.split('/').pop() || 'notebook'}`,
  
  WebFetch: (input: Record<string, unknown>) => 
    `Fetch: ${new URL(input.url as string).hostname}`,
  
  WebSearch: (input: Record<string, unknown>) => 
    `Search: "${input.query as string}"`,
  
  TodoWrite: (input: Record<string, unknown>) => 
    `Update todos (${(input.todos as unknown[])?.length || 0} items)`,
  
  exit_plan_mode: (input: Record<string, unknown>) => 
    (input.plan as string)?.substring(0, 50) || 'Exit plan mode'
} as const;

// Default fallbacks
export const DEFAULT_TOOL_ICON = Wrench;
export const DEFAULT_TOOL_COLOR = 'from-gray-500 to-gray-600';

// Helper function to get tool description
export function getToolDescription(toolName: string, input: Record<string, unknown>): string {
  const descriptionFn = TOOL_DESCRIPTIONS[toolName as keyof typeof TOOL_DESCRIPTIONS];
  return descriptionFn ? descriptionFn(input) : toolName;
}