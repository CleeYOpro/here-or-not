import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET attendance summary for a specific date (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const sql = getDb();

    const attendance = await sql`
      SELECT status FROM "Attendance"
      WHERE date = ${date}
    `;

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
    };

    attendance.forEach((record: any) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance summary' },
      { status: 500 }
    );
  }
}
