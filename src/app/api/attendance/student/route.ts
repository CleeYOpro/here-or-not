import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET attendance history for a specific student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const attendance = await sql`
      SELECT 
        a.id, a.date, a.status, a."studentId", a."classId", a."schoolId",
        c.name as class_name,
        sc.name as school_name
      FROM "Attendance" a
      LEFT JOIN "Class" c ON a."classId" = c.id
      LEFT JOIN "School" sc ON a."schoolId" = sc.id
      WHERE a."studentId" = ${studentId}
      ORDER BY a.date DESC
    `;

    // Calculate summary
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      total: attendance.length,
    };

    attendance.forEach((record: any) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
    });

    return NextResponse.json({
      attendance,
      summary,
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student attendance' },
      { status: 500 }
    );
  }
}
