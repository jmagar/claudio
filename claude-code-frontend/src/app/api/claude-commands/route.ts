import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SlashCommand {
  name: string;
  description: string;
  instructions: string;
  category?: string;
  aliases?: string[];
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
      continue;
    }
    
    // Collect instructions content
    else if (inInstructions) {
      if (line.startsWith('##') && !line.match(/^##?\s*Instructions?\s*$/i)) {
        // Hit another section, stop collecting instructions
        break;
      }
      instructions += line + '\n';
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
export async function GET(_request: NextRequest) {
  try {
    const commands: Record<string, SlashCommand> = {};
    
    // Try both project root and global .claude/commands directories
    const possiblePaths = [
      path.join(process.cwd(), '.claude', 'commands'),
      path.join(process.env.HOME || '~', '.claude', 'commands')
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
            const command = parseCommandFile(content, file);
            
            // Use filename (without extension) as the command key
            const commandKey = file.replace('.md', '').toLowerCase();
            commands[commandKey] = command;
            
          } catch (fileError) {
            console.warn(`Error reading command file ${file}:`, fileError);
          }
        }
        
      } catch {
        // Directory doesn't exist or can't be read, continue to next path
        continue;
      }
    }
    
    return NextResponse.json(commands);
    
  } catch (error) {
    console.error('Error loading custom commands:', error);
    return NextResponse.json({}, { status: 200 }); // Return empty object on error
  }
}