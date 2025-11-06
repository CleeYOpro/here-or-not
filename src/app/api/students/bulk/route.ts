import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST bulk create students from CSV
export async function POST(request: NextRequest) {
  try {
    const { students, schoolId } = await request.json();
    const sql = getDb();

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // students is an array of { id, name, standard, className }
    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        // Find class by name within the school
        let classId = null;
        if (studentData.className) {
          const classes = await sql`
            SELECT id FROM "Class" WHERE name = ${studentData.className} AND "schoolId" = ${schoolId} LIMIT 1
          `;
          classId = classes.length > 0 ? classes[0].id : null;
        }

        // Check if student already exists
        const existing = await sql`
          SELECT id FROM "Student" WHERE id = ${studentData.id} LIMIT 1
        `;

        if (existing.length > 0) {
          continue; // Skip duplicates
        }

        const created = await sql`
          INSERT INTO "Student" (id, name, standard, "classId", "schoolId", "createdAt", "updatedAt")
          VALUES (${studentData.id}, ${studentData.name}, ${studentData.standard || null}, ${classId}, ${schoolId}, NOW(), NOW())
          RETURNING id, name, standard, "classId", "schoolId"
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
