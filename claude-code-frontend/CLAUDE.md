# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Testing & Quality
Run `npm run lint` before committing to ensure code quality standards are met.

## Code Organization Guidelines

### Component Structure
- **Single Responsibility**: Each component should have one clear purpose
- **Size Limit**: Components over 300 lines should be broken into smaller pieces
- **Extract Logic**: Move complex logic to custom hooks or utility functions
- **Separate Concerns**: UI rendering, business logic, and data fetching should be distinct

### File Organization Principles
- **Group by Feature**: Related components, hooks, and utilities should be co-located
- **Consistent Naming**: Use kebab-case for files, PascalCase for components
- **Barrel Exports**: Use index.ts files to create clean import paths
- **Type Safety**: All components must have proper TypeScript definitions

## Architecture Overview

This is a Next.js 15 frontend application that provides a web interface for the Claude Code SDK. The application enables real-time streaming conversations with Claude Code through a modern, responsive UI.

### Core Architecture Components

**Frontend Framework**: Next.js 15 with React 19, TypeScript, and Tailwind CSS 4.x
**UI Framework**: Radix UI components with custom styling using shadcn/ui conventions
**Animation**: Framer Motion for smooth transitions and interactions
**Claude Integration**: Direct integration with `@anthropic-ai/claude-code` SDK

### Key Modules

**`src/lib/claude-code-sdk.ts`**: Core SDK wrapper that handles streaming queries to Claude Code. Provides formatted message parsing and error handling for the Claude Code API.

**`src/lib/conversation-store.ts`**: Client-side conversation persistence using localStorage. Manages conversation history, token tracking, and MCP server configurations.

**`src/components/claude-max-interface.tsx`**: Main chat interface orchestrator. Coordinates between modular components:
- Imports and composes `ConversationSidebar`, `ChatMessages`, `ChatInput`, and `SettingsPanel`
- Manages global state and API communication
- Handles real-time streaming from Claude Code SDK

**API Routes**:
- `/api/claude-code/route.ts` - Non-streaming Claude Code API endpoint
- `/api/claude-code/stream/route.ts` - Streaming API endpoint using Server-Sent Events

### Data Flow

1. User input → `ClaudeMaxInterface` component
2. HTTP POST to `/api/claude-code/stream` with prompt and configuration
3. Server streams Claude Code SDK responses as Server-Sent Events
4. Client receives and formats messages in real-time
5. Conversation automatically saved to localStorage with token tracking

### MCP Server Integration

The application supports MCP (Model Context Protocol) server configuration through the settings panel. Users can configure multiple MCP servers with different connection types (stdio, sse, http) that extend Claude's capabilities.

### UI/UX Architecture

**Design System**: Uses a gradient-based design with glassmorphism effects
**Responsive**: Mobile-first approach with collapsible sidebar
**Theme Support**: Comprehensive dark/light mode with smooth transitions
**State Management**: React hooks with localStorage persistence
**Error Handling**: Graceful error boundaries with user-friendly messages

### Important Implementation Details

**Message Deduplication**: Custom message formatting prevents duplicate content in streaming responses
**Token Tracking**: Automatic token usage tracking from Claude Code API responses  
**Conversation Persistence**: Automatic saving with 50-conversation limit
**Authentication**: Relies on `claude login` CLI authentication
**Code Highlighting**: Syntax highlighting for code blocks using react-syntax-highlighter

### Configuration Files

**`components.json`**: shadcn/ui configuration for component generation
**`next.config.ts`**: Minimal Next.js configuration 
**`tsconfig.json`**: TypeScript configuration with strict mode and path aliases
**`postcss.config.js`**: PostCSS configuration for Tailwind CSS

### Scripts

**`scripts/code-review.sh`**: Automated code review script that uses Claude CLI to analyze git diffs
**`scripts/smart-commit.sh`**: Intelligent commit script for automated commit message generation

## Modular Development Guidelines

### Component Extraction Strategy
- **Large Components**: Break down components over 300 lines into focused sub-components
- **Feature-Based Modules**: Group related chat functionality (`src/components/chat/`)
- **Shared UI**: Reusable components in `src/components/ui/` following shadcn/ui patterns
- **Custom Hooks**: Extract stateful logic into composable hooks (`src/hooks/`)

### Refactoring Priorities
1. **Extract Chat Sub-Components**: `ConversationSidebar`, `ChatMessages`, `ChatInput`, `SettingsPanel`
2. **Create Custom Hooks**: `useConversations`, `useStreaming`, `useMcpServers`
3. **Utility Functions**: Message formatting, theme management, keyboard shortcuts
4. **Type Definitions**: Consolidate interfaces in `src/types/`

### Maintenance Standards
- **Import Organization**: Group imports by type (React, external libs, internal modules)
- **Error Boundaries**: Wrap major sections in error boundaries for graceful failures
- **Performance**: Use `useMemo` and `useCallback` for expensive operations
- **Testing**: Add unit tests for complex logic and utility functions

The application follows Next.js App Router conventions with TypeScript strict mode and modern React patterns emphasizing modularity and maintainability.