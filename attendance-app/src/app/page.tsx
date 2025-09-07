"use client";
import { useState } from "react";
import AdminDashboard from "./admin";
import TeacherDashboard from "./teacher";

// Shared types
export type AttendanceStatus = "present" | "absent" | "late";
export type Student = { id: string; name: string };
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-green-400">
      <h1 className="text-4xl font-bold mb-10 text-white drop-shadow">ClassTrack</h1>

      <div className="flex gap-8">
        <button
          className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-blue-100 transition"
          onClick={() => setRole("admin")}
        >
          Admin
        </button>
        <button
          className="px-8 py-4 bg-white text-green-600 font-semibold rounded-lg shadow-lg hover:bg-green-100 transition"
          onClick={() => setRole("teacher")}
        >
          Teacher
        </button>
      </div>

      {role === "teacher" && (
        <div className="mt-8 flex flex-col items-center gap-2 animate-[fadeIn_200ms_ease-in]">
          <h2 className="text-white font-semibold">Select Teacher:</h2>
          {teachers.length === 0 ? (
            <p className="text-white">No teachers added yet.</p>
          ) : (
            teachers.map((t) => (
              <button
                key={t}
                className="px-6 py-2 bg-white text-green-600 rounded hover:bg-green-100 transition shadow"
                onClick={() => setCurrentTeacher(t)}
              >
                {t}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
