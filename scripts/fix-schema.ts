import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_cRwWJ7FLxp3S@ep-wispy-truth-a7w1svg1-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require';

async function fixSchema() {
  const sql = neon(DATABASE_URL);

  console.log('🔧 Fixing database schema...');

  // Add default UUID generation to Teacher table
  await sql`
    ALTER TABLE "Teacher" 
    ALTER COLUMN id SET DEFAULT gen_random_uuid()
  `;
  console.log('✅ Teacher.id now has default UUID');

  // Add default timestamp for Teacher.updatedAt
  await sql`
    ALTER TABLE "Teacher" 
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP
  `;
  console.log('✅ Teacher.updatedAt now has default timestamp');

  // Add default timestamp for Student.createdAt
  await sql`
    ALTER TABLE "Student" 
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP
  `;
  console.log('✅ Student.createdAt now has default timestamp');

  // Add default timestamp for Student.updatedAt (if it exists)
  try {
    await sql`
      ALTER TABLE "Student" 
      ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP
    `;
    console.log('✅ Student.updatedAt now has default timestamp');
  } catch (e) {
    console.log('⚠️  Student.updatedAt column does not exist (skipping)');
  }

  // Add default UUID generation to Attendance table
  await sql`
    ALTER TABLE "Attendance" 
    ALTER COLUMN id SET DEFAULT gen_random_uuid()
  `;
  console.log('✅ Attendance.id now has default UUID');

  // Add default timestamp for Attendance.createdAt
  try {
    await sql`
      ALTER TABLE "Attendance" 
      ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP
    `;
    console.log('✅ Attendance.createdAt now has default timestamp');
  } catch (e) {
    console.log('⚠️  Attendance.createdAt column does not exist (skipping)');
  }

  // Add default timestamp for Attendance.updatedAt
  try {
    await sql`
      ALTER TABLE "Attendance" 
      ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP
    `;
    console.log('✅ Attendance.updatedAt now has default timestamp');
  } catch (e) {
    console.log('⚠️  Attendance.updatedAt column does not exist (skipping)');
  }

  console.log('🎉 Schema fixed!');
}

fixSchema().catch(console.error);
