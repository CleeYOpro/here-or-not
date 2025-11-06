"use client";
import { useState, useEffect } from "react";
import AdminDashboard from "./admin";
import TeacherDashboard from "./teacher";

// Shared types
export type AttendanceStatus = "present" | "absent" | "late";
export type Student = { id: string; name: string; standard?: string; classId?: string; schoolId: string };
export type School = { id: string; name: string; email: string };
export type Class = { id: string; name: string; schoolId: string };
export type ClassAssignments = Record<string, string[]>; // classId -> [studentId]
export type AttendanceMap = Record<
  string, // classId
  Record<
    string, // YYYY-MM-DD date
    Record<string, AttendanceStatus> // studentId -> status
  >
>;

export default function LoginPage() {
  const [role, setRole] = useState<"admin" | "teacher" | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPassword, setSchoolPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignments>({});
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(false);

  // Fetch schools on mount
  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch('/api/schools');
        const data = await res.json();
        // Ensure data is an array before setting
        if (Array.isArray(data)) {
          setSchools(data);
        } else {
          console.error('Schools API did not return an array:', data);
          setSchools([]);
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setSchools([]);
      }
    }
    fetchSchools();
  }, []);

  // Fetch school data when authenticated
  useEffect(() => {
    if (!isAuthed || !selectedSchool) return;
    
    async function fetchSchoolData() {
      if (!selectedSchool) return; // Guard clause for TypeScript
      
      try {
        setLoading(true);
        
        // Fetch classes for this school
        const classesRes = await fetch(`/api/classes?schoolId=${selectedSchool.id}`);
        const classesData = await classesRes.json();
        setClasses(classesData);
        
        // Fetch students for this school
        const studentsRes = await fetch(`/api/students?schoolId=${selectedSchool.id}`);
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
        
        // Build assignments from students data (classId -> studentIds)
        const assignmentsMap: ClassAssignments = {};
        studentsData.forEach((student: any) => {
          if (student.classId) {
            if (!assignmentsMap[student.classId]) {
              assignmentsMap[student.classId] = [];
            }
            assignmentsMap[student.classId].push(student.id);
          }
        });
        setAssignments(assignmentsMap);
        
        // Fetch attendance for this school
        const attendanceRes = await fetch(`/api/attendance?schoolId=${selectedSchool.id}`);
        const attendanceData = await attendanceRes.json();
        
        // Build attendance map (classId -> date -> studentId -> status)
        const attendanceMap: AttendanceMap = {};
        attendanceData.forEach((record: any) => {
          const classId = record.classId;
          if (classId) {
            if (!attendanceMap[classId]) {
              attendanceMap[classId] = {};
            }
            if (!attendanceMap[classId][record.date]) {
              attendanceMap[classId][record.date] = {};
            }
            attendanceMap[classId][record.date][record.studentId] = record.status;
          }
        });
        setAttendance(attendanceMap);
        
      } catch (error) {
        console.error('Failed to fetch school data:', error);
        setToastMessage('Failed to load school data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSchoolData();
  }, [isAuthed, selectedSchool]);
  
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const goBack = () => {
    setRole(null);
    setSelectedSchool(null);
    setSchoolEmail("");
    setSchoolPassword("");
    setError("");
    setIsAuthed(false);
    setSelectedClass(null);
    setAvailableClasses([]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSchool) {
      setError("Please select a school");
      return;
    }

    try {
      const endpoint = role === "admin" ? '/api/auth/admin' : '/api/auth/teacher';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchool.id,
          email: schoolEmail,
          password: schoolPassword,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setIsAuthed(true);
        setError("");
        
        if (role === "teacher" && data.classes) {
          setAvailableClasses(data.classes);
        }
        
        setToastMessage(`${role === "admin" ? "Admin" : "Teacher"} login successful`);
      } else {
        setError(data.error || "Invalid credentials");
        setToastMessage("Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Login failed");
      setToastMessage("Login failed");
    }
  };

  // Admin dashboard
  if (role === "admin" && isAuthed && selectedSchool) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      );
    }
    return (
      <AdminDashboard
        goBack={goBack}
        school={selectedSchool}
        classes={classes}
        setClasses={setClasses}
        students={students}
        setStudents={setStudents}
        assignments={assignments}
        setAssignments={setAssignments}
        attendance={attendance}
        setAttendance={setAttendance}
      />
    );
  }

  // Teacher class selection
  if (role === "teacher" && isAuthed && !selectedClass) {
    if (!availableClasses || availableClasses.length === 0) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6">
          <div className="w-11/12 max-w-md mx-auto bg-[#1C1C1E] rounded-xl p-8 flex flex-col gap-6 shadow-lg">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                No Classes Available
              </h2>
              <p className="text-[#EAEAEA] text-lg">There are no classes set up for this school yet. Please contact your administrator.</p>
            </div>
            <button
              onClick={goBack}
              className="w-full px-6 py-3 rounded-xl bg-[#181F2A] text-white font-bold text-lg border border-[#3A86FF] shadow-lg hover:bg-[#3A86FF] hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
            >
              Back
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6">
        <div className="w-11/12 max-w-md mx-auto bg-[#1C1C1E] rounded-xl p-8 flex flex-col gap-6 shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Select Your Class
            </h2>
            <p className="text-[#EAEAEA] text-lg">Choose a class to take attendance</p>
          </div>
          <div className="flex flex-col gap-3">
            {availableClasses.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(cls);
                  setToastMessage(`Selected ${cls.name}`);
                }}
                className="w-full px-6 py-4 rounded-xl bg-[#121212] text-white border border-[#333] hover:border-[#3A86FF] hover:bg-[#3A86FF]/10 transition-colors duration-200 text-left font-semibold text-lg focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              >
                {cls.name}
              </button>
            ))}
          </div>
          <button
            onClick={goBack}
            className="w-full px-6 py-3 rounded-xl bg-[#181F2A] text-white font-bold text-lg border border-[#3A86FF] shadow-lg hover:bg-[#3A86FF] hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Teacher dashboard
  if (role === "teacher" && isAuthed && selectedClass && selectedSchool) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#121212] p-4 sm:p-6">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setIsAuthed(false);
              setSelectedClass(null);
              setAvailableClasses([]);
              setSchoolEmail("");
              setSchoolPassword("");
              setError("");
              setRole(null);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#D32F2F] text-white font-bold text-lg shadow-lg hover:scale-105 hover:from-[#FF7F7F] hover:to-[#C62828] transition-transform duration-200 focus:ring-4 focus:ring-[#FF6B6B] focus:outline-none"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
        <TeacherDashboard
          className={selectedClass.name}
          classId={selectedClass.id}
          schoolId={selectedSchool.id}
          goBack={goBack}
          students={students}
          assignments={assignments}
          attendance={attendance}
          setAttendance={setAttendance}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 bg-gradient-to-r from-[#3A86FF] to-[#4361EE] text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in font-semibold"
          role="alert"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      {/* Role selection */}
      {!role && (
        <div className="w-11/12 max-w-2xl mx-auto flex flex-col items-center justify-center gap-12 py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center">
            Hi, welcome to <span className="text-[#3A86FF]">rolecaller!</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-6 py-3 bg-[#3A86FF] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#4361EE] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              onClick={() => setRole("admin")}
              aria-label="Sign in as Admin"
            >
              Sign in as Admin
            </button>
            <button
              className="w-full sm:w-auto px-6 py-3 bg-[#181F2A] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#3A86FF] hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              onClick={() => setRole("teacher")}
              aria-label="Sign in as Teacher"
            >
              Sign in as Teacher
            </button>
          </div>
        </div>
      )}

      {/* Login form (both admin and teacher) */}
      {role && !isAuthed && (
        <div className="w-11/12 max-w-md mx-auto bg-[#1C1C1E] rounded-xl p-8 flex flex-col gap-6 shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {role === "admin" ? "Admin Login" : "Teacher Login"}
            </h2>
            <p className="text-[#EAEAEA] text-lg">Login with school credentials</p>
          </div>
          
          {schools.length === 0 ? (
            <>
              <div className="p-4 bg-[#451A1A] border border-[#D32F2F] rounded-lg">
                <p className="text-[#ff4d4f] font-semibold mb-2">No schools found</p>
                <p className="text-[#EAEAEA] text-sm">
                  Please create a school first. You can use the API or database directly:
                </p>
                <code className="block mt-2 p-2 bg-[#121212] rounded text-xs text-[#3A86FF] overflow-x-auto">
                  POST /api/schools {`{name, email, password}`}
                </code>
              </div>
              <button
                type="button"
                onClick={goBack}
                className="w-full px-6 py-3 rounded-xl bg-[#181F2A] text-white font-bold text-lg border border-[#3A86FF] shadow-lg hover:bg-[#3A86FF] hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              >
                Back
              </button>
            </>
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <select
                value={selectedSchool?.id || ""}
                onChange={(e) => {
                  const school = schools.find(s => s.id === e.target.value);
                  setSelectedSchool(school || null);
                  if (school) {
                    setSchoolEmail(school.email);
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base"
                required
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            <input
              type="email"
              value={schoolEmail}
              onChange={(e) => setSchoolEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
              placeholder="School email"
              required
            />
            <input
              type="password"
              value={schoolPassword}
              onChange={(e) => setSchoolPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
              placeholder="Password"
              required
            />
            {error && (
              <p className="text-[#ff4d4f] font-semibold bg-[#451A1A] px-3 py-2 rounded-lg" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-[#3A86FF] text-white font-bold text-lg shadow-lg hover:bg-[#4361EE] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
            >
              Login
            </button>
            <button
              type="button"
              onClick={goBack}
              className="w-full px-6 py-3 rounded-xl bg-[#181F2A] text-white font-bold text-lg border border-[#3A86FF] shadow-lg hover:bg-[#3A86FF] hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
            >
              Back
            </button>
          </form>
          )}
        </div>
      )}

      {/* Toast animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
