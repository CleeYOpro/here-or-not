import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // Change this!
    },
  });
  console.log('✅ Admin created:', admin.username);

  // Create test teachers
  const teacher1 = await prisma.teacher.upsert({
    where: { username: 'johnsmith' },
    update: {},
    create: {
      name: 'John Smith',
      username: 'johnsmith',
      password: '1234567890',
    },
  });
  console.log('✅ Teacher created:', teacher1.name);

  const teacher2 = await prisma.teacher.upsert({
    where: { username: 'janedoe' },
    update: {},
    create: {
      name: 'Jane Doe',
      username: 'janedoe',
      password: '0987654321',
    },
  });
  console.log('✅ Teacher created:', teacher2.name);

  // Create test students
  const students = await prisma.student.createMany({
    data: [
      { id: '12345', name: 'Alice Johnson', standard: 'Grade 10', teacherId: teacher1.id },
      { id: '12346', name: 'Bob Williams', standard: 'Grade 10', teacherId: teacher1.id },
      { id: '12347', name: 'Charlie Brown', standard: 'Grade 9', teacherId: teacher2.id },
      { id: '12348', name: 'Diana Prince', standard: 'Grade 9', teacherId: teacher2.id },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ ${students.count} students created`);

  // Create some sample attendance records
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  await prisma.attendance.createMany({
    data: [
      { teacherId: teacher1.id, studentId: '12345', date: today, status: 'present' },
      { teacherId: teacher1.id, studentId: '12346', date: today, status: 'absent' },
      { teacherId: teacher2.id, studentId: '12347', date: today, status: 'late' },
      { teacherId: teacher2.id, studentId: '12348', date: today, status: 'present' },
      { teacherId: teacher1.id, studentId: '12345', date: yesterday, status: 'present' },
      { teacherId: teacher1.id, studentId: '12346', date: yesterday, status: 'present' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Sample attendance records created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
