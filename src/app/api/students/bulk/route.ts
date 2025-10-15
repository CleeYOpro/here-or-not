import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST bulk create students from CSV
export async function POST(request: NextRequest) {
  try {
    const { students } = await request.json();
    const sql = getDb();

    // students is an array of { id, name, standard, teacherUsername }
    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        // Find teacher by username
        let teacherId = null;
        if (studentData.teacherUsername) {
          const teachers = await sql`
            SELECT id FROM "Teacher" WHERE username = ${studentData.teacherUsername} LIMIT 1
          `;
          teacherId = teachers.length > 0 ? teachers[0].id : null;
        }

        // Check if student already exists
        const existing = await sql`
          SELECT id FROM "Student" WHERE id = ${studentData.id} LIMIT 1
        `;

        if (existing.length > 0) {
          continue; // Skip duplicates
        }

        const created = await sql`
          INSERT INTO "Student" (id, name, standard, "teacherId")
          VALUES (${studentData.id}, ${studentData.name}, ${studentData.standard || null}, ${teacherId})
          RETURNING id, name, standard, "teacherId"
        `;

        results.push(created[0]);
      } catch (error) {
        errors.push({
          studentId: studentData.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      errors,
    });
  } catch (error) {
    console.error('Bulk create students error:', error);
    return NextResponse.json(
      { error: 'Failed to create students' },
      { status: 500 }
    );
  }
}
