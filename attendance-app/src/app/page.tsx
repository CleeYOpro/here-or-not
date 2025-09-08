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
  const [currentTeacher, setCurrentTeacher] = useState<string | null>(
    null
  );

  // Global in-memory app state (persists while app is loaded)
  const [teachers, setTeachers] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [attendance, setAttendance] = useState<AttendanceMap>({});

  const goBack = () => {
    setRole(null);
    setCurrentTeacher(null);
  };

  if (role === "admin") {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D1B2A]">
      <h1 className="text-5xl font-bold mb-12 text-[#F1F1F1] drop-shadow-lg tracking-tight font-sans">ClassTrack</h1>

      <div className="flex gap-8">
        <button
          className="hs-button hs-button-primary px-10 py-5 rounded-xl shadow-lg bg-[#3A86FF] text-[#F1F1F1] font-semibold text-lg hover:bg-[#4361EE] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3A86FF]"
          onClick={() => setRole('admin')}
        >
          Admin
        </button>
        <button
          className="hs-button hs-button-primary px-10 py-5 rounded-xl shadow-lg bg-[#3A86FF] text-[#F1F1F1] font-semibold text-lg hover:bg-[#4361EE] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3A86FF]"
          onClick={() => setRole('teacher')}
        >
          Teacher
        </button>
      </div>

      {role === 'teacher' && (
        <div className="mt-10 flex flex-col items-center gap-3 animate-fadeIn">
          <h2 className="text-[#F1F1F1] font-semibold text-lg mb-2">Select Teacher:</h2>
          {teachers.length === 0 ? (
            <p className="text-[#EAEAEA]">No teachers added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              {teachers.map((t) => (
                <button
                  key={t}
                  className="hs-button hs-button-secondary px-6 py-3 rounded-lg bg-[#121212] text-[#3A86FF] font-medium hover:bg-[#1A263B] hover:text-[#4361EE] transition shadow"
                  onClick={() => setCurrentTeacher(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
