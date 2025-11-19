import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface CSVRow {
  name: string;
  number: string;
  grade: string;
  class: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const schoolId = formData.get('schoolId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredColumns = ['name', 'number', 'grade', 'class'];
    
    // Validate headers
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse data rows
    const rows: CSVRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate row data
      if (!row.name || !row.number || !row.grade || !row.class) {
        errors.push(`Row ${i}: Missing required fields`);
        continue;
      }

      // Validate number is 5 digits
      if (!/^\d{5}$/.test(row.number)) {
        errors.push(`Row ${i}: Student number must be exactly 5 digits`);
        continue;
      }

      rows.push({
        name: row.name,
        number: row.number,
        grade: row.grade,
        class: row.class,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows found in CSV', details: errors },
        { status: 400 }
      );
    }

    const sql = getDb();
    const results = {
      created: 0,
      updated: 0,
      classesCreated: 0,
      errors: errors,
    };

    // Process each row
    for (const row of rows) {
      try {
        // Check if class exists, create if not
        const classRecord = await sql`
          SELECT id, name FROM "Class"
          WHERE name = ${row.class} AND "schoolId" = ${schoolId}
          LIMIT 1
        `;

        let classId: string;

        if (classRecord.length === 0) {
          // Create new class
          const newClassId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
          const newClass = await sql`
            INSERT INTO "Class" (id, name, "schoolId", "createdAt", "updatedAt")
            VALUES (${newClassId}, ${row.class}, ${schoolId}, NOW(), NOW())
            RETURNING id
          `;
          classId = newClass[0].id;
          results.classesCreated++;
        } else {
          classId = classRecord[0].id;
        }

        // Check if student exists
        const existingStudent = await sql`
          SELECT id FROM "Student"
          WHERE id = ${row.number}
          LIMIT 1
        `;

        if (existingStudent.length > 0) {
          // Update existing student
          await sql`
            UPDATE "Student"
            SET name = ${row.name},
                standard = ${row.grade},
                "classId" = ${classId},
                "schoolId" = ${schoolId},
                "updatedAt" = NOW()
            WHERE id = ${row.number}
          `;
          results.updated++;
        } else {
          // Create new student
          await sql`
            INSERT INTO "Student" (id, name, standard, "classId", "schoolId", "createdAt", "updatedAt")
            VALUES (${row.number}, ${row.name}, ${row.grade}, ${classId}, ${schoolId}, NOW(), NOW())
          `;
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing row:`, row, error);
        results.errors.push(`Failed to process student ${row.number}: ${row.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${rows.length} rows`,
      results,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}
