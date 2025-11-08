# Visual Reference Guide

Quick visual diagrams and tables for the Here or Not system.

---

## 🗄️ Database Schema Visual

### Entity Relationship Diagram

```
┌──────────────────┐
│      School      │
├──────────────────┤
│ PK  id           │
│     name         │
│     email     🔑 │
│     password     │
│     createdAt    │
│     updatedAt    │
└────────┬─────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────┐
    │                │                │
    ↓                ↓                ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│      Admin       │ │      Class       │ │     Student      │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ PK  id           │ │ PK  id           │ │ PK  id           │
│     name         │ │     name         │ │     name         │
│     email     🔑 │ │ FK  schoolId ────┘ │     standard     │
│     password     │ │     createdAt    │ │ FK  classId      │
│ FK  schoolId ────┘ │     updatedAt    │ │ FK  schoolId ────┘
└──────────────────┘ └────────┬─────────┘ │     createdAt    │
                              │           │     updatedAt    │
                              │ 1:N       └────────┬─────────┘
                              │                    │
                              │                    │ 1:N
                              │                    │
                              └────────┬───────────┘
                                       │
                                       ↓
                                ┌──────────────────┐
                                │   Attendance     │
                                ├──────────────────┤
                                │ PK  id           │
                                │     date         │
                                │     status       │
                                │ FK  studentId    │
                                │ FK  classId      │
                                │ FK  schoolId     │
                                │     createdAt    │
                                │     updatedAt    │
                                └──────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
🔑 = Unique Constraint
```

---

## 📊 Table Comparison

| Feature | School | Admin | Class | Student | Attendance |
|---------|--------|-------|-------|---------|------------|
| **Primary Key** | CUID | CUID | CUID | Custom String | CUID |
| **Timestamps** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Foreign Keys** | 0 | 1 (schoolId) | 1 (schoolId) | 2 (classId, schoolId) | 3 (studentId, classId, schoolId) |
| **Unique Constraints** | email | email | - | id | (studentId, date) |
| **Indexes** | 2 | 2 | 2 | 3 | 5 |
| **Relations** | 1:N Admins, Classes, Students, Attendance | N:1 School | N:1 School, 1:N Students, Attendance | N:1 Class, N:1 School, 1:N Attendance | N:1 Student, N:1 Class, N:1 School |

---

## 🔄 Data Flow Diagrams

### Teacher Marks Attendance

```
┌─────────────┐
│   Teacher   │
│  Dashboard  │
│  (Class)    │
└──────┬──────┘
       │ Clicks "Present"
       ↓
┌─────────────────────────────────────────┐
│  Frontend (React Component)             │
│  • Collects: classId, schoolId,         │
│              studentId, date, status     │
└──────┬──────────────────────────────────┘
       │ POST /api/attendance
       │ { classId, schoolId, studentId, date, status }
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
│  • If not: INSERT with generated ID     │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Response                               │
│  { id, date, status, studentId,         │
│    classId, schoolId }                  │
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
│  • classId: "clxyz456def"               │
│  • schoolId: "sxyz789ghi"               │
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
│  VALUES (id, name, standard,            │
│          classId, schoolId)             │
│  RETURNING *                            │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Response                               │
│  { id: "12345", name: "Alice Johnson",  │
│    standard: "10th Grade",              │
│    classId: "clxyz456def",              │
│    schoolId: "sxyz789ghi" }             │
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
│   │   └── POST    Login admin (school-based)
│   └── /teacher
│       └── POST    Login teacher (school-based)
│
├── /schools
│   ├── GET         List all schools
│   ├── POST        Create school
│   ├── PUT         Update school
│   └── DELETE      Delete school
│
├── /classes
│   ├── GET         List all classes (filter by schoolId)
│   ├── POST        Create class
│   ├── PUT         Update class
│   └── DELETE      Delete class
│
├── /students
│   ├── GET         List all students (filter by schoolId/classId)
│   ├── POST        Create student
│   ├── PUT         Update student
│   ├── DELETE      Delete student
│   └── /bulk
│       └── POST    Bulk import
│
└── /attendance
    ├── GET         Query records (filter by schoolId/classId)
    ├── POST        Mark/update
    ├── DELETE      Delete record
    ├── /summary
    │   └── GET     Daily stats (filter by schoolId)
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
     │ Select school & enter credentials
     ↓
┌─────────────────────────────┐
│  POST /api/auth/admin       │
│  { schoolId, email, pass }  │
└────┬────────────────────────┘
     │
     ↓
┌─────────────────────────────────────┐
│  Database Query                     │
│  1. Verify school credentials       │
│  2. Check admin exists for school   │
└────┬────────────────────────────────┘
     │
     ├─ ✅ Valid
     │    └─→ { success: true, school: {...}, admin: {...} }
     │         └─→ Load admin dashboard
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
     │ Select school & enter credentials
     ↓
┌─────────────────────────────┐
│  POST /api/auth/teacher     │
│  { schoolId, email, pass }  │
└────┬────────────────────────┘
     │
     ↓
┌─────────────────────────────────────┐
│  Database Query                     │
│  1. Verify school credentials       │
│  2. Fetch classes for school        │
└────┬────────────────────────────────┘
     │
     ├─ ✅ Valid
     │    └─→ { success: true, school: {...}, classes: [...] }
     │         └─→ Show class selection
     │              └─→ Load class dashboard
     │
     └─ ❌ Invalid
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
│   └── (studentId, date)
│       • Prevents duplicate attendance per day
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
├── Class Index
│   └── classId (B-tree)
│       • Fast class records lookup
│       • JOIN optimization
│
└── School Index
    └── schoolId (B-tree)
        • Fast school-wide queries
        • JOIN optimization
```

---

## 🔄 Cascade Delete Behavior

### When School is Deleted

```
DELETE School (id: "abc123")
         │
         ├─→ Admin.schoolId
         │   └─→ SET NULL
         │       • Admins remain
         │       • schoolId becomes NULL
         │
         ├─→ Class.schoolId
         │   └─→ CASCADE DELETE
         │       • All classes deleted
         │       • Cascades to students/attendance
         │
         ├─→ Student.schoolId
         │   └─→ CASCADE DELETE
         │       • All students deleted
         │       • Cascades to attendance
         │
         └─→ Attendance.schoolId
             └─→ CASCADE DELETE
                 • All attendance records deleted
```

### When Class is Deleted

```
DELETE Class (id: "xyz456")
         │
         ├─→ Student.classId
         │   └─→ SET NULL
         │       • Students remain
         │       • classId becomes NULL
         │
         └─→ Attendance.classId
             └─→ CASCADE DELETE
                 • All attendance records deleted
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
│   ├── WHERE schoolId = ?
│   ├── WHERE classId = ?
│   ├── WHERE studentId = ?
│   ├── WHERE date = ?
│   └── WHERE (studentId, date) = (?, ?)
│
└── JOINs on foreign keys
    ├── Student JOIN Class JOIN School
    └── Attendance JOIN Student JOIN Class JOIN School

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
│   │   │   ├── 📂 schools/
│   │   │   │   └── 📄 route.ts
│   │   │   ├── 📂 classes/
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
│   │   ├── 📄 page.tsx (Login & Role Selection)
│   │   ├── 📄 admin.tsx (Admin Dashboard Component)
│   │   └── 📄 teacher.tsx (Teacher Dashboard Component)
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
