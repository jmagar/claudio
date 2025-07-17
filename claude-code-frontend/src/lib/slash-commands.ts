/**
 * Slash Command System for Claude Code Web UI
 * Mimics the file-based slash command system from Claude CLI
 */

export interface SlashCommand {
  name: string;
  description: string;
  instructions: string;
  category?: string;
  aliases?: string[];
}

export interface SlashCommandResult {
  isSlashCommand: boolean;
  command?: SlashCommand;
  processedPrompt?: string;
  error?: string;
}

// Built-in slash commands that mirror Claude CLI functionality
const BUILTIN_COMMANDS: Record<string, SlashCommand> = {
  init: {
    name: 'init',
    description: 'Create a CLAUDE.md file for project memory and context',
    instructions: `Create a CLAUDE.md file in the project root directory. This file should contain:

## Instructions

1. **Project Overview**
   - Describe the project's purpose and architecture
   - List key technologies and frameworks used

2. **Development Setup**
   - Include installation instructions
   - Document development commands (build, test, lint)
   - Explain environment setup requirements

3. **Code Conventions**
   - Document coding standards and style guidelines
   - Explain naming conventions for files and functions
   - Include any project-specific patterns

4. **Architecture Notes**
   - Describe the project structure and organization
   - Explain key modules and their responsibilities
   - Document integration points and dependencies

The CLAUDE.md file serves as Claude's memory for this project and should be comprehensive yet concise.`,
    category: 'setup'
  },
  
  clear: {
    name: 'clear',
    description: 'Reset the current conversation context',
    instructions: `Clear the current conversation history and start fresh. This is useful when:

## When to Use

- Switching to a completely different task
- Context has become too cluttered
- Starting a new feature or bug investigation
- Previous conversation is no longer relevant

## Instructions

Reset the conversation context completely, maintaining only the project's CLAUDE.md context if it exists.`,
    category: 'session'
  },

  compact: {
    name: 'compact',
    description: 'Summarize the conversation to avoid context limits',
    instructions: `Summarize the current conversation to preserve important context while reducing token usage.

## Instructions

1. **Preserve Key Information**
   - Keep all important decisions and conclusions
   - Maintain context about current tasks and goals
   - Preserve any code examples or solutions found

2. **Remove Redundancy**
   - Eliminate repetitive discussions
   - Remove outdated information
   - Compress verbose explanations

3. **Maintain Flow**
   - Keep the logical progression of the conversation
   - Preserve the current state and next steps
   - Include any pending tasks or questions

Provide a concise summary that allows the conversation to continue naturally.`,
    category: 'session'
  },

  review: {
    name: 'review',
    description: 'Review code, PRs, or files for issues and improvements',
    instructions: `Perform a comprehensive code review focusing on:

## Review Areas

1. **Code Quality**
   - Check for bugs and potential issues
   - Verify proper error handling
   - Assess code readability and maintainability

2. **Best Practices**
   - Ensure adherence to coding standards
   - Check for security vulnerabilities
   - Verify performance considerations

3. **Architecture**
   - Evaluate design patterns usage
   - Check for proper separation of concerns
   - Assess scalability and extensibility

4. **Testing**
   - Verify test coverage adequacy
   - Check test quality and reliability
   - Ensure proper test structure

Provide specific, actionable feedback with examples and suggestions for improvement.`,
    category: 'development'
  },

  tree: {
    name: 'tree',
    description: 'Display and analyze the project directory structure',
    instructions: `Analyze and display the project's directory structure.

## Instructions

1. **Generate Directory Tree**
   - Create a visual representation of the project structure
   - Highlight important files and directories
   - Show file types and their purposes

2. **Analyze Organization**
   - Evaluate the project structure for clarity
   - Identify any organizational issues
   - Suggest improvements if needed

3. **Document Key Areas**
   - Explain the purpose of major directories
   - Highlight configuration files
   - Point out important entry points

Focus on helping understand the project layout and organization.`,
    category: 'exploration'
  },

  overview: {
    name: 'overview',
    description: 'Get a high-level overview of the repository',
    instructions: `Provide a comprehensive overview of the repository including:

## Analysis Areas

1. **Project Purpose**
   - What the project does and its main goals
   - Target audience and use cases
   - Key features and functionality

2. **Technical Stack**
   - Programming languages and frameworks
   - Major dependencies and tools
   - Architecture patterns used

3. **Project Structure**
   - How the code is organized
   - Key directories and their purposes
   - Important configuration files

4. **Development Workflow**
   - Build and deployment processes
   - Testing strategy
   - Development commands and scripts

Provide a clear, structured overview that helps understand the project quickly.`,
    category: 'exploration'
  },

  mcp: {
    name: 'mcp',
    description: 'Configure and manage MCP (Model Context Protocol) servers',
    instructions: `Help configure MCP servers for extending Claude's capabilities.

## MCP Configuration

1. **Available Server Types**
   - stdio: Command-line tools and local utilities
   - sse: Server-sent events for web services
   - http: HTTP-based API integrations

2. **Common MCP Servers**
   - filesystem: File system operations
   - github: GitHub API integration
   - web: Web scraping and search
   - database: Database connections

3. **Configuration Steps**
   - Create or update .mcp.json configuration
   - Set up server connections with proper credentials
   - Test server connectivity and functionality

4. **Troubleshooting**
   - Verify server configurations
   - Check connection issues
   - Debug authentication problems

Provide guidance on setting up and managing MCP servers for this project.`,
    category: 'configuration'
  }
};

