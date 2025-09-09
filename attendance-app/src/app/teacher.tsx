"use client";
import { useMemo, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { BiUserCheck, BiUserX } from "react-icons/bi";
import { LiaUserClockSolid } from "react-icons/lia";
import { HiOutlineClipboardCheck } from "react-icons/hi";
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
  const today = useMemo(
    () => selectedDate.toISOString().slice(0, 10),
    [selectedDate]
  );

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

  return (
    <div className="min-h-screen bg-[#121212] p-0 text-[#EAEAEA]">
      {/* Header Section */}
      <div className="flex items-center justify-between px-12 pt-8 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#EAEAEA]">
            Teacher Dashboard
          </h1>
          <div className="text-lg text-[#B0B0B0] mt-1">
            Welcome, Ms. Sarah Johnson
          </div>
        </div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-5 py-2 border border-[#2D2D2D] bg-[#1E1E1E] rounded-xl shadow-sm text-[#EAEAEA] font-semibold hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200"
        >
          <IoMdArrowRoundBack className="text-xl" /> Back to Login
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 px-12 pb-12">
        {/* Calendar Section */}
        <div className="bg-[#1E1E1E] rounded-2xl shadow-md p-7 w-full md:w-1/3 border border-[#2D2D2D]">
          <h2 className="text-lg font-semibold text-[#EAEAEA] mb-2">
            Select Date
          </h2>
          <div className="text-[#B0B0B0] mb-3 text-sm">Date for Attendance</div>
          <div className="bg-[#121212] rounded-xl p-4 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-3">
              <button
                className="px-3 py-1 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:outline-none"
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                <IoMdArrowRoundBack />
              </button>
              <span className="font-semibold text-[#EAEAEA]">
                {selectedDate.toLocaleString("default", { month: "long" })}{" "}
                {selectedDate.getFullYear()}
              </span>
              <button
                className="px-3 py-1 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:outline-none"
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                <span className="rotate-180 inline-block">
                  <IoMdArrowRoundBack />
                </span>
              </button>
            </div>
            {/* Calendar grid */}
            <table className="w-full text-[#EAEAEA]">
              <thead>
                <tr>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <th
                      key={d}
                      className="py-2 text-xs font-semibold text-[#B0B0B0] uppercase border-b border-[#2D2D2D]"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const currentMonth = selectedDate.getMonth();
                  const currentYear = selectedDate.getFullYear();
                  const firstDay = new Date(currentYear, currentMonth, 1);
                  const startDay = firstDay.getDay();
                  const daysInMonth = new Date(
                    currentYear,
                    currentMonth + 1,
                    0
                  ).getDate();
                  const weeks: React.ReactElement[][] = [];
                  let day = 1 - startDay;
                  for (let w = 0; w < 6; w++) {
                    const week: React.ReactElement[] = [];
                    for (let d = 0; d < 7; d++, day++) {
                      const dateObj = new Date(currentYear, currentMonth, day);
                      const isCurrentMonth =
                        dateObj.getMonth() === currentMonth;
                      const isSelected =
                        dateObj.toDateString() === selectedDate.toDateString();
                      week.push(
                        <td key={d} className="text-center p-1">
                          {isCurrentMonth && day > 0 && day <= daysInMonth ? (
                            <button
                              className={`w-full h-8 rounded-xl border border-[#2D2D2D] bg-[#1E1E1E] font-semibold focus:outline-none transition-colors duration-200
                                ${
                                  isSelected
                                    ? "bg-[#3A86FF] text-[#EAEAEA] shadow-lg"
                                    : "text-[#EAEAEA] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF]"
                                }`}
                              onClick={() => setSelectedDate(dateObj)}
                            >
                              {day}
                            </button>
                          ) : (
                            <span className="w-full h-8 inline-block text-transparent">
                              {" "}
                            </span>
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
        <div className="bg-[#1E1E1E] rounded-2xl shadow-md p-7 flex-1 w-full md:w-2/3 border border-[#2D2D2D]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-[#EAEAEA]">
              Your Students -{" "}
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <span className="text-xs text-[#B0B0B0] px-3 py-1 rounded-full bg-[#2D2D2D]">
              {myStudents.length} students assigned
            </span>
          </div>
          {myStudents.length === 0 ? (
            <p className="text-[#B0B0B0] text-center py-4">
              No students assigned.
            </p>
          ) : (
            <div className="space-y-5">
              {myStudents.map((s, idx) => {
                const current = myTodayMap[s.id] as
                  | AttendanceStatus
                  | undefined;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-[#121212] rounded-lg p-4 border border-[#2D2D2D] hover:bg-[#2D2D2D] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3A86FF]/20 text-[#3A86FF] font-bold text-lg">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-[#EAEAEA]">
                          {s.name}
                        </div>
                        <div className="text-xs text-[#B0B0B0]">ID: {s.id}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(["present", "late", "absent"] as const).map(
                        (status) => (
                          <button
                            key={status}
                            className={`px-3 py-1.5 border rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                              border-[#2D2D2D] bg-[#1E1E1E] text-[#EAEAEA]
                              hover:bg-[#3A86FF]/20 hover:text-[#3A86FF]
                              ${
                                current === status
                                  ? "bg-[#3A86FF] text-[#EAEAEA] border-[#3A86FF]"
                                  : ""
                              } focus:outline-none`}
                            onClick={() => markAttendance(s.id, status)}
                          >
                            {status === "present" && (
                              <BiUserCheck className="text-lg" />
                            )}
                            {status === "late" && (
                              <LiaUserClockSolid className="text-lg" />
                            )}
                            {status === "absent" && (
                              <BiUserX className="text-lg" />
                            )}
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
