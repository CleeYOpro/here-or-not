import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const sql = getDb();

    let attendance;
    
    // Build query based on filters
    if (classId && studentId && date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a."classId" = ${classId} AND a."studentId" = ${studentId} AND a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else if (classId && date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a."classId" = ${classId} AND a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else if (classId) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a."classId" = ${classId}
        ORDER BY a.date DESC
      `;
    } else if (schoolId && date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a."schoolId" = ${schoolId} AND a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else if (schoolId) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a."schoolId" = ${schoolId}
        ORDER BY a.date DESC
      `;
    } else if (studentId) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a."studentId" = ${studentId}
        ORDER BY a.date DESC
      `;
    } else if (date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        WHERE a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
          s.name as student_name, s.standard as student_standard,
          c.name as class_name,
          sc.name as school_name
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Class" c ON a."classId" = c.id
        LEFT JOIN "School" sc ON a."schoolId" = sc.id
        ORDER BY a.date DESC
      `;
    }

    // Transform to match expected format
    const formatted = attendance.map((a: any) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      studentId: a.studentId,
      classId: a.classId,
      schoolId: a.schoolId,
      student: {
        id: a.studentId,
        name: a.student_name,
        standard: a.student_standard,
      },
      class: {
        id: a.classId,
        name: a.class_name,
      },
      school: {
        id: a.schoolId,
        name: a.school_name,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST mark attendance
export async function POST(request: NextRequest) {
  try {
    const { classId, schoolId, studentId, date, status } = await request.json();

    if (!classId || !schoolId || !studentId || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if attendance exists for this student on this date
    const existing = await sql`
      SELECT id FROM "Attendance"
      WHERE "studentId" = ${studentId} AND date = ${date}
      LIMIT 1
    `;

    let attendance;
    if (existing.length > 0) {
      // Update existing
      attendance = await sql`
        UPDATE "Attendance"
        SET status = ${status}, "classId" = ${classId}, "schoolId" = ${schoolId}, "updatedAt" = NOW()
        WHERE "studentId" = ${studentId} AND date = ${date}
        RETURNING id, date, status, "studentId", "classId", "schoolId"
      `;
    } else {
      // Create new - generate CUID for id
      const id = `a${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      
      attendance = await sql`
        INSERT INTO "Attendance" (id, "classId", "schoolId", "studentId", date, status, "createdAt", "updatedAt")
        VALUES (${id}, ${classId}, ${schoolId}, ${studentId}, ${date}, ${status}, NOW(), NOW())
        RETURNING id, date, status, "studentId", "classId", "schoolId"
      `;
    }

    return NextResponse.json(attendance[0]);
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}

// DELETE attendance record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`DELETE FROM "Attendance" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
