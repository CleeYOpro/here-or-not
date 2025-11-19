import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all schools
export async function GET() {
  try {
    const sql = getDb();
    const schools = await sql`
      SELECT id, name, email
      FROM "School"
      ORDER BY name ASC
    `;

    return NextResponse.json(schools);
  } catch (error) {
    console.error('Get schools error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

// POST create new school
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    const sql = getDb();

    // Check if school already exists
    const existing = await sql`
      SELECT id FROM "School" WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'School with this email already exists' },
        { status: 400 }
      );
    }

    // Generate a CUID for the id field
    const id = `s${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;

    const schools = await sql`
      INSERT INTO "School" (id, name, email, password, "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${email}, ${password}, NOW(), NOW())
      RETURNING id, name, email
    `;

    return NextResponse.json(schools[0]);
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}

// DELETE school
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`DELETE FROM "School" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete school error:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}

// PUT update school
export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, password } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: (string | undefined)[] = [];
    
    if (name !== undefined) {
      updateFields.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${values.length + 1}`);
      values.push(email);
    }
    if (password !== undefined) {
      updateFields.push(`password = $${values.length + 1}`);
      values.push(password);
    }
    
    updateFields.push(`"updatedAt" = NOW()`);
    values.push(id);

    const schools = await sql`
      UPDATE "School"
      SET name = ${name}, email = ${email}, password = ${password}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, name, email
    `;

    if (schools.length === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(schools[0]);
  } catch (error) {
    console.error('Update school error:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}
