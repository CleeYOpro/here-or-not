import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const sql = getDb();

    const teachers = await sql`
      SELECT id, name, username, password 
      FROM "Teacher" 
      WHERE username = ${username}
      LIMIT 1
    `;

    if (teachers.length > 0 && teachers[0].password === password) {
      return NextResponse.json({
        success: true,
        teacher: {
          id: teachers[0].id,
          name: teachers[0].name,
          username: teachers[0].username,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Teacher login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
