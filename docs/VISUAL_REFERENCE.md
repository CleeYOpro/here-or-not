# Visual Reference Guide

Quick visual diagrams and tables for the Here or Not system.

---

## 🗄️ Database Schema Visual

### Entity Relationship Diagram

```
┌──────────────────┐
│      Admin       │
├──────────────────┤
│ PK  id           │
│     username  🔑 │
│     password     │
└──────────────────┘


┌──────────────────┐
│     Teacher      │
├──────────────────┤
│ PK  id           │
│     name         │
│     username  🔑 │
│     password     │
│     createdAt    │
│     updatedAt    │
└────────┬─────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────┐
    │                         │
    ↓                         ↓
┌──────────────────┐   ┌──────────────────┐
│     Student      │   │   Attendance     │
├──────────────────┤   ├──────────────────┤
│ PK  id           │   │ PK  id           │
│     name         │   │     date         │
│     standard     │   │     status       │
│ FK  teacherId ───┘   │ FK  studentId ───┘
│     createdAt    │   │ FK  teacherId
│     updatedAt    │   │     createdAt
└────────┬─────────┘   │     updatedAt
         │             └──────────────────┘
         │ 1:N
         │
         └─────────────────┐
                           │
                           ↓
                    ┌──────────────────┐
                    │   Attendance     │
                    └──────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
🔑 = Unique Constraint
```

---

## 📊 Table Comparison

| Feature | Admin | Teacher | Student | Attendance |
|---------|-------|---------|---------|------------|
| **Primary Key** | CUID | CUID | Custom String | CUID |
| **Timestamps** | ❌ | ✅ | ✅ | ✅ |
| **Foreign Keys** | 0 | 0 | 1 (teacherId) | 2 (studentId, teacherId) |
| **Unique Constraints** | username | username | id | (teacherId, studentId, date) |
| **Indexes** | 2 | 2 | 2 | 5 |
| **Relations** | None | 1:N Students, 1:N Attendance | N:1 Teacher, 1:N Attendance | N:1 Student, N:1 Teacher |

---

## 🔄 Data Flow Diagrams

### Teacher Marks Attendance

```
┌─────────────┐
│   Teacher   │
│  Dashboard  │
└──────┬──────┘
       │ Clicks "Present"
       ↓
┌─────────────────────────────────────────┐
│  Frontend (React Component)             │
│  • Collects: teacherId, studentId,      │
│              date, status                │
└──────┬──────────────────────────────────┘
       │ POST /api/attendance
       │ { teacherId, studentId, date, status }
       ↓
┌─────────────────────────────────────────┐
│  API Route (route.ts)                   │
│  1. Validate required fields            │
│  2. Initialize database connection      │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Database Query                         │
│  • Check existing attendance            │
│  • If exists: UPDATE                    │
│  • If not: INSERT                       │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Response                               │
│  { id, date, status, studentId,         │
│    teacherId }                          │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Frontend Update                        │
│  • Update React state                   │
│  • Show green "Present" indicator       │
└─────────────────────────────────────────┘
```

---

### Admin Adds Student

```
┌─────────────┐
│    Admin    │
│  Dashboard  │
└──────┬──────┘
       │ Fills form
       ↓
┌─────────────────────────────────────────┐
│  Form Data                              │
│  • id: "12345"                          │
│  • name: "Alice Johnson"                │
│  • standard: "10th Grade"               │
│  • teacherId: "clxyz456def"             │
└──────┬──────────────────────────────────┘
       │ POST /api/students
       ↓
┌─────────────────────────────────────────┐
│  API Route                              │
│  1. Parse JSON body                     │
│  2. Validate fields                     │
│  3. Check duplicate ID                  │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Database                               │
│  INSERT INTO "Student"                  │
│  VALUES (id, name, standard, teacherId) │
│  RETURNING *                            │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Response                               │
│  { id: "12345", name: "Alice Johnson",  │
│    standard: "10th Grade",              │
│    teacherId: "clxyz456def" }           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  UI Update                              │
│  • Add student to list                  │
│  • Show success message                 │
└─────────────────────────────────────────┘
```

---

## 🔌 API Endpoint Map

