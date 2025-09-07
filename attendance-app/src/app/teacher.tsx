"use client";
import { useMemo } from "react";
import type {
  AttendanceMap,
  Assignments,
  AttendanceStatus,
  Student,
} from "./page";

interface TeacherProps {
  teacher: string;
  goBack: () => void;
  students: Student[];
  assignments: Assignments;
  attendance: AttendanceMap;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceMap>>;
}

export default function TeacherDashboard({
  teacher,
  goBack,
  students,
  assignments,
  attendance,
  setAttendance,
}: TeacherProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []); // YYYY-MM-DD

  const assignedIds = new Set(assignments[teacher] ?? []);
  const myStudents = students.filter((s) => assignedIds.has(s.id));

  const myTodayMap = attendance[teacher]?.[today] ?? {};

  const markAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const teacherMap = prev[teacher] ?? {};
      const dateMap = teacherMap[today] ?? {};
      return {
        ...prev,
        [teacher]: {
          ...teacherMap,
          [today]: {
            ...dateMap,
            [studentId]: status, // one record per student per day
          },
        },
      };
    });
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <button
        onClick={goBack}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to Login
      </button>

      <h1 className="text-3xl font-bold mb-2">Teacher Dashboard: {teacher}</h1>
      <div className="text-sm text-gray-600 mb-6">Date: {today}</div>

      {myStudents.length === 0 ? (
        <p className="text-gray-700">No students assigned.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fadeIn_200ms_ease-in]">
          {myStudents.map((s) => {
            const current = myTodayMap[s.id] as AttendanceStatus | undefined;
            return (
              <div
                key={s.id}
                className="p-4 bg-white rounded shadow flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">ID: {s.id}</div>
                </div>
                <div className="flex gap-2">
                  {(["present", "absent", "late"] as const).map((status) => (
                    <button
                      key={status}
                      className={`px-2 py-1 rounded transition ${
                        current === status
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      onClick={() => markAttendance(s.id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}