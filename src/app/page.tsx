"use client";
import { useState, useEffect } from "react";
import AdminDashboard from "./admin";
import TeacherDashboard from "./teacher";

// Shared types
export type AttendanceStatus = "present" | "absent" | "late";
export type Student = { id: string; name: string; standard?: string };
export type Assignments = Record<string, string[]>; // teacher -> [studentId]
export type AttendanceMap = Record<
  string, // teacher
  Record<
    string, // YYYY-MM-DD date
    Record<string, AttendanceStatus> // studentId -> status
  >
>;

export default function LoginPage() {
  const [role, setRole] = useState<"admin" | "teacher" | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hardcoded admin credentials
  const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "ClassTrack2025",
  };

  // Global in-memory app state
  const [teachers, setTeachers] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [attendance, setAttendance] = useState<AttendanceMap>({});

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const goBack = () => {
    setRole(null);
    setCurrentTeacher(null);
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

  // Render admin dashboard if logged in
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

  // Render teacher dashboard if teacher selected
  if (role === "teacher" && currentTeacher) {
    return (
      <TeacherDashboard
        teacher={currentTeacher}
        goBack={goBack}
        students={students}
        assignments={assignments}
        attendance={attendance}
        setAttendance={setAttendance}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 bg-[#3A86FF] text-[#F1F1F1] px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in"
          role="alert"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      {/* Welcome and role selection */}
      {!role && (
        <div className="w-11/12 max-w-2xl mx-auto flex flex-col items-center justify-center gap-12 py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F1F1F1] text-center">
            Hi, welcome to <span className="text-[#3A86FF]">rolecaller!</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-6 py-3 bg-[#3A86FF] text-[#F1F1F1] rounded-lg font-semibold text-lg shadow-lg hover:bg-[#4361EE] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              onClick={() => setRole("admin")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setRole("admin");
                }
              }}
              aria-label="Sign in as Admin"
            >
              Sign in as Admin
            </button>
            <button
              className="w-full sm:w-auto px-6 py-3 bg-[#181F2A] text-[#F1F1F1] rounded-lg font-semibold text-lg shadow-lg hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              onClick={() => setRole("teacher")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setRole("teacher");
                }
              }}
              aria-label="Sign in as Teacher"
            >
              Sign in as Teacher
            </button>
          </div>
        </div>
      )}

      {/* Admin login form */}
      {role === "admin" && !isAdminAuthed && (
        <div className="w-11/12 max-w-md mx-auto bg-[#181F2A] rounded-xl p-8 flex flex-col gap-8 shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F1F1] mb-1">
              Welcome back
            </h2>
            <p className="text-[#EAEAEA] text-xl">Login to your admin account</p>
          </div>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-[#F1F1F1] font-semibold">
                Email
              </label>
              <input
                id="username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#121212] text-[#F1F1F1] border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
                placeholder="admin@example.com"
                required
                aria-describedby={error ? "username-error" : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[#F1F1F1] font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[#EAEAEA] text-sm hover:underline focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
                  onClick={() => alert("Password reset not implemented")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      alert("Password reset not implemented");
                    }
                  }}
                  role="button"
                  aria-label="Forgot your password"
                >
                  Forgot your password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#121212] text-[#F1F1F1] border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none text-base placeholder-[#888]"
                placeholder="Enter password"
                required
                aria-describedby={error ? "password-error" : undefined}
              />
            </div>
            {error && (
              <p
                id="login-error"
                className="text-base text-[#ff4d4f] font-semibold bg-[#451A1A] px-3 py-2 rounded-lg"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg bg-[#F1F1F1] text-[#121212] font-bold text-lg shadow hover:bg-[#EAEAEA] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              aria-label="Submit admin login"
            >
              Login
            </button>
            <button
              type="button"
              onClick={goBack}
              className="w-full px-6 py-3 rounded-lg bg-[#181F2A] text-[#F1F1F1] font-bold text-lg border border-[#3A86FF] shadow hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              aria-label="Back to role selection"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* Teacher selection */}
      {role === "teacher" && (
        <div className="w-11/12 max-w-md mx-auto bg-[#181F2A] rounded-xl p-8 flex flex-col gap-8 shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F1F1] mb-1">
              Select Teacher
            </h2>
            <p className="text-[#EAEAEA] text-xl">Choose your name to continue</p>
          </div>
          {teachers.length === 0 ? (
            <p className="text-[#EAEAEA] text-center text-base">No teachers added yet.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto flex flex-wrap gap-3 justify-center">
              {teachers.map((t) => (
                <button
                  key={t}
                  className="px-6 py-3 bg-[#3A86FF] text-[#F1F1F1] rounded-lg font-medium text-base hover:bg-[#4361EE] transition-all duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
                  onClick={() => {
                    setCurrentTeacher(t);
                    setToastMessage(`Selected teacher: ${t}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCurrentTeacher(t);
                      setToastMessage(`Selected teacher: ${t}`);
                    }
                  }}
                  aria-label={`Select teacher ${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={goBack}
            className="w-full px-6 py-3 rounded-lg bg-[#181F2A] text-[#F1F1F1] font-bold text-lg border border-[#3A86FF] shadow hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
            aria-label="Back to role selection"
          >
            Back
          </button>
        </div>
      )}

      {/* Inline CSS for toast animation */}
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
