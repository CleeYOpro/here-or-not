import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all students (optionally filtered by schoolId or classId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const classId = searchParams.get('classId');
    const sql = getDb();

    let students;
    if (classId) {
      students = await sql`
        SELECT 
          s.id, s.name, s.standard, s."classId", s."schoolId",
          c.id as class_id, c.name as class_name,
          sc.id as school_id, sc.name as school_name, sc.email as school_email
        FROM "Student" s
        LEFT JOIN "Class" c ON s."classId" = c.id
        LEFT JOIN "School" sc ON s."schoolId" = sc.id
        WHERE s."classId" = ${classId}
        ORDER BY s.name ASC
      `;
    } else if (schoolId) {
      students = await sql`
        SELECT 
          s.id, s.name, s.standard, s."classId", s."schoolId",
          c.id as class_id, c.name as class_name,
          sc.id as school_id, sc.name as school_name, sc.email as school_email
        FROM "Student" s
        LEFT JOIN "Class" c ON s."classId" = c.id
        LEFT JOIN "School" sc ON s."schoolId" = sc.id
        WHERE s."schoolId" = ${schoolId}
        ORDER BY s.name ASC
      `;
    } else {
      students = await sql`
        SELECT 
          s.id, s.name, s.standard, s."classId", s."schoolId",
          c.id as class_id, c.name as class_name,
          sc.id as school_id, sc.name as school_name, sc.email as school_email
        FROM "Student" s
        LEFT JOIN "Class" c ON s."classId" = c.id
        LEFT JOIN "School" sc ON s."schoolId" = sc.id
        ORDER BY s.name ASC
      `;
    }

    // Transform to match expected format
    const formatted = students.map((s: any) => ({
      id: s.id,
      name: s.name,
      standard: s.standard,
      classId: s.classId,
      schoolId: s.schoolId,
      class: s.class_id ? {
        id: s.class_id,
        name: s.class_name,
      } : null,
      school: s.school_id ? {
        id: s.school_id,
        name: s.school_name,
        email: s.school_email,
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
    const { id, name, standard, classId, schoolId } = await request.json();
    const sql = getDb();

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

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
      INSERT INTO "Student" (id, name, standard, "classId", "schoolId", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${standard || null}, ${classId || null}, ${schoolId}, NOW(), NOW())
      RETURNING id, name, standard, "classId", "schoolId"
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
    const { id, newId, name, standard, classId, schoolId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const students = await sql`
      UPDATE "Student"
      SET id = ${newId || id}, name = ${name}, standard = ${standard || null}, "classId" = ${classId || null}, "schoolId" = ${schoolId}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, name, standard, "classId", "schoolId"
    `;

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Return only the fields we need (exclude timestamps)
    const student = students[0];
    return NextResponse.json({
      id: student.id,
      name: student.name,
      standard: student.standard,
      classId: student.classId,
      schoolId: student.schoolId
    });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}
