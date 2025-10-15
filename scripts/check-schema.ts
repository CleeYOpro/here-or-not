import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_cRwWJ7FLxp3S@ep-wispy-truth-a7w1svg1-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require';

async function checkSchema() {
  const sql = neon(DATABASE_URL);

  console.log('🔍 Checking Attendance table schema...\n');

  const columns = await sql`
    SELECT column_name, column_default, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_name = 'Attendance'
    ORDER BY ordinal_position
  `;

  console.table(columns);
}

checkSchema().catch(console.error);
