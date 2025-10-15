# Backend Architecture Documentation

Complete documentation of the backend API architecture, serverless functions, and data flow for the Here or Not attendance system.

---

## 🏗️ Architecture Overview

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.5.2 | Full-stack React framework |
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **API Pattern** | REST | - | HTTP-based API |
| **Deployment** | Serverless | - | Auto-scaling functions |
| **Database Driver** | @neondatabase/serverless | 1.0.2 | PostgreSQL connection |
| **ORM** | Prisma | 6.17.1 | Schema management |
| **Language** | TypeScript | 5.x | Type-safe development |

---

## 📐 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                    (Browser / React App)                        │
│                                                                 │
│  • React Components                                             │
│  • State Management (useState, useEffect)                       │
│  • HTTP Client (fetch API)                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │ JSON Payloads
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│                   (Next.js Routing System)                      │
│                                                                 │
│  • Route Matching                                               │
│  • Request Parsing                                              │
│  • Response Formatting                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Serverless Functions                         │
│                    (Next.js API Routes)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Authentication Layer                                    │  │
│  │  • /api/auth/admin                                       │  │
│  │  • /api/auth/teacher                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer                                    │  │
│  │  • /api/teachers (CRUD)                                  │  │
│  │  • /api/students (CRUD + Bulk)                           │  │
│  │  • /api/attendance (CRUD + Queries)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Validation & Error Handling                             │  │
│  │  • Input validation                                      │  │
│  │  • Error responses                                       │  │
│  │  • Logging                                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL Queries
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Database Connection Layer                      │
│                      (src/lib/db.ts)                            │
│                                                                 │
│  • Neon Serverless Driver                                       │
│  • Connection Pooling                                           │
│  • Query Execution                                              │
│  • SQL Injection Prevention                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ PostgreSQL Protocol
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                        (Neon Cloud)                             │
│                                                                 │
│  • Data Persistence                                             │
│  • ACID Transactions                                            │
│  • Indexes & Constraints                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Components

### 1. Database Connection Layer

**File**: `src/lib/db.ts`

```typescript
import { neon } from '@neondatabase/serverless';

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }
  return neon(process.env.DATABASE_URL);
}
```

**Purpose**:
- Centralized database connection management
- Environment variable validation
- Neon serverless driver initialization

**Features**:
- ✅ HTTP-based connections (serverless-friendly)
- ✅ Automatic connection pooling
- ✅ SSL/TLS encryption
- ✅ No persistent TCP connections needed

**Usage Pattern**:
```typescript
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const results = await sql`SELECT * FROM "Teacher"`;
  return NextResponse.json(results);
}
```

---

### 2. API Route Structure

**Location**: `src/app/api/*`

```
api/
├── auth/
│   ├── admin/
│   │   └── route.ts          # POST - Admin login
│   └── teacher/
│       └── route.ts          # POST - Teacher login
│
├── teachers/
│   └── route.ts              # GET, POST, PUT, DELETE
│
├── students/
│   ├── route.ts              # GET, POST, PUT, DELETE
│   └── bulk/
│       └── route.ts          # POST - Bulk import
│
└── attendance/
    ├── route.ts              # GET, POST, DELETE
    ├── summary/
    │   └── route.ts          # GET - Daily summary
    └── student/
        └── route.ts          # GET - Student history
```

**Route Naming Convention**:
- Each `route.ts` file exports HTTP method handlers
- Methods: `GET`, `POST`, `PUT`, `DELETE`
- URL path matches directory structure

**Example Route**:
```typescript
// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  // Handle GET /api/teachers
}

export async function POST(request: NextRequest) {
  // Handle POST /api/teachers
}

export async function PUT(request: NextRequest) {
  // Handle PUT /api/teachers
}

export async function DELETE(request: NextRequest) {
  // Handle DELETE /api/teachers
}
```

---

## 🔄 Request-Response Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                               │
└─────────────────────────────────────────────────────────────────┘
  User clicks "Add Teacher" button
  Form data collected: { name, username, password }
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. HTTP REQUEST                                                 │
└─────────────────────────────────────────────────────────────────┘
  fetch('http://localhost:3000/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password })
  })
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. NEXT.JS ROUTING                                              │
└─────────────────────────────────────────────────────────────────┘
  • Route matched: /api/teachers
  • Method matched: POST
  • Handler invoked: POST function in route.ts
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. REQUEST PARSING                                              │
└─────────────────────────────────────────────────────────────────┘
  const { name, username, password } = await request.json();
  • Body parsed as JSON
  • Variables extracted
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. VALIDATION                                                   │
└─────────────────────────────────────────────────────────────────┘
  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. DATABASE CONNECTION                                          │
