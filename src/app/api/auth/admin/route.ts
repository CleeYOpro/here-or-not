import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { schoolId, email, password } = await request.json();
    const sql = getDb();

    // First verify school credentials
    const schools = await sql`
      SELECT id, name, email, password 
      FROM "School" 
      WHERE id = ${schoolId} AND email = ${email}
      LIMIT 1
    `;

    if (schools.length === 0 || schools[0].password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if admin exists for this school
    const admins = await sql`
      SELECT id, name, email, "schoolId"
      FROM "Admin"
      WHERE "schoolId" = ${schoolId}
      LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      school: {
        id: schools[0].id,
        name: schools[0].name,
        email: schools[0].email,
      },
      admin: admins.length > 0 ? {
        id: admins[0].id,
        name: admins[0].name,
        email: admins[0].email,
      } : null,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
