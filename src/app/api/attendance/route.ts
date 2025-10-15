import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const sql = getDb();

    let attendance;
    
    if (teacherId && studentId && date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."teacherId",
          s.name as student_name, s.standard as student_standard,
          t.name as teacher_name, t.username as teacher_username
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Teacher" t ON a."teacherId" = t.id
        WHERE a."teacherId" = ${teacherId} AND a."studentId" = ${studentId} AND a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else if (teacherId && date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."teacherId",
          s.name as student_name, s.standard as student_standard,
          t.name as teacher_name, t.username as teacher_username
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Teacher" t ON a."teacherId" = t.id
        WHERE a."teacherId" = ${teacherId} AND a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else if (teacherId) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."teacherId",
          s.name as student_name, s.standard as student_standard,
          t.name as teacher_name, t.username as teacher_username
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Teacher" t ON a."teacherId" = t.id
        WHERE a."teacherId" = ${teacherId}
        ORDER BY a.date DESC
      `;
    } else if (studentId) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."teacherId",
          s.name as student_name, s.standard as student_standard,
          t.name as teacher_name, t.username as teacher_username
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Teacher" t ON a."teacherId" = t.id
        WHERE a."studentId" = ${studentId}
        ORDER BY a.date DESC
      `;
    } else if (date) {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."teacherId",
          s.name as student_name, s.standard as student_standard,
          t.name as teacher_name, t.username as teacher_username
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Teacher" t ON a."teacherId" = t.id
        WHERE a.date = ${date}
        ORDER BY a.date DESC
      `;
    } else {
      attendance = await sql`
        SELECT 
          a.id, a.date, a.status, a."studentId", a."teacherId",
          s.name as student_name, s.standard as student_standard,
          t.name as teacher_name, t.username as teacher_username
        FROM "Attendance" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Teacher" t ON a."teacherId" = t.id
        ORDER BY a.date DESC
      `;
    }

    // Transform to match expected format
    const formatted = attendance.map((a: any) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      studentId: a.studentId,
      teacherId: a.teacherId,
      student: {
        id: a.studentId,
        name: a.student_name,
        standard: a.student_standard,
      },
      teacher: {
        id: a.teacherId,
        name: a.teacher_name,
        username: a.teacher_username,
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
    const { teacherId, studentId, date, status } = await request.json();

    if (!teacherId || !studentId || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if attendance exists
    const existing = await sql`
      SELECT id FROM "Attendance"
      WHERE "teacherId" = ${teacherId} AND "studentId" = ${studentId} AND date = ${date}
      LIMIT 1
    `;

    let attendance;
    if (existing.length > 0) {
      // Update existing
      const now = new Date().toISOString();
      attendance = await sql`
        UPDATE "Attendance"
        SET status = ${status}, "updatedAt" = ${now}
        WHERE "teacherId" = ${teacherId} AND "studentId" = ${studentId} AND date = ${date}
        RETURNING id, date, status, "studentId", "teacherId"
      `;
    } else {
      // Create new
      const now = new Date().toISOString();
      attendance = await sql`
        INSERT INTO "Attendance" ("teacherId", "studentId", date, status, "createdAt", "updatedAt")
        VALUES (${teacherId}, ${studentId}, ${date}, ${status}, ${now}, ${now})
        RETURNING id, date, status, "studentId", "teacherId"
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
