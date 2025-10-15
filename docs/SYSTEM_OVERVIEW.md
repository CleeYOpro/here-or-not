# System Overview - Here or Not

Quick reference guide showing how all components work together.

---

## 🎯 System Summary

**Here or Not** is a full-stack attendance management system with:
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL (Neon Cloud)
- **Deployment**: Vercel

---

## 📊 Complete System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                                                                  │
│  Admin Dashboard              Teacher Dashboard                 │
│  ├─ Manage Teachers           ├─ View Students                  │
│  ├─ Manage Students           ├─ Mark Attendance                │
│  ├─ View Reports              └─ View History                   │
│  └─ Bulk Import                                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ fetch() / HTTP Requests
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                        API ROUTES                                │
│                                                                  │
│  /api/auth/*          /api/teachers      /api/students          │
│  /api/attendance      /api/attendance/summary                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ SQL Queries (Neon Driver)
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                           │
│                                                                  │
│  Admin → Teacher → Student → Attendance                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **Admin** | Admin credentials | username, password |
| **Teacher** | Teacher info & login | name, username, password |
| **Student** | Student info | id (5-digit), name, standard, teacherId |
| **Attendance** | Daily records | date, status, studentId, teacherId |

**Relationships**:
- Teacher → Student (1:N)
- Teacher → Attendance (1:N)
- Student → Attendance (1:N)

---

## 🔌 API Endpoints Summary

### Authentication
- `POST /api/auth/admin` - Admin login
- `POST /api/auth/teacher` - Teacher login

### Teachers
- `GET /api/teachers` - List all
- `POST /api/teachers` - Create
- `PUT /api/teachers` - Update
- `DELETE /api/teachers` - Delete

### Students
- `GET /api/students` - List all
- `POST /api/students` - Create
- `PUT /api/students` - Update
- `DELETE /api/students` - Delete
- `POST /api/students/bulk` - Bulk import

### Attendance
- `GET /api/attendance` - Query records
- `POST /api/attendance` - Mark/update
- `DELETE /api/attendance` - Delete
- `GET /api/attendance/summary` - Daily stats

---

## 📁 Project Structure

```
here-or-not/
├── src/app/api/          # Backend API routes
├── src/lib/              # Database connection
├── prisma/               # Database schema
├── docs/                 # Documentation
└── package.json          # Dependencies
```

---

## 🚀 Quick Commands

```bash
npm run dev              # Start dev server
npm run db:push          # Update database schema
npm run db:studio        # Open database GUI
npm run build            # Build for production
```

---

## 📚 Full Documentation

- **[README.md](../README.md)** - Getting started
- **[DATABASE.md](DATABASE.md)** - Database architecture
- **[BACKEND.md](BACKEND.md)** - Backend architecture
- **[API.md](API.md)** - API reference
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - System design
