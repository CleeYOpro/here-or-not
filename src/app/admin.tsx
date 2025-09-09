"use client";
import { useMemo, useState } from "react";
import type {
  AttendanceMap,
  Assignments,
  Student,
  AttendanceStatus,
} from "./page";

interface AdminProps {
  goBack: () => void;
  teachers: string[];
  setTeachers: React.Dispatch<React.SetStateAction<string[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  assignments: Assignments;
  setAssignments: React.Dispatch<React.SetStateAction<Assignments>>;
  attendance: AttendanceMap;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceMap>>;
}

export default function AdminDashboard({
  goBack,
  teachers,
  setTeachers,
  students,
  setStudents,
  assignments,
  setAssignments,
  attendance,
  setAttendance,
}: AdminProps) {
  // Attendance summary for all students for today
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []); // 2025-09-08

  const dailyAttendanceSummary = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
    };
    teachers.forEach((teacher) => {
      const map = attendance[teacher]?.[today] ?? {};
      Object.values(map).forEach((status) => {
        summary[status] += 1;
      });
    });
    return summary;
  }, [attendance, teachers, today]);

  // Student search state
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCalendarDate, setStudentCalendarDate] = useState<string>("");

  // Autocomplete filtered students
  const filteredStudentSearch = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Attendance history for selected student
  const studentAttendanceHistory = useMemo(() => {
    if (!selectedStudent) return { present: 0, absent: 0, late: 0, total: 0 };
    let present = 0, absent = 0, late = 0, total = 0;
    Object.keys(attendance).forEach((teacher) => {
      Object.keys(attendance[teacher] ?? {}).forEach((date) => {
        const status = attendance[teacher][date]?.[selectedStudent.id];
        if (status) {
          total++;
          if (status === "present") present++;
          else if (status === "absent") absent++;
          else if (status === "late") late++;
        }
      });
    });
    return { present, absent, late, total };
  }, [selectedStudent, attendance]);

  // Attendance records for selected student filtered by calendar date
  const studentAttendanceByDate = useMemo((): AttendanceStatus | null => {
    if (!selectedStudent || !studentCalendarDate) return null;
    let status: AttendanceStatus | null = null;
    Object.keys(attendance).forEach((teacher) => {
      const record = attendance[teacher]?.[studentCalendarDate]?.[selectedStudent.id];
      if (record) status = record;
    });
    return status;
  }, [selectedStudent, studentCalendarDate, attendance]);

  const [newTeacher, setNewTeacher] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentStandard, setStudentStandard] = useState("");
  const [studentTeacher, setStudentTeacher] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"view" | "manage">("view");
  const [manageSubTab, setManageSubTab] = useState<"teachers" | "students">("teachers");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const assignedForTeacher = (t: string) => new Set(assignments[t] ?? []);
  const addTeacher = () => {
    const name = newTeacher.trim();
    if (!name) return;
    if (teachers.includes(name)) return; // prevent dup
    setTeachers((prev) => [...prev, name]);
    setNewTeacher("");
  };
  const addStudent = () => {
    const name = studentName.trim();
    const id = studentId.trim();
    const standard = studentStandard.trim();
    const teacher = studentTeacher.trim();
    if (!name || !/^\d{5}$/.test(id)) return; // 5-digit id
    if (students.some((s) => s.id === id)) return; // unique id
    setStudents((prev) => [...prev, { id, name, standard }]);
    if (teacher) {
      setAssignments((prev) => {
        const current = prev[teacher] ?? [];
        if (current.includes(id)) return prev;
        return { ...prev, [teacher]: [...current, id] };
      });
    }
    setStudentName("");
    setStudentId("");
    setStudentStandard("");
    setStudentTeacher("");
  };
  const assignStudent = () => {
    if (!selectedTeacher || !selectedStudentId) return;
    setAssignments((prev) => {
      const current = prev[selectedTeacher] ?? [];
      if (current.includes(selectedStudentId)) return prev;
      return { ...prev, [selectedTeacher]: [...current, selectedStudentId] };
    });
    setSelectedStudentId("");
  };
  const unassignStudent = (teacher: string, sid: string) => {
    setAssignments((prev) => ({
      ...prev,
      [teacher]: (prev[teacher] ?? []).filter((id) => id !== sid),
    }));
  };
  const teacherAttendanceForDate = (t: string, date: string) =>
    attendance[t]?.[date] ?? {};
  const summarizeAttendance = (t: string, date: string) => {
    const map = teacherAttendanceForDate(t, date);
    const counts: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
    };
    Object.values(map).forEach((s) => (counts[s] += 1));
    return counts;
  };
  const deleteTeacher = (teacherName: string) => {
    setTeachers((prev) => prev.filter((t) => t !== teacherName));
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[teacherName];
      return newAssignments;
    });
    setAttendance((prev: AttendanceMap) => {
      const newAttendance = { ...prev };
      delete newAttendance[teacherName];
      return newAttendance;
    });
  };
  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setAssignments((prev) => {
      const newAssignments: Assignments = {};
      Object.keys(prev).forEach((teacher) => {
        newAssignments[teacher] = prev[teacher].filter((id) => id !== studentId);
      });
      return newAssignments;
    });
    setAttendance((prev: AttendanceMap) => {
      const newAttendance: AttendanceMap = {};
      Object.keys(prev).forEach((teacher) => {
        newAttendance[teacher] = {};
        Object.keys(prev[teacher]).forEach((date) => {
          const dateAttendance = { ...prev[teacher][date] };
          delete dateAttendance[studentId];
          newAttendance[teacher][date] = dateAttendance;
        });
      });
      return newAttendance;
    });
  };
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        if (lines.length < 2) {
          setCsvError("CSV must have at least a header and one data row");
          return;
        }
        // Skip header
        const dataLines = lines.slice(1);
        const newTeachers: string[] = [];
        const newStudents: Student[] = [];
        const newAssignments: Assignments = { ...assignments };
        const errors: string[] = [];
        dataLines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return; // skip empty lines
          const parts = trimmedLine.split(",").map((part) => part.trim());
          if (parts.length < 4) {
            errors.push(`Row ${index + 2}: Expected 4 columns but got ${parts.length}`);
            return;
          }
          const [name, standard, id, teacherName] = parts;
          if (!/^\d{5}$/.test(id)) {
            errors.push(`Row ${index + 2}: Student ID must be 5 digits`);
            return;
          }
          if (!teachers.includes(teacherName) && !newTeachers.includes(teacherName)) {
            newTeachers.push(teacherName);
          }
          if (students.some((s) => s.id === id) || newStudents.some((s) => s.id === id)) {
            return;
          }
          newStudents.push({
            id,
            name,
            standard: standard || undefined,
          });
          if (!newAssignments[teacherName]) {
            newAssignments[teacherName] = [];
          }
          if (!newAssignments[teacherName].includes(id)) {
            newAssignments[teacherName].push(id);
          }
        });
        if (errors.length > 0) {
          setCsvError(errors.join("; "));
          return;
        }
        setTeachers((prev) => [...prev, ...newTeachers]);
        setStudents((prev) => [...prev, ...newStudents]);
        setAssignments(newAssignments);
        event.target.value = "";
      } catch (error) {
        setCsvError("Error processing CSV file");
      }
    };
    reader.readAsText(file);
  };
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-12 font-sans text-[#EAEAEA]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#F1F1F1] tracking-tight">Admin Dashboard</h1>
            <p className="text-[#EAEAEA] mt-2 text-base">Manage teachers, students, and attendance</p>
          </div>
          <button
            onClick={goBack}
            className="px-8 py-4 bg-[#3A86FF] text-[#F1F1F1] rounded-xl shadow-lg hover:bg-[#4361EE] transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Login
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[#2D2D2D] mb-6">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${activeTab === "view"
              ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
              : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"}`}
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            View Records
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${activeTab === "manage"
              ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
              : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"}`}
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Manage People
          </button>
        </div>

        {/* View Records Tab */}
        {activeTab === "view" && (
          <div className="space-y-6">
            {/* Daily Attendance Graph Container */}
            <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D] mb-6" style={{ borderRadius: "12px" }}>
              <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Daily Attendance Summary
              </h2>

              <div className="flex flex-col gap-4">
                {/* Horizontal stacked bar */}
                <div className="w-full h-10 flex rounded-lg overflow-hidden border border-[#2D2D2D]">
                  {/* Present */}
                  <div
                    className="bg-gradient-to-r from-[#1A3C1A] to-[#2E7D32] flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(dailyAttendanceSummary.present /
                        (dailyAttendanceSummary.present + dailyAttendanceSummary.absent + dailyAttendanceSummary.late)) * 100}%`,
                    }}
                    title={`Present: ${dailyAttendanceSummary.present}`}
                  >
                    {dailyAttendanceSummary.present > 0 && <span>{dailyAttendanceSummary.present}</span>}
                  </div>

                  {/* Absent */}
                  <div
                    className="bg-gradient-to-r from-[#451A1A] to-[#D32F2F] flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(dailyAttendanceSummary.absent /
                        (dailyAttendanceSummary.present + dailyAttendanceSummary.absent + dailyAttendanceSummary.late)) * 100}%`,
                    }}
                    title={`Absent: ${dailyAttendanceSummary.absent}`}
                  >
                    {dailyAttendanceSummary.absent > 0 && <span>{dailyAttendanceSummary.absent}</span>}
                  </div>

                  {/* Late */}
                  <div
                    className="bg-gradient-to-r from-[#3C2A1A] to-[#ED6C02] flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(dailyAttendanceSummary.late /
                        (dailyAttendanceSummary.present + dailyAttendanceSummary.absent + dailyAttendanceSummary.late)) * 100}%`,
                    }}
                    title={`Late: ${dailyAttendanceSummary.late}`}
                  >
                    {dailyAttendanceSummary.late > 0 && <span>{dailyAttendanceSummary.late}</span>}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-between text-sm text-[#B0B0B0]">
                  <span>Present: <span className="text-[#A5D6A7] font-bold">{dailyAttendanceSummary.present}</span></span>
                  <span>Absent: <span className="text-[#EF9A9A] font-bold">{dailyAttendanceSummary.absent}</span></span>
                  <span>Late: <span className="text-[#FFE082] font-bold">{dailyAttendanceSummary.late}</span></span>
                </div>
              </div>
            </div>

            {/* Student Search + Profile Container */}
            <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D] mb-6" style={{ borderRadius: "12px" }}>
              <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Student Search
              </h2>
              <div className="relative max-w-lg">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setSelectedStudent(null);
                  }}
                  placeholder="Search student by name..."
                  className="w-full px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                  autoComplete="off"
                />
                {studentSearch && filteredStudentSearch.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 bg-[#232323] border border-[#2D2D2D] rounded-lg mt-2 shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudentSearch.map((s: Student) => (
                      <li
                        key={s.id}
                        className="px-4 py-2 cursor-pointer hover:bg-[#3A86FF] hover:text-white transition-colors"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch(s.name);
                        }}
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedStudent && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Student Profile */}
                  <div className="bg-[#232323] rounded-lg p-6 border border-[#2D2D2D] shadow">
                    <h3 className="text-2xl font-bold text-[#F1F1F1] mb-2">{selectedStudent.name}</h3>
                    <p className="text-[#B0B0B0] mb-1">ID: <span className="text-[#EAEAEA]">{selectedStudent.id}</span></p>
                    <p className="text-[#B0B0B0] mb-1">Standard: <span className="text-[#EAEAEA]">{selectedStudent.standard || "-"}</span></p>
                    <p className="text-[#B0B0B0] mb-1">Attendance Records: <span className="text-[#EAEAEA]">{studentAttendanceHistory.total}</span></p>
                  </div>
                  {/* Attendance History Graph */}
                  <div className="bg-[#232323] rounded-lg p-6 border border-[#2D2D2D] shadow flex flex-col items-center">
                    <h4 className="text-lg font-semibold text-[#F1F1F1] mb-4">Attendance History</h4>

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                      {/* Horizontal stacked bar */}
                      <div className="w-full h-8 flex rounded-lg overflow-hidden border border-[#2D2D2D]">
                        {/* Present */}
                        <div
                          className="bg-gradient-to-r from-[#1A3C1A] to-[#2E7D32] flex items-center justify-center text-xs text-white"
                          style={{
                            width: `${(studentAttendanceHistory.present /
                              (studentAttendanceHistory.present + studentAttendanceHistory.absent + studentAttendanceHistory.late)) * 100}%`,
                          }}
                          title={`Present: ${studentAttendanceHistory.present} days`}
                        >
                          {studentAttendanceHistory.present > 0 && (
                            <span>{studentAttendanceHistory.present}</span>
                          )}
                        </div>

                        {/* Absent */}
                        <div
                          className="bg-gradient-to-r from-[#451A1A] to-[#D32F2F] flex items-center justify-center text-xs text-white"
                          style={{
                            width: `${(studentAttendanceHistory.absent /
                              (studentAttendanceHistory.present + studentAttendanceHistory.absent + studentAttendanceHistory.late)) * 100}%`,
                          }}
                          title={`Absent: ${studentAttendanceHistory.absent} days`}
                        >
                          {studentAttendanceHistory.absent > 0 && (
                            <span>{studentAttendanceHistory.absent}</span>
                          )}
                        </div>

                        {/* Late */}
                        <div
                          className="bg-gradient-to-r from-[#3C2A1A] to-[#ED6C02] flex items-center justify-center text-xs text-white"
                          style={{
                            width: `${(studentAttendanceHistory.late /
                              (studentAttendanceHistory.present + studentAttendanceHistory.absent + studentAttendanceHistory.late)) * 100}%`,
                          }}
                          title={`Late: ${studentAttendanceHistory.late} days`}
                        >
                          {studentAttendanceHistory.late > 0 && (
                            <span>{studentAttendanceHistory.late}</span>
                          )}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex justify-between text-sm text-[#B0B0B0] w-full">
                        <span>
                          Present:{" "}
                          <span className="text-[#A5D6A7] font-bold">
                            {studentAttendanceHistory.present} days
                          </span>
                        </span>
                        <span>
                          Absent:{" "}
                          <span className="text-[#EF9A9A] font-bold">
                            {studentAttendanceHistory.absent} days
                          </span>
                        </span>
                        <span>
                          Late:{" "}
                          <span className="text-[#FFE082] font-bold">
                            {studentAttendanceHistory.late} days
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-[#F1F1F1] mb-4">Attendance Calendar</h4>
                <input
                  type="date"
                  value={studentCalendarDate}
                  onChange={e => setStudentCalendarDate(e.target.value)}
                  className="px-4 py-2 border border-[#2D2D2D] rounded-lg bg-[#121212] text-[#EAEAEA] focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF]"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                />
                {studentCalendarDate && (
                  <div className="mt-4">
                    <span className="text-[#B0B0B0]">Attendance on {studentCalendarDate}: </span>
                    {studentAttendanceByDate ? (
                      <span className={
                        studentAttendanceByDate === "present"
                          ? "text-[#A5D6A7] font-bold"
                          : studentAttendanceByDate === "absent"
                            ? "text-[#EF9A9A] font-bold"
                            : "text-[#FFE082] font-bold"
                      }>
                        {studentAttendanceByDate.charAt(0).toUpperCase() + studentAttendanceByDate.slice(1)}
                      </span>
                    ) : (
                      <span className="text-[#B0B0B0]">No record</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedTeacherForView && (
              <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D]" style={{ borderRadius: "12px" }}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-[#F1F1F1]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    {selectedTeacherForView}
                  </h2>
                  <div
                    className="text-sm px-4 py-2 bg-gradient-to-r from-[#3A86FF] to-[#4361EE] text-[#F1F1F1] rounded-full"
                    style={{ borderRadius: "9999px" }}
                  >
                    {today}
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="mb-6">
                  <h3 className="font-medium text-[#B0B0B0] mb-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Attendance Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const counts = summarizeAttendance(selectedTeacherForView, today);
                      return (
                        <>
                          <div
                            className="bg-gradient-to-br from-[#1A3C1A] to-[#2E7D32] rounded-full p-5 border-2 border-transparent"
                            style={{ borderImage: "linear-gradient(to right, #3A86FF, #4361EE) 1" }}
                          >
                            <div className="text-3xl font-bold text-[#A5D6A7]">{counts.present}</div>
                            <div className="text-[#A5D6A7]">Present</div>
                          </div>
                          <div
                            className="bg-gradient-to-br from-[#451A1A] to-[#D32F2F] rounded-full p-5 border-2 border-transparent"
                            style={{ borderImage: "linear-gradient(to right, #3A86FF, #4361EE) 1" }}
                          >
                            <div className="text-3xl font-bold text-[#EF9A9A]">{counts.absent}</div>
                            <div className="text-[#EF9A9A]">Absent</div>
                          </div>
                          <div
                            className="bg-gradient-to-br from-[#3C2A1A] to-[#ED6C02] rounded-full p-5 border-2 border-transparent"
                            style={{ borderImage: "linear-gradient(to right, #3A86FF, #4361EE) 1" }}
                          >
                            <div className="text-3xl font-bold text-[#FFE082]">{counts.late}</div>
                            <div className="text-[#FFE082]">Late</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Assigned Students */}
                <div>
                  <h3 className="font-medium text-[#B0B0B0] mb-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Assigned Students
                  </h3>
                  {(() => {
                    const assignedStudents = students.filter((s) => assignedForTeacher(selectedTeacherForView).has(s.id));
                    if (assignedStudents.length === 0) {
                      return (
                        <div className="text-center py-8 text-[#B0B0B0] bg-[#2D2D2D] rounded-lg border border-[#3A3A3A]">
                          No students assigned to this teacher
                        </div>
                      );
                    }
                    return (
                      <div className="overflow-x-auto border border-[#3A3A3A] rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-[#3A3A3A]">
                          <thead className="bg-[#2D2D2D]">
                            <tr>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                              >
                                Name
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                              >
                                ID
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                              >
                                Standard
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-[#1E1E1E] divide-y divide-[#3A3A3A]">
                            {assignedStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-[#2D2D2D] transition-colors duration-200">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#EAEAEA]">{s.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">{s.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">{s.standard || "-"}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => unassignStudent(selectedTeacherForView, s.id)}
                                    className="text-[#EF9A9A] hover:text-[#D32F2F] transition-colors duration-200"
                                  >
                                    Unassign
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage People Tab */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex border-b-2 border-[#2D2D2D]">
              <button
                onClick={() => setManageSubTab("teachers")}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${manageSubTab === "teachers"
                  ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
                  : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"}`}
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Teachers
              </button>
              <button
                onClick={() => setManageSubTab("students")}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${manageSubTab === "students"
                  ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
                  : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"}`}
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Students
              </button>
            </div>

            {/* Teachers Management */}
            {manageSubTab === "teachers" && (
              <div className="space-y-6">
                {/* Add Teacher */}
                <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D]" style={{ borderRadius: "12px" }}>
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Add Teacher
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newTeacher}
                      onChange={(e) => setNewTeacher(e.target.value)}
                      className="flex-1 px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                      placeholder="Teacher Name"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    />
                    <button
                      onClick={addTeacher}
                      className="px-6 py-3 bg-gradient-to-r from-[#3A86FF] to-[#4361EE] text-[#F1F1F1] rounded-lg hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Teacher
                    </button>
                  </div>
                </div>

                {/* Teachers List */}
                <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D]" style={{ borderRadius: "12px" }}>
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Current Teachers
                  </h2>
                  {teachers.length === 0 ? (
                    <div className="text-center py-8 text-[#B0B0B0] bg-[#2D2D2D] rounded-lg border border-[#3A3A3A]">
                      No teachers added yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teachers.map((t) => (
                        <div
                          key={t}
                          className="border border-[#3A3A3A] rounded-lg p-5 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#1E1E1E] to-[#2D2D2D]"
                          style={{ borderRadius: "12px" }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-[#EAEAEA]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                                {t}
                              </h3>
                              <p className="text-sm text-[#B0B0B0] mt-1">
                                {assignedForTeacher(t).size} students assigned
                              </p>
                            </div>
                            <button
                              onClick={() => deleteTeacher(t)}
                              className="text-[#B0B0B0] hover:text-[#EF9A9A] transition-colors duration-200"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )} {(() => {
              // Calendar logic (copied and adapted from teacher.tsx)
              const [calendarDate, setCalendarDate] = useState(new Date());
              const currentMonth = calendarDate.getMonth();
              const currentYear = calendarDate.getFullYear();
              const firstDay = new Date(currentYear, currentMonth, 1);
              const startDay = firstDay.getDay();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              // Attendance map for selected student by date
              const attendanceByDate: Record<string, AttendanceStatus | undefined> = {};
              Object.keys(attendance).forEach((teacher) => {
                Object.keys(attendance[teacher] ?? {}).forEach((date) => {
                  if (selectedStudent && attendance[teacher][date][selectedStudent.id]) {
                    attendanceByDate[date] = attendance[teacher][date][selectedStudent.id];
                  }
                });
              });
              // Color mapping
              const statusColor: Record<AttendanceStatus, string> = {
                present: "bg-[#3A86FF]/40 border-[#3A86FF] text-[#EAEAEA]",
                absent: "bg-[#D32F2F]/40 border-[#D32F2F] text-[#EAEAEA]",
                late: "bg-[#ED6C02]/40 border-[#ED6C02] text-[#EAEAEA]",
              };
              // Render calendar grid
              let day = 1 - startDay;
              const weeks: React.ReactElement[][] = [];
              for (let w = 0; w < 6; w++) {
                const week: React.ReactElement[] = [];
                for (let d = 0; d < 7; d++, day++) {
                  const dateObj = new Date(currentYear, currentMonth, day);
                  const isCurrentMonth = dateObj.getMonth() === currentMonth;
                  const dateStr = dateObj.toISOString().slice(0, 10);
                  const status = attendanceByDate[dateStr];
                  week.push(
                    <td key={d} className="text-center p-1">
                      {isCurrentMonth && day > 0 && day <= daysInMonth ? (
                        <button
                          className={`w-full h-8 rounded-xl border font-semibold focus:outline-none transition-colors duration-200
                                                ${status ? statusColor[status] : "bg-[#1E1E1E] border-[#2D2D2D] text-[#EAEAEA] hover:bg-[#3A86FF]/10"}`}
                          onClick={() => setCalendarDate(dateObj)}
                          title={status ? `${status.charAt(0).toUpperCase() + status.slice(1)}` : "No record"}
                        >
                          {day}
                        </button>
                      ) : (
                        <span className="w-full h-8 inline-block text-transparent"> </span>
                      )}
                    </td>
                  );
                }
                weeks.push(week);
              }
              return (
                <div className="bg-[#121212] rounded-xl p-4 border border-[#2D2D2D]">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      className="px-3 py-1 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:outline-none"
                      onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
                    >
                      &#8592;
                    </button>
                    <span className="font-semibold text-[#EAEAEA]">
                      {calendarDate.toLocaleString("default", { month: "long" })} {calendarDate.getFullYear()}
                    </span>
                    <button
                      className="px-3 py-1 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200 focus:outline-none"
                      onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
                    >
                      &#8594;
                    </button>
                  </div>
                  <table className="w-full text-[#EAEAEA]">
                    <thead>
                      <tr>
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <th key={d} className="py-2 text-xs font-semibold text-[#B0B0B0] uppercase border-b border-[#2D2D2D]">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeks.map((week, i) => (
                        <tr key={i} className="border-b border-[#2D2D2D]">{week}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <input
              type="text"
              value={studentStandard}
              onChange={(e) => setStudentStandard(e.target.value)}
              className="px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
              placeholder="Standard"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            />
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
              placeholder="5-digit ID"
              maxLength={5}
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            />
            <select
              value={studentTeacher}
              onChange={(e) => setStudentTeacher(e.target.value)}
              className="px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <option value="">Assign Teacher</option>
              {teachers.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={addStudent}
              className="px-6 py-3 bg-gradient-to-r from-[#3A86FF] to-[#4361EE] text-[#F1F1F1] rounded-lg hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Student
            </button>
          </div>
        )}

      {/* Upload CSV */}
      <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D]" style={{ borderRadius: "12px" }}>
        <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          Upload Students CSV
        </h2>
        <div className="border-2 border-dashed border-[#3A3A3A] rounded-lg p-8 text-center bg-gradient-to-br from-[#2D2D2D] to-[#1E1E1E]">
          <div className="flex flex-col items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-[#B0B0B0] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-[#B0B0B0] mb-2">Upload a CSV file with student data</p>
            <p className="text-sm text-[#B0B0B0] mb-4">Columns: Name, Standard, ID, Teacher</p>
            <label className="px-6 py-3 bg-gradient-to-r from-[#3A86FF] to-[#4361EE] text-[#F1F1F1] rounded-lg hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer font-medium">
              Choose File
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>
          {csvError && (
            <div className="mt-4 p-3 bg-[#451A1A] text-[#EF9A9A] rounded-lg text-sm border border-[#D32F2F]">
              {csvError}
            </div>
          )}
        </div>
      </div>

      {/* Students List */}
      <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D]" style={{ borderRadius: "12px" }}>
        <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          Current Students
        </h2>
        {students.length === 0 ? (
          <div className="text-center py-8 text-[#B0B0B0] bg-[#2D2D2D] rounded-lg border border-[#3A3A3A]">
            No students added yet
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#3A3A3A] rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-[#3A3A3A]">
              <thead className="bg-[#2D2D2D]">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    Name
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    ID
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    Standard
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1E1E1E] divide-y divide-[#3A3A3A]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-[#2D2D2D] transition-colors duration-200">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#EAEAEA]">{s.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">{s.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">{s.standard || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => deleteStudent(s.id)}
                        className="text-[#EF9A9A] hover:text-[#D32F2F] transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div >
)}

