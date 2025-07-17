/**
 * Visual Message Parser for Claude Code Tool Usage
 * Converts raw JSON tool data into beautiful visual components
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Wrench, 
  Search, 
  FileText, 
  FolderOpen, 
  Terminal, 
  Code, 
  Edit,
  Globe,
  CheckCircle,
  AlertCircle,
  Play,
  Database,
  Sparkles
} from 'lucide-react';

export interface ToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content?: string;
  is_error?: boolean;
}

export interface ParsedMessage {
  text?: string;
  toolUses: ToolUse[];
  toolResults: ToolResult[];
}

// Icon mapping for different tools
const TOOL_ICONS = {
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
const TOOL_COLORS = {
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

// Memoized parsing cache for performance optimization
const parseCache = new Map<string, ParsedMessage>();
const MAX_CACHE_SIZE = 100;

/**
 * Clear old cache entries when size limit is reached
 */
function cleanupCache() {
  if (parseCache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(parseCache.keys());
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE + 20); // Keep some buffer
    keysToDelete.forEach(key => parseCache.delete(key));
  }
}

/**
 * Parse raw message content to extract tool usage and text (memoized)
 */
export function parseMessage(content: string): ParsedMessage {
  // Check cache first
  const cacheKey = content.length < 10000 ? content : content.substring(0, 5000) + content.slice(-1000);
  const cached = parseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const toolUses: ToolUse[] = [];
  const toolResults: ToolResult[] = [];
  let text = content;

  try {
    // More comprehensive JSON pattern to match the actual format from Claude Code
    const jsonPattern = /\{\s*"type":\s*"tool_use"[^}]*\}\}/g;
    const matches = content.match(jsonPattern) || [];
    
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match) as ToolUse;
        if (parsed.type === 'tool_use') {
          toolUses.push(parsed);
          // Remove the JSON from the text
          text = text.replace(match, '').trim();
        }
      } catch (e) {
        // Try to extract individual tool use objects if they're malformed
        console.warn('Failed to parse tool use:', e);
      }
    }

    // Alternative pattern for tool results that might be in different format
    const resultPattern = /\{\s*"type":\s*"tool_result"[^}]*\}\}/g;
    const resultMatches = content.match(resultPattern) || [];
    
    for (const match of resultMatches) {
      try {
        const parsed = JSON.parse(match) as ToolResult;
        if (parsed.type === 'tool_result') {
          toolResults.push(parsed);
          text = text.replace(match, '').trim();
        }
      } catch (e) {
        console.warn('Failed to parse tool result:', e);
      }
    }

    // If we couldn't parse JSON properly, try to extract tool info from patterns
    if (toolUses.length === 0) {
      const fallbackPattern = /"name":\s*"([^"]+)".*?"input":\s*\{([^}]+)\}/g;
      let match;
      while ((match = fallbackPattern.exec(content)) !== null) {
        try {
          const toolName = match[1];
          const inputStr = match[2];
          
          // Create a synthetic tool use object
          const syntheticTool: ToolUse = {
            type: 'tool_use',
            id: `synthetic_${Date.now()}_${Math.random()}`,
            name: toolName,
            input: {} // We'll try to parse the input
          };

          // Try to extract key-value pairs from input
          const inputPattern = /"([^"]+)":\s*"([^"]+)"/g;
          let inputMatch;
          while ((inputMatch = inputPattern.exec(inputStr)) !== null) {
            syntheticTool.input[inputMatch[1]] = inputMatch[2];
          }

          toolUses.push(syntheticTool);
          text = text.replace(match[0], '').trim();
        } catch (e) {
          console.warn('Failed to create synthetic tool:', e);
        }
      }
    }

  } catch (error) {
    console.warn('Error parsing message:', error);
  }

  const result: ParsedMessage = {
    text: text || undefined,
    toolUses,
    toolResults
  };

  // Cache the result
  parseCache.set(cacheKey, result);
  cleanupCache();

  return result;
}

/**
 * Visual Tool Use Badge Component
 */
interface ToolBadgeProps {
  tool: ToolUse;
  result?: ToolResult;
  isDarkMode: boolean;
}

