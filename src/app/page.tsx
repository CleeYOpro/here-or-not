"use client";
import { useState } from "react";
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

  // Admin login states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);

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
    } else {
      setError("Invalid username or password");
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
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-0">
      {/* Welcome and role selection */}
      {!role && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-10 py-16">
          <h1 className="text-4xl font-bold text-[#F1F1F1] mb-2">
            Hi, welcome to <span className="text-[#3A86FF]">rollCALL!</span>
          </h1>
          <div className="flex gap-6 mt-4">
            <button
              className="px-8 py-4 bg-[#3A86FF] text-[#F1F1F1] rounded-xl font-semibold text-lg shadow-lg hover:bg-[#4361EE] transition-colors duration-200"
              onClick={() => setRole("admin")}
            >
              Sign in as Admin
            </button>
            <button
              className="px-8 py-4 bg-[#181F2A] text-[#F1F1F1] rounded-xl font-semibold text-lg shadow-lg hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition-colors duration-200"
              onClick={() => setRole("teacher")}
            >
              Sign in as Teacher
            </button>
          </div>
        </div>
      )}

      {/* Admin login form */}
      {role === "admin" && !isAdminAuthed && (
        <div className="w-full max-w-md mx-auto bg-[#181F2A] rounded-2xl shadow-2xl p-10 flex flex-col gap-8">
          <div className="mb-2">
            <h2 className="text-3xl font-bold text-[#F1F1F1] mb-1">
              Welcome back
            </h2>
            <p className="text-[#EAEAEA] text-lg">Login to your admin account</p>
          </div>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-[#F1F1F1] font-semibold">
                Email
              </label>
              <input
                id="username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="px-4 py-3 rounded-lg bg-[#121212] text-[#F1F1F1] border border-[#333] focus:border-[#3A86FF] focus:outline-none text-lg placeholder-[#888]"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[#F1F1F1] font-semibold">
                  Password
                </label>
                <span className="text-[#EAEAEA] text-sm cursor-pointer hover:underline">
                  Forgot your password?
                </span>
              </div>
              <input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="px-4 py-3 rounded-lg bg-[#121212] text-[#F1F1F1] border border-[#333] focus:border-[#3A86FF] focus:outline-none text-lg placeholder-[#888]"
                placeholder="Enter password"
                required
              />
            </div>
            {error && <p className="text-[#ff4d4f] text-sm font-semibold">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#F1F1F1] text-[#121212] font-bold text-lg shadow hover:bg-[#EAEAEA] transition-colors duration-200"
            >
              Login
            </button>
            <button
              type="button"
              onClick={goBack}
              className="w-full py-3 rounded-xl bg-[#181F2A] text-[#F1F1F1] font-bold text-lg border border-[#3A86FF] shadow hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition-colors duration-200"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* Teacher selection */}
      {role === "teacher" && (
        <div className="w-full max-w-md mx-auto bg-[#181F2A] rounded-2xl shadow-2xl p-10 flex flex-col gap-8">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-[#F1F1F1] mb-1">Select Teacher</h2>
            <p className="text-[#EAEAEA] text-lg">Choose your name to continue</p>
          </div>
          {teachers.length === 0 ? (
            <p className="text-[#EAEAEA] text-center">No teachers added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {teachers.map((t) => (
                <button
                  key={t}
                  className="px-4 py-2 bg-[#3A86FF] text-[#F1F1F1] rounded-lg font-medium hover:bg-[#4361EE] transition-all duration-200"
                  onClick={() => setCurrentTeacher(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={goBack}
            className="w-full py-3 rounded-xl bg-[#181F2A] text-[#F1F1F1] font-bold text-lg border border-[#3A86FF] shadow hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition-colors duration-200"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
