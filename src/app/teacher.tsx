
"use client";
import { useMemo, useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { BiUserCheck, BiUserX } from "react-icons/bi";
import { LiaUserClockSolid } from "react-icons/lia";
import type { AttendanceMap, Assignments, AttendanceStatus, Student } from "./page";

interface TeacherProps {
  teacher: string;
  teacherId: string;
  goBack: () => void;
  students: Student[];
  assignments: Assignments;
  attendance: AttendanceMap;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceMap>>;
}

export default function TeacherDashboard({
  teacher,
  teacherId,
  goBack,
  students,
  assignments,
  attendance,
  setAttendance,
}: TeacherProps) {
  // Calendar logic
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const assignedIds = new Set(assignments[teacher] ?? []);
  const myStudents = students.filter((s) => assignedIds.has(s.id));
  const myTodayMap = attendance[teacher]?.[today] ?? {};

  const markAttendance = async (studentId: string, status: AttendanceStatus) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          studentId,
          date: today,
          status,
        }),
      });
      
      if (res.ok) {
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
        setToastMessage(`Attendance marked as ${status}`);
      } else {
        setToastMessage('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setToastMessage('Error marking attendance');
    }
  };

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Calendar logic for grid
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div className="min-h-screen bg-[#121212] p-4 sm:p-6 text-[#EAEAEA] font-sans">
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

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F1F1]">
            Teacher Dashboard
          </h1>
          <div className="text-base text-[#D1D1D1] mt-1">Welcome, {teacher}</div>
        </div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 border border-[#2D2D2D] bg-[#1E1E1E] rounded-xl text-[#EAEAEA] font-semibold hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
          aria-label="Back to login"
        >
          <IoMdArrowRoundBack className="text-xl" /> Back to Login
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        {/* Calendar Section */}
        <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D] shadow-sm">
          <h2 className="text-lg font-semibold text-[#F1F1F1] mb-3">Select Date</h2>
          <div className="text-sm text-[#D1D1D1] mb-3">Date for Attendance</div>
          {/* Mobile Date Picker */}
          <div className="sm:hidden">
            <input
              type="date"
              value={today}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) {
                  setSelectedDate(newDate);
                }
              }}
              className="w-full px-4 py-2 border border-[#2D2D2D] rounded-lg bg-[#121212] text-[#EAEAEA] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
              aria-label="Select attendance date"
            />
          </div>
          {/* Desktop Calendar Grid */}
          <div className="hidden sm:block bg-[#121212] rounded-xl p-4 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-3">
              <button
                className="px-4 py-2 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
                aria-label="Previous month"
              >
                <IoMdArrowRoundBack className="text-lg" />
              </button>
              <span className="font-semibold text-[#EAEAEA]">
                {selectedDate.toLocaleString("default", { month: "long" })} {currentYear}
              </span>
              <button
                className="px-4 py-2 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:ring-2 focus:ring-[#3A86FF] focus:outline-none"
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
                aria-label="Next month"
              >
                <span className="rotate-180 inline-block">
                  <IoMdArrowRoundBack className="text-lg" />
                </span>
              </button>
            </div>
            <table className="w-full text-[#EAEAEA]" role="grid" aria-label="Calendar for selecting attendance date">
              <thead>
                <tr>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <th
                      key={d}
                      className="py-2 text-sm font-semibold text-[#D1D1D1] uppercase border-b border-[#2D2D2D]"
                      scope="col"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const weeks: React.ReactElement[][] = [];
                  let day = 1 - startDay;
                  for (let w = 0; w < 6 && day <= daysInMonth; w++) {
                    const week: React.ReactElement[] = [];
                    for (let d = 0; d < 7; d++, day++) {
                      const dateObj = new Date(currentYear, currentMonth, day);
                      const isCurrentMonth = dateObj.getMonth() === currentMonth;
                      const isSelected = dateObj.toDateString() === selectedDate.toDateString();
                      week.push(
                        <td key={d} className="text-center p-1">
                          {isCurrentMonth && day > 0 && day <= daysInMonth ? (
                            <button
                              className={`w-full h-10 rounded-lg border border-[#2D2D2D] bg-[#1E1E1E] font-semibold transition-colors duration-200
                                ${
                                  isSelected
                                    ? "bg-[#3A86FF] text-[#EAEAEA] shadow-md"
                                    : "text-[#EAEAEA] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF]"
                                } focus:ring-2 focus:ring-[#3A86FF] focus:outline-none`}
                              onClick={() => setSelectedDate(dateObj)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedDate(dateObj);
                                }
                              }}
                              aria-label={`Select date ${dateObj.toLocaleDateString()}`}
                            >
                              {day}
                            </button>
                          ) : (
                            <span className="w-full h-10 inline-block text-transparent"> </span>
                          )}
                        </td>
                      );
                    }
                    weeks.push(week);
                  }
                  return weeks.map((week, i) => (
                    <tr key={i} className="border-b border-[#2D2D2D]">
                      {week}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D] shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
            <h2 className="text-lg font-semibold text-[#F1F1F1]">
              Your Students -{" "}
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <span className="text-sm text-[#D1D1D1] px-3 py-1 rounded-full bg-[#2D2D2D]">
              {myStudents.length} students assigned
            </span>
          </div>
          {myStudents.length === 0 ? (
            <p className="text-[#D1D1D1] text-center py-6 text-base">
              No students assigned.
            </p>
          ) : (
            <div className="space-y-6">
              {myStudents.map((s, idx) => {
                const current = myTodayMap[s.id] as AttendanceStatus | undefined;
                return (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#121212] rounded-lg p-4 border border-[#2D2D2D] hover:bg-[#2D2D2D] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3A86FF]/20 text-[#3A86FF] font-bold text-base">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-[#EAEAEA] text-base">{s.name}</div>
                        <div className="text-sm text-[#D1D1D1]">ID: {s.id}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {(["present", "late", "absent"] as const).map((status) => (
                        <button
                          key={status}
                          className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                            border-[#2D2D2D] bg-[#1E1E1E] text-[#EAEAEA]
                            hover:bg-[#3A86FF]/20 hover:text-[#3A86FF]
                            ${
                              current === status
                                ? "bg-[#3A86FF] text-[#EAEAEA] border-[#3A86FF]"
                                : ""
                            } focus:ring-2 focus:ring-[#3A86FF] focus:outline-none`}
                          onClick={() => markAttendance(s.id, status)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              markAttendance(s.id, status);
                            }
                          }}
                          aria-label={`Mark ${s.name} as ${status} for ${selectedDate.toLocaleDateString()}`}
                        >
                          {status === "present" && <BiUserCheck className="text-lg" />}
                          {status === "late" && <LiaUserClockSolid className="text-lg" />}
                          {status === "absent" && <BiUserX className="text-lg" />}
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
