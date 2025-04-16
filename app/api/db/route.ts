import { NextResponse } from 'next/server';
import { DatabaseTool } from '@/utils/db-tools';

// Create a single instance of DatabaseTool
const dbTool = new DatabaseTool();

// Execute query
export async function POST(request: Request) {
  try {
    const { connectionUri, query, params } = await request.json();
    const results = await dbTool.execute(connectionUri, query, params);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Remove all other HTTP methods
export async function GET() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PATCH() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
