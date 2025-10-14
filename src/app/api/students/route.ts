import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all students
export async function GET() {
  try {
    const sql = getDb();
    const students = await sql`
      SELECT 
        s.id, s.name, s.standard, s."teacherId",
        t.id as teacher_id, t.name as teacher_name, t.username as teacher_username
      FROM "Student" s
      LEFT JOIN "Teacher" t ON s."teacherId" = t.id
      ORDER BY s.name ASC
    `;

    // Transform to match expected format
    const formatted = students.map((s: any) => ({
      id: s.id,
      name: s.name,
      standard: s.standard,
      teacherId: s.teacherId,
      teacher: s.teacher_id ? {
        id: s.teacher_id,
        name: s.teacher_name,
        username: s.teacher_username,
      } : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST create new student
export async function POST(request: NextRequest) {
  try {
    const { id, name, standard, teacherId } = await request.json();
    const sql = getDb();

    // Check if student already exists
    const existing = await sql`
      SELECT id FROM "Student" WHERE id = ${id} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Student with this ID already exists' },
        { status: 400 }
      );
    }

    const students = await sql`
      INSERT INTO "Student" (id, name, standard, "teacherId")
      VALUES (${id}, ${name}, ${standard || null}, ${teacherId || null})
      RETURNING id, name, standard, "teacherId"
    `;

    return NextResponse.json(students[0]);
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

// DELETE student
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`DELETE FROM "Student" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

// PUT update student
export async function PUT(request: NextRequest) {
  try {
    const { id, name, standard, teacherId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const students = await sql`
      UPDATE "Student"
      SET name = ${name}, standard = ${standard || null}, "teacherId" = ${teacherId || null}
      WHERE id = ${id}
      RETURNING id, name, standard, "teacherId"
    `;

    return NextResponse.json(students[0]);
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}
