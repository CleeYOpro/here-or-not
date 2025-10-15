import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_cRwWJ7FLxp3S@ep-wispy-truth-a7w1svg1-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require';

async function seed() {
  const sql = neon(DATABASE_URL);

  console.log('🌱 Starting seed...');

  // Create test teachers
  const teacher1 = await sql`
    INSERT INTO "Teacher" (name, username, password)
    VALUES ('John Smith', 'johnsmith', '1234567890')
    ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, username
  `;
  console.log('✅ Teacher created:', teacher1[0].name);

  const teacher2 = await sql`
    INSERT INTO "Teacher" (name, username, password)
    VALUES ('Jane Doe', 'janedoe', '0987654321')
    ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, username
  `;
  console.log('✅ Teacher created:', teacher2[0].name);

  // Create test students
  await sql`
    INSERT INTO "Student" (id, name, standard, "teacherId")
    VALUES 
      ('12345', 'Alice Johnson', 'Grade 10', ${teacher1[0].id}),
      ('12346', 'Bob Williams', 'Grade 10', ${teacher1[0].id}),
      ('12347', 'Charlie Brown', 'Grade 9', ${teacher2[0].id}),
      ('12348', 'Diana Prince', 'Grade 9', ${teacher2[0].id})
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('✅ Students created');

  // Create sample attendance
  const today = new Date().toISOString().slice(0, 10);
  await sql`
    INSERT INTO "Attendance" ("teacherId", "studentId", date, status)
    VALUES 
      (${teacher1[0].id}, '12345', ${today}, 'present'),
      (${teacher1[0].id}, '12346', ${today}, 'absent'),
      (${teacher2[0].id}, '12347', ${today}, 'late'),
      (${teacher2[0].id}, '12348', ${today}, 'present')
    ON CONFLICT ("teacherId", "studentId", date) DO NOTHING
  `;
  console.log('✅ Attendance records created');

  console.log('🎉 Seed completed!');
}

seed().catch(console.error);