export function ToolBadge({ tool, result, isDarkMode }: ToolBadgeProps) {
  const IconComponent = TOOL_ICONS[tool.name as keyof typeof TOOL_ICONS] || Wrench;
  const colorScheme = TOOL_COLORS[tool.name as keyof typeof TOOL_COLORS] || 'from-gray-500 to-gray-600';
  
  const getToolDescription = () => {
    switch (tool.name) {
      case 'Task':
        return tool.input.description || 'Execute task';
      case 'Bash':
        return tool.input.description || `Run: ${tool.input.command?.substring(0, 30)}...`;
      case 'Glob':
        return `Find files: ${tool.input.pattern}`;
      case 'Grep':
        return `Search: "${tool.input.pattern}"`;
      case 'LS':
        return `List: ${tool.input.path || 'current directory'}`;
      case 'Read':
        return `Read: ${tool.input.file_path?.split('/').pop() || 'file'}`;
      case 'Edit':
        return `Edit: ${tool.input.file_path?.split('/').pop() || 'file'}`;
      case 'Write':
        return `Write: ${tool.input.file_path?.split('/').pop() || 'file'}`;
      case 'WebFetch':
        return `Fetch: ${new URL(tool.input.url).hostname}`;
      case 'WebSearch':
        return `Search: "${tool.input.query}"`;
      case 'TodoWrite':
        return `Update todos (${tool.input.todos?.length || 0} items)`;
      default:
        return tool.name;
    }
  };

  const getDetailedInfo = () => {
    const details: Array<{ label: string; value: string }> = [];
    
    Object.entries(tool.input).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length < 200) {
        details.push({ 
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          value 
        });
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        details.push({ 
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          value: String(value) 
        });
      }
    });

    return details;
  };

  const hasError = result?.is_error;
  const isComplete = !!result;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm
        transition-all duration-200 cursor-pointer
        ${isDarkMode 
          ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80' 
          : 'bg-white/50 border-slate-200/50 hover:bg-white/80'
        }
      `}>
        <div className={`p-1.5 rounded-md bg-gradient-to-r ${colorScheme}`}>
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {tool.name}
            </span>
            
            {isComplete && (
              <div className={`w-2 h-2 rounded-full ${
                hasError ? 'bg-red-500' : 'bg-green-500'
              }`} />
            )}
            
            {!isComplete && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-2 h-2 rounded-full bg-blue-500"
              />
            )}
          </div>
          
          <span className={`text-xs truncate max-w-[200px] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {getToolDescription()}
          </span>
        </div>
      </div>

      {/* Detailed Popover */}
      <div className={`
        absolute bottom-full left-0 mb-2 w-80 max-w-sm p-4 rounded-xl border shadow-xl
        backdrop-blur-sm z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200 transform translate-y-2 group-hover:translate-y-0
        ${isDarkMode 
          ? 'bg-slate-800/95 border-slate-700/50' 
          : 'bg-white/95 border-slate-200/50'
        }
      `}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorScheme}`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className={`font-semibold ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {tool.name}
            </h4>
            <p className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {getToolDescription()}
            </p>
          </div>
        </div>

        {getDetailedInfo().length > 0 && (
          <div className="space-y-2">
            <h5 className={`text-xs font-medium uppercase tracking-wide ${
              isDarkMode ? 'text-slate-500' : 'text-slate-700'
            }`}>
              Parameters
            </h5>
            {getDetailedInfo().map(({ label, value }) => (
              <div key={`${label}-${value.substring(0, 10)}`} className="flex justify-between items-start gap-2">
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {label}:
                </span>
                <span className={`text-xs text-right flex-1 font-mono ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {value.length > 40 ? `${value.substring(0, 40)}...` : value}
                </span>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className="mt-3 pt-3 border-t border-slate-200/20">
            <div className="flex items-center gap-2 mb-2">
              {hasError ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className={`text-xs font-medium ${
                hasError 
                  ? 'text-red-500' 
                  : 'text-green-500'
              }`}>
                {hasError ? 'Error' : 'Completed'}
              </span>
            </div>
            {result.content && (
              <p className={`text-xs font-mono ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {result.content.substring(0, 100)}
                {result.content.length > 100 && '...'}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Enhanced Message Component with Tool Visualization
 */
interface EnhancedMessageProps {
  content: string;
  isDarkMode: boolean;
}

export function EnhancedMessage({ content, isDarkMode }: EnhancedMessageProps) {
  // Memoize the parsing result to avoid re-parsing on every render
  const parsed = useMemo(() => parseMessage(content), [content]);
  
  // Memoize the markdown components to prevent recreation on every render
  const markdownComponents = useMemo(() => ({
    code(props: any) {
      const {inline, className, children, ...rest} = props;
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SyntaxHighlighter
            style={isDarkMode ? oneDark : oneLight}
            language={match[1]}
            PreTag="div"
            className="rounded-xl !my-3 shadow-lg"
            {...rest}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </motion.div>
      ) : (
        <code className={`${className} px-2 py-1 rounded-md text-sm font-mono ${
          isDarkMode ? 'bg-slate-700/50 text-slate-200' : 'bg-slate-100 text-slate-800'
        }`} {...rest}>
          {children}
        </code>
      );
    },
    p: ({ children }: any) => (
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="leading-relaxed"
      >
        {children}
      </motion.p>
    )
  }), [isDarkMode]);
  
  // If no tools were used, render as regular markdown
  if (parsed.toolUses.length === 0 && parsed.toolResults.length === 0) {
    return (
      <div className={`prose prose-base max-w-none transition-all ${
        isDarkMode 
          ? 'prose-invert prose-slate prose-headings:text-slate-100 prose-p:text-slate-200 prose-strong:text-slate-100'
          : 'prose-slate prose-headings:text-slate-800 prose-p:text-slate-700'
      }`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tool Usage Section */}
      {parsed.toolUses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Wrench className={`w-4 h-4 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`} />
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Tools Used ({parsed.toolUses.length})
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {parsed.toolUses.map((tool, index) => {
              const result = parsed.toolResults.find(r => r.tool_use_id === tool.id);
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ToolBadge 
                    tool={tool} 
                    result={result}
                    isDarkMode={isDarkMode} 
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Remaining Text Content */}
      {parsed.text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`prose prose-base max-w-none transition-all ${
            isDarkMode 
              ? 'prose-invert prose-slate prose-headings:text-slate-100 prose-p:text-slate-200 prose-strong:text-slate-100'
              : 'prose-slate prose-headings:text-slate-800 prose-p:text-slate-700'
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {parsed.text}
          </ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
}