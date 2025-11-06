import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { schoolId, email, password } = await request.json();
    const sql = getDb();

    // Verify school credentials
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

    // Get classes for this school
    const classes = await sql`
      SELECT id, name, "schoolId"
      FROM "Class"
      WHERE "schoolId" = ${schoolId}
      ORDER BY name ASC
    `;

    return NextResponse.json({
      success: true,
      school: {
        id: schools[0].id,
        name: schools[0].name,
        email: schools[0].email,
      },
      classes: classes.map((c: any) => ({
        id: c.id,
        name: c.name,
        schoolId: c.schoolId,
      })),
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
