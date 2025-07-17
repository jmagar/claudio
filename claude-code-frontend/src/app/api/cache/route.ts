import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const key = searchParams.get('key');

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
  const { action, key, value, ttl } = await request.json();

  const { client } = getRedisClient();
  
  if (!client) {
    return NextResponse.json({ success: false });
  }

  try {
    if (action === 'set' && key && value) {
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'del' && key) {
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
    return NextResponse.json({ success: false });
  }
}