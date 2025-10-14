import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all teachers
export async function GET() {
  try {
    const sql = getDb();
    const teachers = await sql`
      SELECT id, name, username, password
      FROM "Teacher"
      ORDER BY name ASC
    `;

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// POST create new teacher
export async function POST(request: NextRequest) {
  try {
    const { name, username, password } = await request.json();
    const sql = getDb();

    // Check if teacher already exists
    const existing = await sql`
      SELECT id FROM "Teacher" WHERE username = ${username} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Teacher with this username already exists' },
        { status: 400 }
      );
    }

    const teachers = await sql`
      INSERT INTO "Teacher" (name, username, password)
      VALUES (${name}, ${username}, ${password})
      RETURNING id, name, username, password
    `;

    return NextResponse.json(teachers[0]);
  } catch (error) {
    console.error('Create teacher error:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}

// DELETE teacher
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`DELETE FROM "Teacher" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}

// PUT update teacher
export async function PUT(request: NextRequest) {
  try {
    const { id, name, username } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const teachers = await sql`
      UPDATE "Teacher"
      SET name = ${name}, username = ${username}
      WHERE id = ${id}
      RETURNING id, name, username, password
    `;

    return NextResponse.json(teachers[0]);
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}
