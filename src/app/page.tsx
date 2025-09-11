"use client";
import { useState, useEffect } from "react";
import AdminDashboard from "./admin";
import TeacherDashboard from "./teacher";

// Shared types
export type AttendanceStatus = "present" | "absent" | "late";
export type Student = { id: string; name: string; standard?: string };
export type Teacher = { name: string; username: string; password: string };
export type Assignments = Record<string, string[]>; // teacher username -> [studentId]
export type AttendanceMap = Record<
  string, // teacher username
  Record<
    string, // YYYY-MM-DD date
    Record<string, AttendanceStatus> // studentId -> status
  >
>;

export default function LoginPage() {
  const [role, setRole] = useState<"admin" | "teacher" | null>(null);
  const [teacherLoginUsername, setTeacherLoginUsername] = useState("");
  const [teacherLoginPassword, setTeacherLoginPassword] = useState("");
  const [isTeacherAuthed, setIsTeacherAuthed] = useState(false);
  const [authedTeacher, setAuthedTeacher] = useState<Teacher | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "ClassTrack2025",
  };

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [attendance, setAttendance] = useState<AttendanceMap>({});

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const goBack = () => {
    setRole(null);
    setAdminUsername("");
    setAdminPassword("");
    setError("");
    setIsAdminAuthed(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminUsername === ADMIN_CREDENTIALS.username &&
      adminPassword === ADMIN_CREDENTIALS.password
    ) {
      setIsAdminAuthed(true);
      setError("");
      setToastMessage("Admin login successful");
    } else {
      setError("Invalid username or password");
      setToastMessage("Admin login failed");
    }
  };

  // Admin dashboard
  if (role === "admin" && isAdminAuthed) {
    return (
      <AdminDashboard
        goBack={goBack}
        teachers={teachers}
        setTeachers={setTeachers}
        students={students}
        setStudents={setStudents}
        assignments={assignments}
        setAssignments={setAssignments}
        attendance={attendance}
        setAttendance={setAttendance}
      />
    );
  }

  // Teacher dashboard
  if (role === "teacher" && authedTeacher && isTeacherAuthed) {
    return (
      <div className="min-h-screen bg-[#121212] p-4 sm:p-6">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setIsTeacherAuthed(false);
              setAuthedTeacher(null);
              setTeacherLoginUsername("");
              setTeacherLoginPassword("");
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
          teacher={authedTeacher.username}
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

      {/* Admin login */}
      {role === "admin" && !isAdminAuthed && (
        <div className="w-11/12 max-w-md mx-auto bg-[#1C1C1E] rounded-xl p-8 flex flex-col gap-6 shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Welcome back
            </h2>
            <p className="text-[#EAEAEA] text-lg">Login to your admin account</p>
          </div>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
            <input
              id="username"
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
              placeholder="admin@example.com"
              required
            />
            <input
              id="password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
              placeholder="Enter password"
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
        </div>
      )}

      {/* Teacher login */}
      {role === "teacher" && (
        <div className="w-11/12 max-w-md mx-auto bg-[#1C1C1E] rounded-xl p-8 flex flex-col gap-6 shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Teacher Login</h2>
            <p className="text-[#EAEAEA] text-lg">Enter your username and password</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const found = teachers.find(
                (t) => t.username === teacherLoginUsername && t.password === teacherLoginPassword
              );
              if (found) {
                setIsTeacherAuthed(true);
                setAuthedTeacher(found);
                setError("");
                setToastMessage("Teacher login successful");
              } else {
                setError("Invalid username or password");
                setToastMessage("Teacher login failed");
              }
            }}
            className="flex flex-col gap-4"
          >
            <input
              type="text"
              value={teacherLoginUsername}
              onChange={(e) => setTeacherLoginUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
              placeholder="Username"
              required
            />
            <input
              type="password"
              value={teacherLoginPassword}
              onChange={(e) => setTeacherLoginPassword(e.target.value)}
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
              onClick={() => setRole(null)}
              className="w-full px-6 py-3 rounded-xl bg-[#181F2A] text-white font-bold text-lg border border-[#3A86FF] shadow-lg hover:bg-[#3A86FF] hover:text-white transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
            >
              Back
            </button>
          </form>
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
