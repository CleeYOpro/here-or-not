import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all classes (optionally filtered by schoolId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const sql = getDb();

    let classes;
    if (schoolId) {
      classes = await sql`
        SELECT 
          c.id, c.name, c."schoolId",
          s.id as school_id, s.name as school_name, s.email as school_email
        FROM "Class" c
        LEFT JOIN "School" s ON c."schoolId" = s.id
        WHERE c."schoolId" = ${schoolId}
        ORDER BY c.name ASC
      `;
    } else {
      classes = await sql`
        SELECT 
          c.id, c.name, c."schoolId",
          s.id as school_id, s.name as school_name, s.email as school_email
        FROM "Class" c
        LEFT JOIN "School" s ON c."schoolId" = s.id
        ORDER BY c.name ASC
      `;
    }

    // Transform to match expected format
    const formatted = classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      schoolId: c.schoolId,
      school: c.school_id ? {
        id: c.school_id,
        name: c.school_name,
        email: c.school_email,
      } : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST create new class
export async function POST(request: NextRequest) {
  try {
    const { name, schoolId } = await request.json();
    const sql = getDb();

    if (!name || !schoolId) {
      return NextResponse.json(
        { error: 'Name and schoolId are required' },
        { status: 400 }
      );
    }

    // Generate a CUID for the id field
    const id = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;

    const classes = await sql`
      INSERT INTO "Class" (id, name, "schoolId", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${schoolId}, NOW(), NOW())
      RETURNING id, name, "schoolId"
    `;

    return NextResponse.json(classes[0]);
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}

// DELETE class
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`DELETE FROM "Class" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}

// PUT update class
export async function PUT(request: NextRequest) {
  try {
    const { id, name, schoolId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const classes = await sql`
      UPDATE "Class"
      SET name = ${name}, "schoolId" = ${schoolId}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, name, "schoolId"
    `;

    if (classes.length === 0) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(classes[0]);
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}
