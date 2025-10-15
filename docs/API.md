# API Reference Documentation

Complete API endpoint reference for the Here or Not attendance management system.

---

## Base URL

**Development**: `http://localhost:3000`  
**Production**: `https://your-app.vercel.app`

---

## Authentication Endpoints

### Admin Login

**POST** `/api/auth/admin`

Authenticate admin user.

**Request Body**:
```json
{
  "username": "admin",
  "password": "secure_password"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### Teacher Login

**POST** `/api/auth/teacher`

Authenticate teacher user.

**Request Body**:
```json
{
  "username": "johnsmith",
  "password": "1234567890"
}
```

**Success Response** (200):
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

**Error Response** (401):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## Teacher Management

### Get All Teachers

**GET** `/api/teachers`

Fetch all teachers.

**Response** (200):
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

### Create Teacher

**POST** `/api/teachers`

Create a new teacher.

**Request Body**:
```json
{
  "name": "John Smith",
  "username": "johnsmith",
  "password": "1234567890"
}
```

**Success Response** (200):
```json
{
  "id": "clxyz456def",
  "name": "John Smith",
  "username": "johnsmith",
  "password": "1234567890"
}
```

**Error Response** (400):
```json
{
  "error": "Teacher with this username already exists"
}
```

---

### Update Teacher

**PUT** `/api/teachers`

Update existing teacher.

**Request Body**:
```json
{
  "id": "clxyz456def",
  "name": "John Smith Updated",
  "username": "johnsmith"
}
```

**Success Response** (200):
```json
{
  "id": "clxyz456def",
  "name": "John Smith Updated",
  "username": "johnsmith",
  "password": "1234567890"
}
```

---

### Delete Teacher

**DELETE** `/api/teachers?id=clxyz456def`

Delete a teacher.

**Query Parameters**:
- `id` (required) - Teacher ID

**Success Response** (200):
```json
{
  "success": true
}
```

---

## Student Management

### Get All Students

**GET** `/api/students`

Fetch all students with teacher information.

**Response** (200):
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

### Create Student

**POST** `/api/students`

Create a new student.

**Request Body**:
```json
{
  "id": "12345",
  "name": "Alice Johnson",
  "standard": "10th Grade",
  "teacherId": "clxyz456def"
}
```

**Success Response** (200):
```json
{
  "id": "12345",
  "name": "Alice Johnson",
  "standard": "10th Grade",
  "teacherId": "clxyz456def"
}
```

**Error Response** (400):
```json
{
  "error": "Student with this ID already exists"
}
```

---

### Update Student

**PUT** `/api/students`

Update existing student.

**Request Body**:
```json
{
  "id": "12345",
  "newId": "12345",
  "name": "Alice Johnson Updated",
  "standard": "11th Grade",
  "teacherId": "clxyz456def"
}
```

**Success Response** (200):
```json
{
  "id": "12345",
  "name": "Alice Johnson Updated",
  "standard": "11th Grade",
  "teacherId": "clxyz456def"
}
```

---

### Delete Student

**DELETE** `/api/students?id=12345`

Delete a student.

**Query Parameters**:
- `id` (required) - Student ID

**Success Response** (200):
```json
{
  "success": true
}
```

---

### Bulk Import Students

**POST** `/api/students/bulk`

Import multiple students from CSV.

**Request Body**:
```json
{
  "students": [
    {
      "id": "12345",
      "name": "Alice Johnson",
      "standard": "10th Grade",
      "teacherUsername": "johnsmith"
    },
    {
      "id": "12346",
      "name": "Bob Williams",
      "standard": "10th Grade",
      "teacherUsername": "johnsmith"
    }
  ]
}
```

**Success Response** (200):
```json
{
  "success": true,
  "created": 2,
  "errors": []
}
```

---

## Attendance Management

### Get Attendance Records

**GET** `/api/attendance`

Query attendance records with optional filters.

**Query Parameters** (all optional):
- `teacherId` - Filter by teacher
- `studentId` - Filter by student
- `date` - Filter by date (YYYY-MM-DD)

**Examples**:
```
GET /api/attendance?teacherId=clxyz456def&date=2025-10-14
GET /api/attendance?studentId=12345
GET /api/attendance?date=2025-10-14
GET /api/attendance
```

**Response** (200):
```json
[
  {
    "id": "clxyz111aaa",
    "date": "2025-10-14",
    "status": "present",
    "studentId": "12345",
    "teacherId": "clxyz456def",
    "student": {
      "id": "12345",
      "name": "Alice Johnson",
      "standard": "10th Grade"
    },
    "teacher": {
      "id": "clxyz456def",
      "name": "John Smith",
      "username": "johnsmith"
    }
  }
]
```

---

### Mark Attendance

**POST** `/api/attendance`

Mark or update attendance for a student.

**Request Body**:
```json
{
  "teacherId": "clxyz456def",
  "studentId": "12345",
  "date": "2025-10-14",
  "status": "present"
}
```

**Status Values**:
- `"present"` - Student is present
- `"absent"` - Student is absent
- `"late"` - Student arrived late

**Success Response** (200):
```json
{
  "id": "clxyz111aaa",
  "date": "2025-10-14",
  "status": "present",
  "studentId": "12345",
  "teacherId": "clxyz456def"
}
```

**Error Response** (400):
```json
{
  "error": "Missing required fields"
}
```

**Note**: If attendance already exists for the same teacher, student, and date, it will be updated. Otherwise, a new record is created.

---

### Delete Attendance

**DELETE** `/api/attendance?id=clxyz111aaa`

Delete an attendance record.

**Query Parameters**:
- `id` (required) - Attendance record ID

**Success Response** (200):
```json
{
  "success": true
}
```

---

### Get Attendance Summary

**GET** `/api/attendance/summary`

Get daily attendance summary statistics.

**Query Parameters**:
- `date` (optional) - Date to summarize (YYYY-MM-DD). Defaults to today.

**Example**:
```
GET /api/attendance/summary?date=2025-10-14
```

**Response** (200):
```json
{
  "present": 15,
  "absent": 3,
  "late": 2
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
Missing or invalid parameters.

```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
Invalid authentication credentials.

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 404 Not Found
Resource not found.

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
Server or database error.

```json
{
  "error": "Failed to fetch data"
}
```

---

## Testing Examples

### Using PowerShell

```powershell
# Get all teachers
Invoke-RestMethod -Uri "http://localhost:3000/api/teachers" -Method Get

# Create teacher
$body = @{
  name = "John Smith"
  username = "johnsmith"
  password = "1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/teachers" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

# Mark attendance
$attendance = @{
  teacherId = "clxyz456def"
  studentId = "12345"
  date = "2025-10-14"
  status = "present"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/attendance" `
  -Method Post `
  -ContentType "application/json" `
  -Body $attendance
```

### Using curl

```bash
# Get all students
curl http://localhost:3000/api/students

# Create student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"id":"12345","name":"Alice Johnson","standard":"10th Grade","teacherId":"clxyz456def"}'

# Get attendance summary
curl "http://localhost:3000/api/attendance/summary?date=2025-10-14"
```

---

## Rate Limits

Currently no rate limits are enforced. In production, consider implementing rate limiting to prevent abuse.

---

## Versioning

Current API version: **v1** (implicit, no version in URL)

Future versions may use URL versioning:
- `/api/v1/teachers`
- `/api/v2/teachers`

---

## Additional Resources

- [Backend Architecture](BACKEND.md)
- [Database Schema](DATABASE.md)
- [Main README](../README.md)