```
/api
├── /auth
│   ├── /admin
│   │   └── POST    Login admin
│   └── /teacher
│       └── POST    Login teacher
│
├── /teachers
│   ├── GET         List all teachers
│   ├── POST        Create teacher
│   ├── PUT         Update teacher
│   └── DELETE      Delete teacher
│
├── /students
│   ├── GET         List all students
│   ├── POST        Create student
│   ├── PUT         Update student
│   ├── DELETE      Delete student
│   └── /bulk
│       └── POST    Bulk import
│
└── /attendance
    ├── GET         Query records
    ├── POST        Mark/update
    ├── DELETE      Delete record
    ├── /summary
    │   └── GET     Daily stats
    └── /student
        └── GET     Student history
```

---

## 📦 Technology Stack Layers

```
┌─────────────────────────────────────────────────────┐
│                   PRESENTATION                      │
│  React 19 + Next.js 15 + TypeScript + Tailwind     │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTP/JSON
                     ↓
┌─────────────────────────────────────────────────────┐
│                   API LAYER                         │
│  Next.js API Routes (Serverless Functions)          │
└────────────────────┬────────────────────────────────┘
                     │
                     │ SQL Queries
                     ↓
┌─────────────────────────────────────────────────────┐
│                DATA ACCESS                          │
│  Neon Serverless Driver + Prisma                    │
└────────────────────┬────────────────────────────────┘
                     │
                     │ PostgreSQL Protocol
                     ↓
┌─────────────────────────────────────────────────────┐
│                   DATABASE                          │
│  PostgreSQL (Neon Cloud)                            │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### Admin Login

```
┌──────────┐
│  Login   │
│  Page    │
└────┬─────┘
     │ Enter credentials
     ↓
┌─────────────────────┐
│  POST /api/auth/    │
│  admin              │
│  { username, pass } │
└────┬────────────────┘
     │
     ↓
┌─────────────────────┐
│  Hardcoded Check    │
│  username === 'c'   │
│  password === 'c'   │
└────┬────────────────┘
     │
     ├─ ✅ Valid
     │    └─→ { success: true }
     │         └─→ Redirect to /admin
     │
     └─ ❌ Invalid
          └─→ { success: false, error: "..." }
               └─→ Show error message
```

### Teacher Login

```
┌──────────┐
│  Login   │
│  Page    │
└────┬─────┘
     │ Enter credentials
     ↓
┌─────────────────────┐
│  POST /api/auth/    │
│  teacher            │
│  { username, pass } │
└────┬────────────────┘
     │
     ↓
┌─────────────────────────────────────┐
│  Database Query                     │
│  SELECT * FROM "Teacher"            │
│  WHERE username = ? AND password = ?│
└────┬────────────────────────────────┘
     │
     ├─ ✅ Found
     │    └─→ { success: true, teacher: {...} }
     │         └─→ Store teacher data
     │              └─→ Redirect to /teacher
     │
     └─ ❌ Not Found
          └─→ { success: false, error: "..." }
               └─→ Show error message
```

---

## 📊 Database Indexes Visual

### Attendance Table Indexes

```
Attendance Table
├── Primary Key Index
│   └── id (B-tree)
│
├── Unique Composite Index
│   └── (teacherId, studentId, date)
│       • Prevents duplicate attendance
│       • Enables fast upsert operations
│
├── Date Index
│   └── date (B-tree)
│       • Fast date-range queries
│       • Daily summary queries
│
├── Student Index
│   └── studentId (B-tree)
│       • Fast student history lookup
│       • JOIN optimization
│
└── Teacher Index
    └── teacherId (B-tree)
        • Fast teacher records lookup
        • JOIN optimization
```

---

## 🔄 Cascade Delete Behavior

### When Teacher is Deleted

```
DELETE Teacher (id: "abc123")
         │
         ├─→ Student.teacherId
         │   └─→ SET NULL
         │       • Students remain
         │       • teacherId becomes NULL
         │
         └─→ Attendance.teacherId
             └─→ CASCADE DELETE
                 • All attendance records deleted
                 • No orphaned records
