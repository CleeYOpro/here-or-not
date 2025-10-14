import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST bulk create students from CSV
export async function POST(request: NextRequest) {
  try {
    const { students } = await request.json();

    // students is an array of { id, name, standard, teacherUsername }
    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        // Find teacher by username
        let teacherId = null;
        if (studentData.teacherUsername) {
          const teacher = await prisma.teacher.findUnique({
            where: { username: studentData.teacherUsername },
          });
          teacherId = teacher?.id || null;
        }

        // Check if student already exists
        const existing = await prisma.student.findUnique({
          where: { id: studentData.id },
        });

        if (existing) {
          continue; // Skip duplicates
        }

        const student = await prisma.student.create({
          data: {
            id: studentData.id,
            name: studentData.name,
            standard: studentData.standard,
            teacherId,
          },
        });

        results.push(student);
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