/**
 * Process user input to detect and handle slash commands
 */
export function processSlashCommand(input: string): SlashCommandResult {
  const trimmed = input.trim();
  
  // Check if input starts with /
  if (!trimmed.startsWith('/')) {
    return { isSlashCommand: false };
  }

  // Extract command name (everything after / until first space)
  const match = trimmed.match(/^\/([a-zA-Z][a-zA-Z0-9_-]*)/);
  if (!match) {
    return {
      isSlashCommand: true,
      error: 'Invalid slash command format. Commands should start with / followed by a command name.'
    };
  }

  const commandName = match[1].toLowerCase();
  const command = BUILTIN_COMMANDS[commandName] || customCommands[commandName];

  if (!command) {
    return {
      isSlashCommand: true,
      error: `Unknown command: /${commandName}. Type /help to see available commands.`
    };
  }

  // Convert slash command to a detailed prompt
  const processedPrompt = `Execute the "${command.name}" command:

${command.instructions}

Please proceed with executing this command according to the instructions above.`;

  return {
    isSlashCommand: true,
    command,
    processedPrompt
  };
}

// Store for dynamically loaded commands
let customCommands: Record<string, SlashCommand> = {};

/**
 * Load custom commands from .claude/commands directory
 */
export async function loadCustomCommands(): Promise<void> {
  try {
    // Try to fetch the commands directory listing
    const response = await fetch('/api/claude-commands');
    if (response.ok) {
      const commands = await response.json();
      customCommands = commands;
      // Refresh help command to include new custom commands
      BUILTIN_COMMANDS.help = generateHelpCommand();
    }
  } catch (error) {
    console.warn('Could not load custom commands:', error);
  }
}

/**
 * Get all available slash commands (built-in + custom)
 */
export function getAvailableCommands(): SlashCommand[] {
  return [...Object.values(BUILTIN_COMMANDS), ...Object.values(customCommands)];
}

/**
 * Get slash commands by category
 */
export function getCommandsByCategory(): Record<string, SlashCommand[]> {
  const commands = [...Object.values(BUILTIN_COMMANDS), ...Object.values(customCommands)];
  const byCategory: Record<string, SlashCommand[]> = {};

  commands.forEach(command => {
    const category = command.category || 'other';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(command);
  });

  return byCategory;
}

/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(input: string): SlashCommand[] {
  if (!input.startsWith('/')) {
    return [];
  }

  const commandPart = input.slice(1).toLowerCase();
  const allCommands = [...Object.values(BUILTIN_COMMANDS), ...Object.values(customCommands)];
  
  return allCommands.filter(command =>
    command.name.toLowerCase().startsWith(commandPart) ||
    command.aliases?.some(alias => alias.toLowerCase().startsWith(commandPart))
  );
}

/**
 * Generate help command dynamically
 */
function generateHelpCommand(): SlashCommand {
  const allCommands = [...Object.values(BUILTIN_COMMANDS), ...Object.values(customCommands)];
  const commandsByCategory = getCommandsByCategory();
  
  return {
    name: 'help',
    description: 'Show all available slash commands',
    instructions: `Display all available slash commands with their descriptions and usage.

## Available Commands

${allCommands
  .filter(cmd => cmd.name !== 'help')
  .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
  .join('\n')}

## Command Categories

${Object.entries(commandsByCategory)
  .map(([category, commands]) => 
    `**${category.toUpperCase()}**: ${commands.map(c => `/${c.name}`).join(', ')}`
  )
  .join('\n')}

## Usage

Type / followed by a command name to execute it. For example:
- \`/init\` - Create a CLAUDE.md file
- \`/review\` - Review current code changes
- \`/tree\` - Show project structure

Commands are processed as detailed prompts that guide Claude to perform specific tasks.

${Object.keys(customCommands).length > 0 ? 
  `\n## Custom Commands\n\nThis project has ${Object.keys(customCommands).length} custom command(s) loaded from \`.claude/commands/\`.` : 
  ''
}`,
    category: 'help'
  };
}

// Add help command dynamically
BUILTIN_COMMANDS.help = generateHelpCommand();