import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    // No record or window expired, create new record
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  // Increment count
  record.count++;
  return false;
}

interface SlashCommand {
  name: string;
  description: string;
  instructions: string;
  category?: string;
  aliases?: string[];
}

/**
 * Validate command file content for security and size
 */
function validateCommandFile(content: string, filename: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Size limits
  const MAX_FILE_SIZE = 100 * 1024; // 100KB
  const MAX_FILENAME_LENGTH = 100;
  
  if (content.length > MAX_FILE_SIZE) {
    errors.push(`Command file ${filename} exceeds maximum size of ${MAX_FILE_SIZE} bytes`);
  }
  
  if (filename.length > MAX_FILENAME_LENGTH) {
    errors.push(`Command filename ${filename} exceeds maximum length of ${MAX_FILENAME_LENGTH} characters`);
  }
  
  // Filename validation
  if (!/^[a-zA-Z0-9_-]+\.md$/.test(filename)) {
    errors.push(`Invalid filename ${filename}. Must contain only letters, numbers, hyphens, underscores, and end with .md`);
  }
  
  // Content validation
  if (!content.trim()) {
    errors.push(`Command file ${filename} is empty`);
  }
  
  // Check for potentially dangerous content patterns
  const dangerousPatterns = [
    /exec\s*\(/i,
    /eval\s*\(/i,
    /system\s*\(/i,
    /require\s*\(/i,
    /import\s+.*from/i,
    /process\./i,
    /fs\./i,
    /child_process/i,
    /__dirname/i,
    /__filename/i,
    /\.\.\/\.\.\//,  // Path traversal
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      errors.push(`Command file ${filename} contains potentially unsafe content`);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse a markdown command file and extract command information
 */
function parseCommandFile(content: string, filename: string): SlashCommand {
  const lines = content.split('\n');
  let title = '';
  let description = '';
  let instructions = '';
  let inInstructions = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract title (first # heading)
    if (line.startsWith('# ') && !title) {
      title = line.substring(2).trim();
    }
    
    // Extract description (first paragraph after title)
    else if (!description && title && line && !line.startsWith('#')) {
      description = line;
    }
    
    // Look for Instructions section
    else if (line.match(/^##?\s*Instructions?\s*$/i)) {
      inInstructions = true;
    }
    
    // Collect instructions content
    else if (inInstructions) {
      if (line.startsWith('##') && !line.match(/^##?\s*Instructions?\s*$/i)) {
        // Hit another section, stop collecting instructions
        break;
      }
      instructions += `${line}\n`;
    }
  }
  
  // Use filename as fallback for name
  const commandName = title || filename.replace('.md', '');
  
  return {
    name: commandName.toLowerCase().replace(/\s+/g, '-'),
    description: description || `Custom command: ${commandName}`,
    instructions: instructions.trim() || content,
    category: 'custom'
  };
}

/**
 * Load custom commands from .claude/commands directory
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    }

    const commands: Record<string, SlashCommand> = {};
    
    // Try both project root and global .claude/commands directories
    const possiblePaths = [
      path.join(process.cwd(), '.claude', 'commands'),
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'commands')
    ];
    
    for (const commandsDir of possiblePaths) {
      try {
        // Check if directory exists
        const stats = await fs.stat(commandsDir);
        if (!stats.isDirectory()) continue;
        
        // Read all markdown files in the directory
        const files = await fs.readdir(commandsDir);
        const markdownFiles = files.filter(file => file.endsWith('.md'));
        
        // Parse each command file
        for (const file of markdownFiles) {
          try {
            const filePath = path.join(commandsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Validate file content
            const validation = validateCommandFile(content, file);
            if (!validation.isValid) {
              console.warn(`Command file ${file} validation failed:`, validation.errors);
              continue;
            }
            
            const command = parseCommandFile(content, file);
            
            if (command) {
              // Use filename (without extension) as the command key
              const commandKey = file.replace('.md', '').toLowerCase();
              commands[commandKey] = command;
            }
            
          } catch (fileError) {
            console.warn(`Error reading command file ${file}:`, fileError);
          }
        }
        
      } catch {
        // Directory doesn't exist or can't be read, continue to next path
      }
    }
    
    return NextResponse.json(commands);
    
  } catch (error) {
    console.error('Error loading custom commands:', error);
    return NextResponse.json({}, { status: 500 });
  }
}