# Database Setup Guide - Neon + Prisma

This guide will help you set up your Neon database and connect it to your application.

## Step 1: Create a Neon Account and Project

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Click "Create Project"
4. Give it a name (e.g., "here-or-not")
5. Select a region (choose one closest to you)
6. Click "Create Project"

## Step 2: Get Your Database Connection String

1. After creating the project, you'll see a connection string
2. It looks like: `postgresql://username:password@ep-something-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. Copy this entire string

## Step 3: Set Up Environment Variables

1. In your project root, create a file called `.env` (note the dot at the start)
2. Add the following:

```env
DATABASE_URL="your_connection_string_here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"
```

Replace `your_connection_string_here` with the connection string from Neon.
Replace `your_secure_password` with a strong password for admin login.

**IMPORTANT**: Never commit the `.env` file to Git. It's already in `.gitignore`.

## Step 4: Initialize the Database

Run these commands in order:

```bash
# Generate Prisma Client
npx prisma generate

# Push the schema to your Neon database (creates all tables)
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

The `npx prisma db push` command will:
- Connect to your Neon database
- Create all the tables (Admin, Teacher, Student, Attendance)
- Set up all relationships and indexes

**You don't need to manually create anything in Neon!** Prisma does it all for you.

## Step 5: Seed Initial Data (Optional)

You can create a seed script to add test data. Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test teachers
  const teacher1 = await prisma.teacher.create({
    data: {
      name: 'John Smith',
      username: 'johnsmith',
      password: '1234567890', // 10-digit password
    },
  });

  // Create test students
  await prisma.student.createMany({
    data: [
      { id: '12345', name: 'Alice Johnson', standard: 'Grade 10', teacherId: teacher1.id },
      { id: '12346', name: 'Bob Williams', standard: 'Grade 10', teacherId: teacher1.id },
    ],
  });

  console.log('Seed data created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Then run: `npx tsx prisma/seed.ts`

## Step 6: Run Your Application

```bash
npm run dev
```

Your app will now:
- Connect to Neon database (even from localhost)
- Persist all data (survives page refreshes)
- Work the same in development and production

## Vercel Deployment

When deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the same variables from your `.env` file:
   - `DATABASE_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Deploy!

Vercel will automatically use these environment variables.

## Database Management

### View Your Data
```bash
npx prisma studio
```
Opens a GUI at `http://localhost:5555` to view/edit data.

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma db push --force-reset
```

### Check Database Status
```bash
npx prisma db pull
```

## Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` is correct
- Ensure your Neon project is active (free tier may suspend after inactivity)
- Check your internet connection

### "Table already exists"
- This is fine! It means your tables are already created
- Just run `npx prisma generate` to update the client

### "Environment variable not found: DATABASE_URL"
- Make sure your `.env` file is in the project root
- Restart your dev server after creating `.env`

## What Prisma Does For You

✅ **Automatic Table Creation**: No manual SQL needed
✅ **Type Safety**: TypeScript types generated from your schema
✅ **Migrations**: Schema changes are tracked
✅ **Connection Pooling**: Efficient database connections
✅ **Query Builder**: Easy-to-use API instead of raw SQL

## Cost

Neon's free tier includes:
- 0.5 GB storage
- Unlimited queries
- Perfect for development and small apps

Your app will fit comfortably in the free tier!
