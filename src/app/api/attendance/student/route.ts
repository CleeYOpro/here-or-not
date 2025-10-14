import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
      },
      include: {
        teacher: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate summary
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      total: attendance.length,
    };

    attendance.forEach((record: { status: string }) => {
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
