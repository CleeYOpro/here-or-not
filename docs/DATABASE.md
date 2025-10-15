# Database Architecture Documentation

Complete documentation of the database structure, relationships, and design decisions for the Here or Not attendance system.

---

## 📊 Database Overview

**Database Type**: PostgreSQL 15+  
**Hosting**: Neon Serverless (https://neon.tech)  
**ORM**: Prisma (schema management)  
**Driver**: @neondatabase/serverless (connection)  
**Total Tables**: 4

---

## 🗂️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database (Neon)                   │
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │    Admin     │         │   Teacher    │                    │
│  ├──────────────┤         ├──────────────┤                    │
│  │ id (PK)      │         │ id (PK)      │                    │
│  │ username     │         │ name         │                    │
│  │ password     │         │ username     │                    │
│  └──────────────┘         │ password     │                    │
│                           │ createdAt    │                    │
│                           │ updatedAt    │                    │
│                           └──────┬───────┘                    │
│                                  │                             │
│                                  │ 1:N                         │
│                                  │                             │
│                           ┌──────┴───────┐                    │
│                           │   Student    │                    │
│                           ├──────────────┤                    │
│                           │ id (PK)      │                    │
│                           │ name         │                    │
│                           │ standard     │                    │
│                           │ teacherId(FK)│                    │
│                           │ createdAt    │                    │
│                           │ updatedAt    │                    │
│                           └──────┬───────┘                    │
│                                  │                             │
│                                  │ 1:N                         │
│                                  │                             │
│                           ┌──────┴───────┐                    │
│                           │  Attendance  │                    │
│                           ├──────────────┤                    │
│                           │ id (PK)      │                    │
│                           │ date         │                    │
│                           │ status       │                    │
│                           │ studentId(FK)│                    │
│                           │ teacherId(FK)│                    │
│                           │ createdAt    │                    │
│                           │ updatedAt    │                    │
│                           └──────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Relationship Summary

```
Admin (1)
  └─ No relations (standalone authentication)

Teacher (1) ──────┬─────── (N) Student
                  │
                  └─────── (N) Attendance
                              │
Student (1) ──────────────── (N) Attendance
```

---

## 📋 Table Definitions

### 1. Admin Table

Stores administrator credentials for system access.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (CUID) | PRIMARY KEY | Unique identifier (e.g., "clxyz123abc") |
| `username` | String | UNIQUE, NOT NULL | Admin login username |
| `password` | String | NOT NULL | Admin password (plain text) |

#### Indexes
- **Primary Key**: `id`
- **Unique Index**: `username`

#### SQL Definition
```sql
CREATE TABLE "Admin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
```

#### Sample Data
```sql
INSERT INTO "Admin" (id, username, password)
VALUES ('clxyz123abc', 'admin', 'secure_password');
```

#### Usage
- Used for admin authentication in `/api/auth/admin`
- Currently hardcoded in API route (username: 'c', password: 'c')
- Can be extended to database-driven authentication

---

### 2. Teacher Table

Stores teacher information and credentials.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (CUID) | PRIMARY KEY | Unique identifier (e.g., "clxyz456def") |
| `name` | String | NOT NULL | Teacher's full name |
| `username` | String | UNIQUE, NOT NULL | Teacher login username |
| `password` | String | NOT NULL | Teacher password (plain text) |
| `createdAt` | DateTime | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last update timestamp |

#### Relationships
- **One-to-Many** with `Student` (one teacher can have many students)
- **One-to-Many** with `Attendance` (one teacher marks attendance for many students)

#### Indexes
- **Primary Key**: `id`
- **Unique Index**: `username`
- **Foreign Key Index**: Referenced by `Student.teacherId`
- **Foreign Key Index**: Referenced by `Attendance.teacherId`

#### SQL Definition
```sql
CREATE TABLE "Teacher" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Teacher_username_key" ON "Teacher"("username");
```

#### Sample Data
```sql
INSERT INTO "Teacher" (id, name, username, password, "createdAt", "updatedAt")
VALUES 
  ('clxyz456def', 'John Smith', 'johnsmith', '1234567890', NOW(), NOW()),
  ('clxyz789ghi', 'Jane Doe', 'janedoe', '0987654321', NOW(), NOW());
```

#### Business Rules
- Username must be unique across all teachers
- Password stored in plain text (consider hashing in production)
- Timestamps automatically managed by database

---

### 3. Student Table

Stores student information and teacher assignments.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String | PRIMARY KEY | 5-digit student ID (e.g., "12345") |
| `name` | String | NOT NULL | Student's full name |
| `standard` | String | NULLABLE | Grade/Class (e.g., "10th Grade") |
| `teacherId` | String | FOREIGN KEY, NULLABLE | Reference to assigned teacher |
| `createdAt` | DateTime | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last update timestamp |

#### Relationships
- **Many-to-One** with `Teacher` (many students belong to one teacher)
- **One-to-Many** with `Attendance` (one student has many attendance records)

#### Foreign Keys
- `teacherId` → `Teacher.id`
  - **ON DELETE**: SET NULL (preserve student if teacher deleted)
  - **ON UPDATE**: CASCADE

#### Indexes
- **Primary Key**: `id`
- **Foreign Key Index**: `teacherId`

#### SQL Definition
```sql
CREATE TABLE "Student" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "standard" TEXT,
  "teacherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") 
    REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Student_teacherId_idx" ON "Student"("teacherId");
```

#### Sample Data
```sql
INSERT INTO "Student" (id, name, standard, "teacherId", "createdAt", "updatedAt")
VALUES 
  ('12345', 'Alice Johnson', '10th Grade', 'clxyz456def', NOW(), NOW()),
  ('12346', 'Bob Williams', '10th Grade', 'clxyz456def', NOW(), NOW()),
  ('12347', 'Charlie Brown', '9th Grade', 'clxyz789ghi', NOW(), NOW()),
  ('12348', 'Diana Prince', NULL, NULL, NOW(), NOW());
```

#### Business Rules
- Student ID is manually assigned (5-digit format)
- Student can exist without a teacher (teacherId NULL)
- Standard/grade is optional
- If teacher is deleted, student remains but teacherId becomes NULL

---

### 4. Attendance Table

Stores daily attendance records for students.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (CUID) | PRIMARY KEY | Unique identifier (e.g., "clxyz111aaa") |
| `date` | String | NOT NULL | Date in YYYY-MM-DD format |
| `status` | String | NOT NULL | "present", "absent", or "late" |
| `studentId` | String | FOREIGN KEY, NOT NULL | Reference to student |
| `teacherId` | String | FOREIGN KEY, NOT NULL | Reference to teacher who marked |
| `createdAt` | DateTime | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last update timestamp |

#### Relationships
- **Many-to-One** with `Student` (many attendance records for one student)
- **Many-to-One** with `Teacher` (many attendance records marked by one teacher)

#### Foreign Keys
- `studentId` → `Student.id`
  - **ON DELETE**: CASCADE (delete attendance if student deleted)
  - **ON UPDATE**: CASCADE
- `teacherId` → `Teacher.id`
  - **ON DELETE**: CASCADE (delete attendance if teacher deleted)
  - **ON UPDATE**: CASCADE

#### Constraints
- **UNIQUE** constraint on `(teacherId, studentId, date)`
  - Prevents duplicate attendance for same student on same day by same teacher
  - Allows upsert operations (update if exists, insert if not)

#### Indexes
- **Primary Key**: `id`
- **Unique Composite Index**: `(teacherId, studentId, date)`
- **Index**: `date` (for fast date-based queries)
- **Index**: `studentId` (for student attendance history)
- **Index**: `teacherId` (for teacher attendance records)

#### SQL Definition
```sql
CREATE TABLE "Attendance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") 
    REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") 
    REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Attendance_teacherId_studentId_date_key" 
  ON "Attendance"("teacherId", "studentId", "date");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE INDEX "Attendance_teacherId_idx" ON "Attendance"("teacherId");
```

#### Sample Data
```sql
INSERT INTO "Attendance" (id, date, status, "studentId", "teacherId", "createdAt", "updatedAt")
VALUES 
  ('clxyz111aaa', '2025-10-14', 'present', '12345', 'clxyz456def', NOW(), NOW()),
  ('clxyz222bbb', '2025-10-14', 'absent', '12346', 'clxyz456def', NOW(), NOW()),
  ('clxyz333ccc', '2025-10-14', 'late', '12347', 'clxyz789ghi', NOW(), NOW()),
  ('clxyz444ddd', '2025-10-13', 'present', '12345', 'clxyz456def', NOW(), NOW());
```

#### Business Rules
- Date stored as string in YYYY-MM-DD format for consistency
- Status must be one of: "present", "absent", "late"
- One attendance record per student per day per teacher
- Updating attendance for same day overwrites previous status
- Cascade delete ensures no orphaned attendance records

---

## 🔗 Relationship Details

### Teacher → Student (One-to-Many)

**Cardinality**: 1:N  
**Foreign Key**: `Student.teacherId` → `Teacher.id`  
**Delete Behavior**: SET NULL

```sql
-- Find all students for a teacher
SELECT * FROM "Student" 
WHERE "teacherId" = 'clxyz456def';

-- Count students per teacher
SELECT t.name, COUNT(s.id) as student_count
FROM "Teacher" t
LEFT JOIN "Student" s ON t.id = s."teacherId"
GROUP BY t.id, t.name;
```

**Business Logic**:
- One teacher can have 0 to many students
- Student can exist without a teacher (NULL teacherId)
- Deleting teacher sets student's teacherId to NULL

---

### Teacher → Attendance (One-to-Many)

**Cardinality**: 1:N  
**Foreign Key**: `Attendance.teacherId` → `Teacher.id`  
**Delete Behavior**: CASCADE

```sql
-- Find all attendance records marked by a teacher
SELECT * FROM "Attendance" 
WHERE "teacherId" = 'clxyz456def';

-- Count attendance records per teacher
SELECT t.name, COUNT(a.id) as attendance_count
FROM "Teacher" t
LEFT JOIN "Attendance" a ON t.id = a."teacherId"
GROUP BY t.id, t.name;
```

**Business Logic**:
- One teacher can mark attendance for many students
- Deleting teacher deletes all their attendance records
- Teacher must exist to mark attendance

---

### Student → Attendance (One-to-Many)

**Cardinality**: 1:N  
**Foreign Key**: `Attendance.studentId` → `Student.id`  
**Delete Behavior**: CASCADE

```sql
-- Find all attendance records for a student
SELECT * FROM "Attendance" 
WHERE "studentId" = '12345'
ORDER BY date DESC;

-- Calculate attendance percentage for a student
SELECT 
  s.name,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
  COUNT(a.id) as total_days,
  ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(a.id), 2) as attendance_percentage
FROM "Student" s
LEFT JOIN "Attendance" a ON s.id = a."studentId"
WHERE s.id = '12345'
GROUP BY s.id, s.name;
```

**Business Logic**:
- One student can have many attendance records
- Deleting student deletes all their attendance records
- Student must exist to mark attendance

---

## 🎯 Design Decisions

### 1. String-based Student IDs
**Decision**: Use string type for student IDs instead of auto-increment integers  
**Reason**: Schools often use custom ID formats (e.g., "12345", "STU001")  
**Trade-off**: Manual ID management vs. flexibility

### 2. Date as String (YYYY-MM-DD)
**Decision**: Store dates as strings instead of DATE type  
**Reason**: Simplifies JavaScript/TypeScript date handling, avoids timezone issues  
**Trade-off**: Less database-level date validation vs. easier client-side handling

### 3. Plain Text Passwords
**Decision**: Store passwords in plain text (current implementation)  
**Reason**: Simplicity for MVP/development  
**Recommendation**: Hash passwords with bcrypt in production

### 4. Composite Unique Index on Attendance
**Decision**: Unique constraint on (teacherId, studentId, date)  
**Reason**: Prevents duplicate attendance, enables upsert pattern  
**Benefit**: Simplifies API logic (one endpoint for create/update)

### 5. Cascade Delete for Attendance
**Decision**: CASCADE delete on both teacher and student foreign keys  
**Reason**: Attendance is meaningless without student or teacher  
**Trade-off**: Data loss vs. referential integrity

### 6. SET NULL for Student.teacherId
**Decision**: SET NULL when teacher is deleted  
**Reason**: Preserve student records even if teacher leaves  
**Benefit**: Historical data preservation

---

## 📈 Performance Considerations

### Indexes

1. **Primary Keys** (all tables)
   - Automatic B-tree indexes
   - Fast lookups by ID

2. **Unique Indexes**
   - `Admin.username`
   - `Teacher.username`
   - `Attendance.(teacherId, studentId, date)`

3. **Foreign Key Indexes**
   - `Student.teacherId`
   - `Attendance.studentId`
   - `Attendance.teacherId`

4. **Query Optimization Indexes**
   - `Attendance.date` - Fast date-range queries
   - Composite index enables efficient upserts

### Query Patterns

**Optimized Queries**:
```sql
-- Fast: Uses date index
SELECT * FROM "Attendance" WHERE date = '2025-10-14';

-- Fast: Uses composite unique index
SELECT * FROM "Attendance" 
WHERE "teacherId" = 'xxx' AND "studentId" = 'yyy' AND date = '2025-10-14';

-- Fast: Uses foreign key index
SELECT * FROM "Student" WHERE "teacherId" = 'xxx';
```

**Slow Queries** (avoid):
```sql
-- Slow: Full table scan
SELECT * FROM "Attendance" WHERE status = 'present';

-- Slow: String pattern matching
SELECT * FROM "Student" WHERE name LIKE '%John%';
```

---

## 🔒 Security Considerations

### Current Implementation

1. **No Password Hashing**
   - Passwords stored in plain text
   - **Risk**: Database breach exposes all passwords
   - **Recommendation**: Implement bcrypt hashing

2. **No SQL Injection Protection**
   - Using parameterized queries via Neon driver
   - **Status**: ✅ Protected by default

3. **No Row-Level Security**
   - All API routes have full database access
   - **Risk**: Compromised API key = full database access
   - **Recommendation**: Implement row-level security policies

### Recommended Improvements

```sql
-- 1. Add password hashing (application layer)
-- Use bcrypt with salt rounds = 10

-- 2. Add row-level security (PostgreSQL)
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_students ON "Student"
  FOR ALL
  TO authenticated_user
  USING ("teacherId" = current_user_id());

-- 3. Add audit logging
CREATE TABLE "AuditLog" (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Sample Queries

### Common Operations

#### 1. Get all students with their teachers
```sql
SELECT 
  s.id, s.name, s.standard,
  t.id as teacher_id, t.name as teacher_name
FROM "Student" s
LEFT JOIN "Teacher" t ON s."teacherId" = t.id
ORDER BY s.name ASC;
```

#### 2. Get attendance for a specific date
```sql
SELECT 
  a.id, a.date, a.status,
  s.name as student_name,
  t.name as teacher_name
FROM "Attendance" a
JOIN "Student" s ON a."studentId" = s.id
JOIN "Teacher" t ON a."teacherId" = t.id
WHERE a.date = '2025-10-14';
```

#### 3. Calculate daily attendance summary
```sql
SELECT 
  date,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
  COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
  COUNT(*) as total
FROM "Attendance"
WHERE date = '2025-10-14'
GROUP BY date;
```

#### 4. Get student attendance history
```sql
SELECT 
  a.date, a.status,
  t.name as marked_by
FROM "Attendance" a
JOIN "Teacher" t ON a."teacherId" = t.id
WHERE a."studentId" = '12345'
ORDER BY a.date DESC
LIMIT 30;
```

#### 5. Find students without teachers
```sql
SELECT id, name, standard
FROM "Student"
WHERE "teacherId" IS NULL;
```

---

## 🔄 Migration Guide

### Adding New Fields

```sql
-- Add email to Teacher table
ALTER TABLE "Teacher" ADD COLUMN email TEXT UNIQUE;

-- Add phone to Student table
ALTER TABLE "Student" ADD COLUMN phone TEXT;

-- Add notes to Attendance table
ALTER TABLE "Attendance" ADD COLUMN notes TEXT;
```

### Changing Relationships

```sql
-- Allow multiple teachers per student (many-to-many)
CREATE TABLE "StudentTeacher" (
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  PRIMARY KEY ("studentId", "teacherId"),
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE
);
```

---

## 📊 Database Statistics

### Current Schema Size

| Table | Columns | Indexes | Foreign Keys |
|-------|---------|---------|--------------|
| Admin | 3 | 2 | 0 |
| Teacher | 6 | 2 | 0 |
| Student | 6 | 2 | 1 |
| Attendance | 7 | 5 | 2 |
| **Total** | **22** | **11** | **3** |

### Estimated Storage (per 1000 records)

| Table | Avg Row Size | 1000 Records |
|-------|--------------|--------------|
| Admin | ~100 bytes | ~100 KB |
| Teacher | ~200 bytes | ~200 KB |
| Student | ~250 bytes | ~250 KB |
| Attendance | ~150 bytes | ~150 KB |

---

## 🎓 Best Practices

### 1. Always Use Transactions for Multi-Table Operations
```sql
BEGIN;
  INSERT INTO "Student" (...) VALUES (...);
  INSERT INTO "Attendance" (...) VALUES (...);
COMMIT;
```

### 2. Use Prepared Statements
```typescript
// Good: Parameterized query
await sql`SELECT * FROM "Student" WHERE id = ${studentId}`;

// Bad: String concatenation (SQL injection risk)
await sql`SELECT * FROM "Student" WHERE id = '${studentId}'`;
```

### 3. Index Foreign Keys
All foreign keys should have indexes for JOIN performance (already implemented).

### 4. Regular Backups
```bash
# Backup database (Neon provides automatic backups)
# Manual backup via pg_dump
pg_dump $DATABASE_URL > backup.sql
```

### 5. Monitor Query Performance
```sql
-- Enable query logging in development
SET log_statement = 'all';

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM "Attendance" WHERE date = '2025-10-14';
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Neon Documentation](https://neon.tech/docs)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