└─────────────────────────────────────────────────────────────────┘
  const sql = getDb();
  • Environment variable checked
  • Neon driver initialized
  • Connection established
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. BUSINESS LOGIC                                               │
└─────────────────────────────────────────────────────────────────┘
  // Check for duplicate username
  const existing = await sql`
    SELECT id FROM "Teacher" WHERE username = ${username} LIMIT 1
  `;
  
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Username exists' }, { status: 400 });
  }
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. DATABASE QUERY                                               │
└─────────────────────────────────────────────────────────────────┘
  const teachers = await sql`
    INSERT INTO "Teacher" (name, username, password)
    VALUES (${name}, ${username}, ${password})
    RETURNING id, name, username, password
  `;
  • Parameterized query (SQL injection safe)
  • Auto-generated ID (CUID)
  • Timestamps auto-set
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. RESPONSE FORMATTING                                          │
└─────────────────────────────────────────────────────────────────┘
  return NextResponse.json(teachers[0]);
  • Status: 200 OK
  • Body: { id, name, username, password }
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. CLIENT RECEIVES RESPONSE                                    │
└─────────────────────────────────────────────────────────────────┘
  const newTeacher = await response.json();
  • React state updated
  • UI re-renders
  • New teacher appears in list
```

---

## 📋 API Endpoints

### Authentication Endpoints

#### 1. Admin Login
**Endpoint**: `POST /api/auth/admin`  
**File**: `src/app/api/auth/admin/route.ts`

**Request**:
```json
{
  "username": "admin",
  "password": "secure_password"
}
```

**Response (Success)**:
```json
{
  "success": true
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Hardcoded credentials (can be moved to database)
    if (username === 'c' && password === 'c') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
```

---

#### 2. Teacher Login
**Endpoint**: `POST /api/auth/teacher`  
**File**: `src/app/api/auth/teacher/route.ts`

**Request**:
```json
{
  "username": "johnsmith",
  "password": "1234567890"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "teacher": {
    "id": "clxyz456def",
    "name": "John Smith",
    "username": "johnsmith"
  }
}
```

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const sql = getDb();

    const teachers = await sql`
      SELECT id, name, username, password
      FROM "Teacher"
      WHERE username = ${username} AND password = ${password}
      LIMIT 1
    `;

    if (teachers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const teacher = teachers[0];
    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        username: teacher.username,
      },
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
```

---

### Teacher Management

#### GET /api/teachers
Fetch all teachers.

**SQL Query**:
```sql
SELECT id, name, username, password
FROM "Teacher"
ORDER BY name ASC
```

**Response**:
```json
[
  {
    "id": "clxyz456def",
    "name": "John Smith",
    "username": "johnsmith",
    "password": "1234567890"
  }
]
```

---

#### POST /api/teachers
Create a new teacher.

**Validation**:
1. Check required fields (name, username, password)
2. Check for duplicate username

**SQL Queries**:
```sql
-- Check duplicate
SELECT id FROM "Teacher" WHERE username = ${username} LIMIT 1

-- Insert new teacher
INSERT INTO "Teacher" (name, username, password)
VALUES (${name}, ${username}, ${password})
RETURNING id, name, username, password
```

---

#### PUT /api/teachers
Update an existing teacher.

**SQL Query**:
```sql
UPDATE "Teacher"
SET name = ${name}, username = ${username}
WHERE id = ${id}
RETURNING id, name, username, password
```

---

#### DELETE /api/teachers?id=xxx
Delete a teacher.

**SQL Query**:
```sql
DELETE FROM "Teacher" WHERE id = ${id}
```

**Cascade Effect**:
- Students' `teacherId` set to NULL
- Attendance records deleted

---

### Student Management

#### GET /api/students
Fetch all students with teacher information.

**SQL Query**:
```sql
SELECT 
  s.id, s.name, s.standard, s."teacherId",
  t.id as teacher_id, t.name as teacher_name, t.username as teacher_username
FROM "Student" s
LEFT JOIN "Teacher" t ON s."teacherId" = t.id
ORDER BY s.name ASC
```

**Response**:
```json
[
  {
    "id": "12345",
    "name": "Alice Johnson",
    "standard": "10th Grade",
    "teacherId": "clxyz456def",
    "teacher": {
      "id": "clxyz456def",
      "name": "John Smith",
      "username": "johnsmith"
    }
  }
]
```

---

#### POST /api/students
Create a new student.

**Validation**:
1. Check required fields (id, name)
2. Check for duplicate student ID

**SQL Queries**:
```sql
-- Check duplicate
SELECT id FROM "Student" WHERE id = ${id} LIMIT 1

-- Insert new student
INSERT INTO "Student" (id, name, standard, "teacherId")
VALUES (${id}, ${name}, ${standard}, ${teacherId})
RETURNING id, name, standard, "teacherId"
```

---

#### PUT /api/students
Update an existing student.

**SQL Query**:
```sql
UPDATE "Student"
SET id = ${newId}, name = ${name}, standard = ${standard}, "teacherId" = ${teacherId}
WHERE id = ${id}
RETURNING id, name, standard, "teacherId"
```

---

#### POST /api/students/bulk
Bulk import students from CSV.

**Request**:
```json
{
  "students": [
    { "id": "12345", "name": "Alice", "standard": "10th", "teacherUsername": "johnsmith" },
    { "id": "12346", "name": "Bob", "standard": "10th", "teacherUsername": "johnsmith" }
  ]
}
```

**Process**:
1. Loop through each student
2. Find teacher by username
3. Check for duplicates (skip if exists)
4. Insert student

**Response**:
```json
{
  "success": true,
  "created": 2,
  "errors": []
}
```

---

### Attendance Management

#### GET /api/attendance
Query attendance records with filters.

**Query Parameters**:
- `teacherId` - Filter by teacher
- `studentId` - Filter by student
- `date` - Filter by date (YYYY-MM-DD)

**Examples**:
```
GET /api/attendance?teacherId=xxx&date=2025-10-14
GET /api/attendance?studentId=12345
GET /api/attendance?date=2025-10-14
```

**SQL Query** (with all filters):
```sql
SELECT 
  a.id, a.date, a.status, a."studentId", a."teacherId",
  s.name as student_name, s.standard as student_standard,
  t.name as teacher_name, t.username as teacher_username
FROM "Attendance" a
LEFT JOIN "Student" s ON a."studentId" = s.id
LEFT JOIN "Teacher" t ON a."teacherId" = t.id
WHERE a."teacherId" = ${teacherId} 
  AND a."studentId" = ${studentId} 
  AND a.date = ${date}
ORDER BY a.date DESC
```

---

#### POST /api/attendance
Mark or update attendance.

**Request**:
```json
{
  "teacherId": "clxyz456def",
  "studentId": "12345",
  "date": "2025-10-14",
  "status": "present"
}
```

**Process**:
1. Check if attendance exists for (teacherId, studentId, date)
2. If exists: UPDATE
3. If not exists: INSERT

**SQL Queries**:
```sql
-- Check existing
SELECT id FROM "Attendance"
WHERE "teacherId" = ${teacherId} 
  AND "studentId" = ${studentId} 
  AND date = ${date}

-- Update existing
UPDATE "Attendance"
SET status = ${status}, "updatedAt" = ${now}
WHERE "teacherId" = ${teacherId} 
  AND "studentId" = ${studentId} 
  AND date = ${date}
RETURNING id, date, status, "studentId", "teacherId"

-- Insert new
INSERT INTO "Attendance" ("teacherId", "studentId", date, status, "createdAt", "updatedAt")
VALUES (${teacherId}, ${studentId}, ${date}, ${status}, ${now}, ${now})
RETURNING id, date, status, "studentId", "teacherId"
```

---

#### GET /api/attendance/summary
Get daily attendance summary.

**Query Parameters**:
- `date` - Date to summarize (default: today)

**SQL Query**:
```sql
SELECT status FROM "Attendance"
WHERE date = ${date}
```

**Response**:
```json
{
  "present": 15,
  "absent": 3,
  "late": 2
}
```

**Implementation**:
```typescript
const summary = {
  present: 0,
  absent: 0,
  late: 0,
};

attendance.forEach((record: any) => {
  if (record.status === 'present') summary.present++;
  else if (record.status === 'absent') summary.absent++;
  else if (record.status === 'late') summary.late++;
});
```

---

## 🛡️ Error Handling

### Error Response Format

```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Invalid credentials |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Database/server error |

### Error Handling Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const body = await request.json();
    
    // 2. Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }
    
    // 3. Database operation
    const sql = getDb();
    const result = await sql`...`;
    
    // 4. Return success
    return NextResponse.json(result);
    
  } catch (error) {
    // 5. Log error
    console.error('Operation failed:', error);
    
    // 6. Return error response
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
```

---

## 🚀 Deployment Architecture

### Local Development

```
┌─────────────────────────────────────────────────────────────────┐
│ Local Machine (localhost:3000)                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Next.js Dev Server                                            │
│ • Hot Module Replacement                                        │
│ • API Routes run in Node.js                                     │
│ • Direct database connection to Neon                            │
└─────────────────────────────────────────────────────────────────┘
```

**Command**: `npm run dev`

---

### Production (Vercel)

```
┌─────────────────────────────────────────────────────────────────┐
│ Vercel Edge Network (yourapp.vercel.app)                        │
├─────────────────────────────────────────────────────────────────┤
│ • Static Pages (CDN)                                            │
│ • Serverless Functions (API Routes)                             │
│ • Auto-scaling                                                  │
│ • Global distribution                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Neon PostgreSQL (Cloud)                                         │
├─────────────────────────────────────────────────────────────────┤
│ • Same database for dev and prod                                │
│ • Connection pooling                                            │
│ • Auto-scaling                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment Process**:
1. Push code to GitHub
2. Vercel auto-detects changes
3. Builds Next.js app
4. Deploys serverless functions
5. Updates live site

---

## 🔒 Security Best Practices

### 1. Environment Variables
```typescript
// ✅ Good: Use environment variables
const dbUrl = process.env.DATABASE_URL;

// ❌ Bad: Hardcode credentials
const dbUrl = "postgresql://user:pass@host/db";
```

### 2. SQL Injection Prevention
```typescript
// ✅ Good: Parameterized queries
await sql`SELECT * FROM "Teacher" WHERE id = ${id}`;

// ❌ Bad: String concatenation
await sql`SELECT * FROM "Teacher" WHERE id = '${id}'`;
```

### 3. Input Validation
```typescript
// ✅ Good: Validate all inputs
if (!name || typeof name !== 'string' || name.length > 100) {
  return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
}

// ❌ Bad: Trust user input
const result = await sql`INSERT INTO "Teacher" (name) VALUES (${name})`;
```

### 4. Error Messages
```typescript
// ✅ Good: Generic error messages
return NextResponse.json({ error: 'Operation failed' }, { status: 500 });

// ❌ Bad: Expose internal details
return NextResponse.json({ error: error.stack }, { status: 500 });
```

---

## 📊 Performance Optimization

### 1. Database Connection Pooling
- Neon driver handles connection pooling automatically
- No need for manual connection management

### 2. Query Optimization
```typescript
// ✅ Good: Select only needed columns
await sql`SELECT id, name FROM "Teacher"`;

// ❌ Bad: Select all columns
await sql`SELECT * FROM "Teacher"`;
```

### 3. Parallel Queries
```typescript
// ✅ Good: Parallel execution
const [teachers, students] = await Promise.all([
  sql`SELECT * FROM "Teacher"`,
  sql`SELECT * FROM "Student"`
]);

// ❌ Bad: Sequential execution
const teachers = await sql`SELECT * FROM "Teacher"`;
const students = await sql`SELECT * FROM "Student"`;
```

### 4. Caching (Future Enhancement)
```typescript
// Cache frequently accessed data
const cache = new Map();

export async function GET() {
  if (cache.has('teachers')) {
    return NextResponse.json(cache.get('teachers'));
  }
  
  const teachers = await sql`SELECT * FROM "Teacher"`;
  cache.set('teachers', teachers);
  return NextResponse.json(teachers);
}
```

---

## 🧪 Testing

### Manual Testing with PowerShell

```powershell
# Test GET request
Invoke-RestMethod -Uri "http://localhost:3000/api/teachers" -Method Get

# Test POST request
$body = @{
  name = "John Smith"
  username = "johnsmith"
  password = "1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/teachers" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Testing with curl

```bash
# GET request
curl http://localhost:3000/api/teachers

# POST request
curl -X POST http://localhost:3000/api/teachers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","username":"johnsmith","password":"1234567890"}'
```

---

## 📚 Additional Resources

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [REST API Design](https://restfulapi.net/)
