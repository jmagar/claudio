import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis-client';

// Input validation helpers
const validateKey = (key: string): boolean => {
  return /^[a-zA-Z0-9:_-]+$/.test(key) && key.length < 100;
};

const validateAction = (action: string): boolean => {
  return ['get', 'keys', 'set', 'del', 'clear'].includes(action);
};

const validateTtl = (ttl: unknown): boolean => {
  return typeof ttl === 'number' && ttl > 0 && ttl <= 86400; // Max 24 hours
};

// Simple access control - check for valid session/auth header
const validateAccess = (request: NextRequest): boolean => {
  // For now, just check if request is from same origin
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  return origin === `http://${host}` || origin === `https://${host}` || !origin; // Allow same-origin and localhost
};

export async function GET(request: NextRequest) {
  // Validate access
  if (!validateAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const key = searchParams.get('key');

  // Validate action
  if (!action || !validateAction(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Validate key for actions that require it
  if ((action === 'get') && (!key || !validateKey(key))) {
    return NextResponse.json({ error: 'Invalid or missing key' }, { status: 400 });
  }

  const { client } = getRedisClient();
  
  if (!client) {
    return NextResponse.json({ cached: null });
  }

  try {
    if (action === 'get' && key) {
      const value = await client.get(key);
      return NextResponse.json({ cached: value });
    }
    
    if (action === 'keys') {
      const pattern = searchParams.get('pattern') || 'conv:*';
      const keys = await client.keys(pattern);
      return NextResponse.json({ keys });
    }

    return NextResponse.json({ error: 'Invalid action or missing key' }, { status: 400 });
  } catch (error) {
    console.error('Cache GET error:', error);
    return NextResponse.json({ cached: null });
  }
}

export async function POST(request: NextRequest) {
  // Validate access
  if (!validateAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, key, value, ttl } = body;

  // Validate action
  if (!action || !validateAction(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Validate inputs based on action
  if (action === 'set') {
    if (!key || !validateKey(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }
    if (ttl !== undefined && !validateTtl(ttl)) {
      return NextResponse.json({ error: 'Invalid TTL' }, { status: 400 });
    }
  }

  if (action === 'del' && (!key || !validateKey(key))) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  const { client } = getRedisClient();
  
  if (!client) {
    return NextResponse.json({ success: false, error: 'Redis unavailable' }, { status: 503 });
  }

  try {
    if (action === 'set') {
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'del') {
      await client.del(key);
      return NextResponse.json({ success: true });
    }

    if (action === 'clear') {
      const keys = await client.keys('conv:*');
      keys.push('conversations:list');
      
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return NextResponse.json({ success: true, cleared: keys.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Cache POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}