```

### When Student is Deleted

```
DELETE Student (id: "12345")
         │
         └─→ Attendance.studentId
             └─→ CASCADE DELETE
                 • All attendance records deleted
                 • No orphaned records
```

---

## 📈 Performance Characteristics

### Query Performance

```
Fast Queries (< 50ms):
├── SELECT with indexed columns
│   ├── WHERE teacherId = ?
│   ├── WHERE studentId = ?
│   ├── WHERE date = ?
│   └── WHERE (teacherId, studentId, date) = (?, ?, ?)
│
└── JOINs on foreign keys
    ├── Student JOIN Teacher
    └── Attendance JOIN Student JOIN Teacher

Slow Queries (> 100ms):
├── Full table scans
│   └── WHERE status = ?
│
└── Pattern matching
    └── WHERE name LIKE '%John%'
```

---

## 🚀 Deployment Flow

```
┌─────────────────┐
│  Local Machine  │
│  git push       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     GitHub      │
│  Repository     │
└────────┬────────┘
         │ Webhook
         ↓
┌─────────────────────────────────┐
│         Vercel                  │
│  1. Detect changes              │
│  2. Install dependencies        │
│  3. Build Next.js app           │
│  4. Deploy serverless functions │
│  5. Update live site            │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Production Live                │
│  https://yourapp.vercel.app     │
│  • Global CDN                   │
│  • Auto HTTPS                   │
│  • Serverless functions         │
└─────────────────────────────────┘
         │
         │ Connects to
         ↓
┌─────────────────────────────────┐
│  Neon PostgreSQL                │
│  • Same database as dev         │
│  • Connection pooling           │
│  • Auto-scaling                 │
└─────────────────────────────────┘
```

---

## 📁 File Structure Tree

```
here-or-not/
│
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   ├── 📂 auth/
│   │   │   │   ├── 📂 admin/
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📂 teacher/
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📂 teachers/
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📂 students/
│   │   │   │   ├── 📄 route.ts
│   │   │   │   └── 📂 bulk/
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📂 attendance/
│   │   │       ├── 📄 route.ts
│   │   │       ├── 📂 summary/
│   │   │       │   └── 📄 route.ts
│   │   │       └── 📂 student/
│   │   │           └── 📄 route.ts
│   │   ├── 📄 page.tsx
│   │   ├── 📂 admin/
│   │   │   └── 📄 page.tsx
│   │   └── 📂 teacher/
│   │       └── 📄 page.tsx
│   └── 📂 lib/
│       ├── 📄 db.ts
│       └── 📄 prisma.ts
│
├── 📂 prisma/
│   ├── 📄 schema.prisma
│   └── 📄 seed.ts
│
├── 📂 docs/
│   ├── 📄 DATABASE.md
│   ├── 📄 BACKEND.md
│   ├── 📄 API.md
│   ├── 📄 SYSTEM_OVERVIEW.md
│   └── 📄 VISUAL_REFERENCE.md
│
├── 📄 .env.local (create this)
├── 📄 env.example
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 README.md
├── 📄 ARCHITECTURE.md
└── 📄 PROJECT_SUMMARY.md
```

---

## 🎯 Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server → localhost:3000
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema to database
npm run db:generate      # Generate Prisma types
npm run db:studio        # Open database GUI → localhost:5555
npm run db:seed          # Seed test data

# Code Quality
npm run lint             # Run ESLint
```

---

## 📊 Status Codes Reference

| Code | Name | Usage |
|------|------|-------|
| **200** | OK | Successful request |
| **400** | Bad Request | Missing/invalid parameters |
| **401** | Unauthorized | Invalid credentials |
| **404** | Not Found | Resource doesn't exist |
| **500** | Internal Server Error | Database/server error |

---

## 🔑 Environment Variables

```env
# Required
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Optional (for admin auth)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure_password"
```

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Getting started |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design |
| [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) | Complete overview |
| [DATABASE.md](DATABASE.md) | Database details |
| [BACKEND.md](BACKEND.md) | Backend architecture |
| [API.md](API.md) | API reference |
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | Quick reference |
| [VISUAL_REFERENCE.md](VISUAL_REFERENCE.md) | This file |
