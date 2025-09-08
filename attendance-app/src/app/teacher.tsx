"use client";
import { useMemo, useState } from "react";
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
  // Calendar logic
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);

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
            [studentId]: status,
          },
        },
      };
    });
  };

  // Calendar rendering (simple, not interactive)
  const renderCalendar = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const weeks: React.ReactElement[][] = [];
    let day = 1 - startDay;
    for (let w = 0; w < 6; w++) {
  const week: React.ReactElement[] = [];
      for (let d = 0; d < 7; d++, day++) {
        const dateObj = new Date(currentYear, currentMonth, day);
        const isCurrentMonth = dateObj.getMonth() === currentMonth;
        week.push(
          <td key={d} className="text-center">
            {isCurrentMonth && day > 0 && day <= daysInMonth ? (
              <button
                className={`w-8 h-8 rounded-full border-2 border-[#3A86FF] text-[#F1F1F1] bg-transparent hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition font-semibold ${
                  dateObj.toDateString() === selectedDate.toDateString()
                    ? "bg-[#3A86FF] text-[#F1F1F1]"
                    : ""
                }`}
                onClick={() => setSelectedDate(dateObj)}
              >
                {day}
              </button>
            ) : (
              <span className="w-8 h-8 inline-block" />
            )}
          </td>
        );
      }
      weeks.push(week);
    }
    return (
      <table className="w-full text-[#F1F1F1]">
        <thead>
          <tr>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <th key={d} className="py-1 text-xs font-semibold text-[#EAEAEA]">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>{week}</tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="flex justify-between items-start gap-8 flex-col md:flex-row">
        {/* Calendar Section */}
        <div className="bg-[#181F2A] rounded-2xl shadow-lg p-6 mb-8 md:mb-0 md:w-1/3 border border-[#3A86FF]/30">
          <h2 className="text-xl font-bold text-[#F1F1F1] mb-2">Select Date</h2>
          <div className="text-[#EAEAEA] mb-2 text-sm">Date for Attendance</div>
          <div className="bg-[#121212] rounded-xl p-4 border border-[#3A86FF]/20">
            <div className="flex items-center justify-between mb-2">
              <button
                className="px-2 py-1 border-2 border-[#3A86FF] rounded-lg text-[#3A86FF] bg-transparent hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              >
                &#60;
              </button>
              <span className="font-semibold text-[#F1F1F1]">
                {selectedDate.toLocaleString("default", { month: "long" })} {selectedDate.getFullYear()}
              </span>
              <button
                className="px-2 py-1 border-2 border-[#3A86FF] rounded-lg text-[#3A86FF] bg-transparent hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              >
                &#62;
              </button>
            </div>
            {renderCalendar()}
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-[#181F2A] rounded-2xl shadow-lg p-6 flex-1 border border-[#3A86FF]/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#F1F1F1]">Your Students - {selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h2>
            <span className="text-xs text-[#EAEAEA] px-3 py-1 rounded-full bg-[#3A86FF]/10">{myStudents.length} students assigned</span>
          </div>
          {myStudents.length === 0 ? (
            <p className="text-[#EAEAEA]">No students assigned.</p>
          ) : (
            <div className="space-y-4">
              {myStudents.map((s, idx) => {
                const current = myTodayMap[s.id] as AttendanceStatus | undefined;
                return (
                  <div key={s.id} className="flex items-center justify-between bg-[#121212] rounded-xl p-4 border border-[#3A86FF]/10">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3A86FF]/10 text-[#3A86FF] font-bold text-lg">{idx + 1}</span>
                      <div>
                        <div className="font-semibold text-[#F1F1F1]">{s.name}</div>
                        <div className="text-xs text-[#EAEAEA]">ID: {s.id}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(["present", "late", "absent"] as const).map((status) => (
                        <button
                          key={status}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-all duration-150
                            border-[#3A86FF] text-[#3A86FF] bg-transparent
                            hover:bg-[#3A86FF] hover:text-[#F1F1F1]
                            ${current === status ? "bg-[#3A86FF] text-[#F1F1F1]" : ""}`}
                          onClick={() => markAttendance(s.id, status)}
                        >
                          {status === "present" && <span className="mr-1">👨‍🎓</span>}
                          {status === "late" && <span className="mr-1">⏰</span>}
                          {status === "absent" && <span className="mr-1">❌</span>}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={goBack}
        className="absolute top-8 right-8 px-5 py-2 border-2 border-[#3A86FF] text-[#3A86FF] bg-transparent rounded-lg font-semibold hover:bg-[#3A86FF] hover:text-[#F1F1F1] transition shadow"
      >
        &#8592; Back to Login
      </button>
    </div>
  );
}