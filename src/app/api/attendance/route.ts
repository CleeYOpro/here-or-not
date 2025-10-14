import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');

    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = date;

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            standard: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(attendance);
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

    // Upsert attendance (create or update)
    const attendance = await prisma.attendance.upsert({
      where: {
        teacherId_studentId_date: {
          teacherId,
          studentId,
          date,
        },
      },
      update: {
        status,
      },
      create: {
        teacherId,
        studentId,
        date,
        status,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            standard: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(attendance);
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

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
