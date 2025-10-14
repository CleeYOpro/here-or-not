# Architecture Overview

## Current Setup (Before Database)

```
┌─────────────────────────────────────────┐
│         Browser (localhost:3000)        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   React Components (Client)       │ │
│  │                                   │ │
│  │  • useState for teachers          │ │
│  │  • useState for students          │ │
│  │  • useState for attendance        │ │
│  │                                   │ │
│  │  Refresh page → Data lost ❌      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## New Architecture (With Neon + Prisma)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (localhost:3000)                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              React Components (Client)                    │ │
│  │                                                           │ │
│  │  • Fetch data on mount                                   │ │
│  │  • Call API on user actions                              │ │
│  │  • Update UI with responses                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↕                                  │
│                         fetch/POST                              │
│                              ↕                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         Next.js API Routes (Server)                       │ │
│  │         Running on Vercel Serverless                      │ │
│  │                                                           │ │
│  │  /api/auth/admin       - Admin login                     │ │
│  │  /api/auth/teacher     - Teacher login                   │ │
│  │  /api/teachers         - CRUD teachers                   │ │
│  │  /api/students         - CRUD students                   │ │
│  │  /api/attendance       - Mark/view attendance            │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    Prisma Client (ORM)
                              ↕
                    DATABASE_URL (.env)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                  Neon (PostgreSQL Cloud)                        │
│                  https://neon.tech                              │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Admin   │  │ Teacher  │  │ Student  │  │  Attendance  │  │
│  │  Table   │  │  Table   │  │  Table   │  │    Table     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                                                                 │
│  Data persists forever ✅                                       │
│  Accessible from anywhere ✅                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Admin Adds a Teacher

```
1. User clicks "Add Teacher" button
   ↓
2. Frontend calls: POST /api/teachers
   Body: { name: "John Smith", username: "johnsmith", password: "1234567890" }
   ↓
3. API route receives request
   ↓
4. Prisma creates record in database
   await prisma.teacher.create({ data: {...} })
   ↓
5. Neon stores the data permanently
   ↓
6. API returns new teacher object
   ↓
7. Frontend updates UI with new teacher
```

### Example 2: Teacher Marks Attendance

```
1. Teacher clicks "Present" for a student
   ↓
2. Frontend calls: POST /api/attendance
   Body: { teacherId: "abc123", studentId: "12345", date: "2025-10-13", status: "present" }
   ↓
3. API route receives request
   ↓
4. Prisma upserts attendance record
   (creates new or updates existing)
   ↓
5. Neon stores the attendance
   ↓
6. API returns attendance object
   ↓
7. Frontend updates UI
```

### Example 3: Page Refresh

```
Before (Current):
Page refresh → All data lost ❌

After (With Database):
1. Page loads
   ↓
2. useEffect runs on mount
   ↓
3. Frontend calls: GET /api/teachers, GET /api/students, etc.
   ↓
4. API routes query database
   ↓
5. Neon returns all data
   ↓
6. Frontend displays data ✅
```

## File Structure

```
here-or-not/
├── prisma/
│   ├── schema.prisma          # Database schema (tables, relations)
│   └── seed.ts                # Test data script
│
├── src/
│   ├── app/
│   │   ├── api/               # Backend API routes
│   │   │   ├── auth/
│   │   │   │   ├── admin/route.ts
│   │   │   │   └── teacher/route.ts
│   │   │   ├── teachers/route.ts
│   │   │   ├── students/
│   │   │   │   ├── route.ts
│   │   │   │   └── bulk/route.ts
│   │   │   └── attendance/
│   │   │       ├── route.ts
│   │   │       ├── summary/route.ts
│   │   │       └── student/route.ts
│   │   │
│   │   ├── page.tsx           # Frontend (needs updating)
│   │   ├── admin.tsx          # Frontend (needs updating)
│   │   └── teacher.tsx        # Frontend (needs updating)
│   │
│   └── lib/
│       └── prisma.ts          # Prisma client singleton
│
├── .env                       # Environment variables (YOU CREATE THIS)
├── env.example                # Template for .env
├── package.json               # Dependencies + scripts
│
└── Documentation/
    ├── QUICK_START.md         # 5-minute setup guide
    ├── SETUP.md               # Detailed setup guide
    ├── DATABASE_SETUP_COMPLETE.md
    └── ARCHITECTURE.md        # This file
```

## Environment Variables

```
Local Development (.env file):
├── DATABASE_URL="postgresql://..."  # Neon connection string
├── ADMIN_USERNAME="admin"
└── ADMIN_PASSWORD="secure_password"

Production (Vercel Dashboard):
├── DATABASE_URL="postgresql://..."  # Same Neon connection string
├── ADMIN_USERNAME="admin"
└── ADMIN_PASSWORD="secure_password"
```

## Key Concepts

### Prisma = ORM (Object-Relational Mapping)
Instead of writing SQL:
```sql
SELECT * FROM teachers WHERE username = 'johnsmith';
```

You write TypeScript:
```typescript
await prisma.teacher.findUnique({
  where: { username: 'johnsmith' }
});
```

### Next.js API Routes = Serverless Functions
- Each file in `src/app/api/` becomes an endpoint
- Runs on Vercel's servers (not in browser)
- Can access database securely
- Auto-scales with traffic

### Neon = Serverless Postgres
- Real PostgreSQL database
- Hosted in the cloud
- Auto-scales
- Free tier is generous
- No server management needed

## Development Workflow

```
1. Make changes to schema.prisma
   ↓
2. Run: npm run db:push
   (Updates database tables)
   ↓
3. Run: npm run db:generate
   (Updates TypeScript types)
   ↓
4. Update API routes or frontend
   ↓
5. Test locally (npm run dev)
   ↓
6. Push to GitHub
   ↓
7. Vercel auto-deploys
```

## Security Layers

```
Browser
  ↓
  ✅ HTTPS (Vercel provides)
  ↓
API Routes (Server-side)
  ↓
  ✅ Environment variables (not in code)
  ↓
Prisma Client
  ↓
  ✅ Connection pooling
  ✅ SQL injection prevention
  ↓
Neon Database
  ↓
  ✅ SSL/TLS encryption
  ✅ Password protected
```

## What Happens When You Deploy

```
Local (npm run dev):
├── Next.js runs on localhost:3000
├── API routes run on localhost:3000/api/*
└── Connects to Neon (in cloud)

Production (Vercel):
├── Next.js runs on yourapp.vercel.app
├── API routes run on yourapp.vercel.app/api/*
└── Connects to same Neon database

Same code, same database, works everywhere! ✅
```

## Why This Architecture?

✅ **Separation of Concerns**
- Frontend: UI and user interaction
- API Routes: Business logic and validation
- Database: Data storage

✅ **Scalability**
- Serverless functions scale automatically
- Neon handles database scaling
- No server management

✅ **Security**
- Database credentials never exposed to browser
- API routes validate requests
- Environment variables keep secrets safe

✅ **Developer Experience**
- TypeScript end-to-end
- Hot reload in development
- Easy to test and debug

✅ **Cost Effective**
- Free tier covers development and small apps
- Pay only for what you use
- No infrastructure costs
