# Here or Not - Attendance Intelligence Suite

> **Empowering Education in Remote India**  
> An Attendance Intelligence Suite designed for underprivileged schools in remote areas of India, where connectivity is limited but the need for reliable education tracking is critical.

---

## 🌟 Mission

**Here or Not** bridges the digital divide by providing a robust, mobile-first attendance management system that works seamlessly even in low-connectivity environments. Built with serverless architecture, this full-stack application scales effortlessly to serve schools across remote regions, ensuring that every student's presence is tracked, every teacher is empowered, and every administrator has the insights they need.

### Why This Matters

In remote India, many schools face challenges:
- 📶 **Limited Internet Connectivity** - Intermittent or slow connections
- 📱 **Mobile-First Access** - Teachers primarily use smartphones
- 💰 **Budget Constraints** - Need for cost-effective, scalable solutions
- 📊 **Data-Driven Insights** - Tracking attendance to improve educational outcomes

**Here or Not** addresses these challenges with:
- ⚡ **Serverless Architecture** - Zero infrastructure costs, infinite scalability
- 🌐 **Offline-First Design** - Works in low-connectivity environments
- 📱 **Mobile-Optimized UI** - Responsive design for smartphones and tablets
- ☁️ **Cloud-Native** - Reliable data persistence with global accessibility

---

## 📋 Table of Contents

- [Mission](#mission)
- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## 🎯 System Overview

**Here or Not** is a serverless attendance intelligence suite that enables:
- **Admins** to manage teachers and students, view attendance reports, and gain insights
- **Teachers** to mark attendance for their assigned students using mobile devices
- **Real-time data persistence** using cloud PostgreSQL database
- **Scalable architecture** using Next.js serverless functions that auto-scale with demand

### Key Features
- ✅ Role-based authentication (Admin/Teacher)
- ✅ CRUD operations for teachers and students
- ✅ Daily attendance tracking (Present/Absent/Late)
- ✅ Bulk student import via CSV
- ✅ Attendance summaries and reports
- ✅ Responsive UI with real-time updates

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.2 | React framework with server-side rendering |
| **React** | 19.1.0 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **React Icons** | 5.5.0 | Icon library |
| **Recharts** | 3.1.2 | Data visualization charts |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.5.2 | Serverless backend functions |
| **Neon Serverless** | 1.0.2 | PostgreSQL database driver |
| **Prisma** | 6.17.1 | Database ORM and schema management |
| **PostgreSQL** | Latest | Relational database (hosted on Neon) |

### Development Tools
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and quality |
| **tsx** | TypeScript execution for scripts |
| **Prisma Studio** | Database GUI |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Neon account (free tier available at https://neon.tech)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd here-or-not
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example file
cp env.example .env.local

# Edit .env.local with your Neon database URL
DATABASE_URL="postgresql://username:password@ep-something.region.neon.tech/dbname?sslmode=require"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"
```

4. **Push database schema**
```bash
npm run db:push
```

5. **Run development server**
```bash
npm run dev
```

6. **Open browser**
```
http://localhost:3000
```

---

## 📚 Documentation

For detailed documentation, see:

- **[DATABASE.md](docs/DATABASE.md)** - Complete database architecture, schema, and relationships
- **[BACKEND.md](docs/BACKEND.md)** - Backend API architecture and endpoints
- **[API.md](docs/API.md)** - Complete API reference with examples
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow

---

## 📁 Project Structure

```
here-or-not/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── seed.ts                # Database seeding script
│
├── src/
│   ├── app/
│   │   ├── api/               # Backend API routes
│   │   │   ├── auth/
│   │   │   │   ├── admin/route.ts      # Admin authentication
│   │   │   │   └── teacher/route.ts    # Teacher authentication
│   │   │   ├── teachers/route.ts       # Teacher CRUD operations
│   │   │   ├── students/
│   │   │   │   ├── route.ts            # Student CRUD operations
│   │   │   │   └── bulk/route.ts       # Bulk student import
│   │   │   └── attendance/
│   │   │       ├── route.ts            # Attendance CRUD operations
│   │   │       ├── summary/route.ts    # Daily attendance summary
│   │   │       └── student/route.ts    # Student attendance history
│   │   │
│   │   ├── page.tsx           # Landing/Login page
│   │   ├── admin/page.tsx     # Admin dashboard
│   │   └── teacher/page.tsx   # Teacher dashboard
│   │
│   └── lib/
│       ├── db.ts              # Database connection (Neon)
│       └── prisma.ts          # Prisma client singleton
│
├── docs/                      # Detailed documentation
│   ├── DATABASE.md
│   ├── BACKEND.md
│   └── API.md
│
├── .env.local                 # Environment variables (create this)
├── env.example                # Environment template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # This file
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Database
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client types
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:seed      # Seed database with test data

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@ep-something.region.neon.tech/dbname?sslmode=require"

# Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"
```

**Important**: Never commit `.env.local` to version control!

---

## 🗄️ Database Overview

### Tables

1. **Admin** - Administrator credentials
2. **Teacher** - Teacher information and credentials
3. **Student** - Student information and teacher assignments
4. **Attendance** - Daily attendance records

### Relationships

```
Admin (standalone)

Teacher (1) ──┬── (N) Student
              └── (N) Attendance
                       │
Student (1) ───────── (N) Attendance
```

For detailed database documentation, see [DATABASE.md](docs/DATABASE.md)

---

## 🌐 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables on Vercel

Add these in Project Settings → Environment Variables:
- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

---

## 📊 Features

### Admin Dashboard
- View all teachers and students
- Add/edit/delete teachers
- Add/edit/delete students
- Bulk import students from CSV
- View attendance reports and statistics
- Daily attendance summary

### Teacher Dashboard
- View assigned students
- Mark attendance (Present/Absent/Late)
- View attendance history
- Update attendance records
- Filter by date

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions:
- Check the [documentation](docs/)
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Open an issue on GitHub

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
