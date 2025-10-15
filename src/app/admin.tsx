"use client";

import type { Teacher } from "./page";
import { useMemo, useState, useRef } from "react";
import type { AttendanceMap, Assignments, Student, AttendanceStatus } from "./page";

interface AdminProps {
  goBack: () => void;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
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
  // Tab state
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');
  const [manageSubTab, setManageSubTab] = useState<'teachers' | 'students'>('teachers');
  const today = new Date().toISOString().slice(0, 10); // 2025-09-10

  const dailyAttendanceSummary = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
    };
    teachers.forEach((teacher) => {
      const map = attendance[teacher.username]?.[today] ?? {};
      Object.values(map).forEach((status) => {
        if (status === "present" || status === "absent" || status === "late") {
          summary[status] += 1;
        }
      });
    });
    return summary;
  }, [attendance, teachers, today]);

  // Student search state
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  // Calendar logic for selected student
  const [calendarDate, setCalendarDate] = useState(new Date());
  const currentMonth = calendarDate.getMonth();
  const currentYear = calendarDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const attendanceByDate: Record<string, AttendanceStatus | undefined> = {};
  Object.keys(attendance).forEach((teacher) => {
    Object.keys(attendance[teacher] ?? {}).forEach((date) => {
      if (selectedStudent && attendance[teacher][date][selectedStudent.id]) {
        attendanceByDate[date] = attendance[teacher][date][selectedStudent.id];
      }
    });
  });
  const statusColor: Record<AttendanceStatus, string> = {
    present: "bg-[#3A86FF]/40 border-[#3A86FF] text-[#EAEAEA]",
    absent: "bg-[#D32F2F]/40 border-[#D32F2F] text-[#EAEAEA]",
    late: "bg-[#ED6C02]/40 border-[#ED6C02] text-[#EAEAEA]",
  };

  // Manage People state
  const [newTeacher, setNewTeacher] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentStandard, setStudentStandard] = useState("");
  const [studentTeacher, setStudentTeacher] = useState<string>("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentData, setEditingStudentData] = useState<{
    name: string;
    id: string;
    standard: string;
    teacher: string;
  } | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [editingTeacherName, setEditingTeacherName] = useState<string>("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const studentTableRef = useRef<HTMLTableElement>(null);
  const teacherContainerRef = useRef<HTMLDivElement>(null);

  // Ensure teachers is always Teacher[]

  const addTeacher = async () => {
    const name = newTeacher.trim();
    if (!name || teachers.some(t => t.name === name)) return;
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const password = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password }),
      });
      
      if (res.ok) {
        const newTeacherData = await res.json();
        setTeachers((prev) => [...prev, newTeacherData]);
        setNewTeacher("");
      } else {
        const errorData = await res.json();
        console.error('Failed to add teacher:', errorData);
        alert(`Failed to add teacher: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert(`Error adding teacher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveTeacherEdit = async () => {
    if (!editingTeacher || !editingTeacherName.trim()) {
      setEditingTeacher(null);
      return;
    }
    if (teachers.some(t => t.name === editingTeacherName.trim()) && editingTeacherName.trim() !== editingTeacher) {
      return; // Prevent duplicate names
    }
    
    const teacher = teachers.find(t => t.name === editingTeacher);
    if (!teacher?.id) return;
    
    const newName = editingTeacherName.trim();
    const newUsername = newName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    try {
      const res = await fetch('/api/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: teacher.id, 
          name: newName, 
          username: newUsername 
        }),
      });
      
      if (res.ok) {
        const updatedTeacher = await res.json();
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === teacher.id ? updatedTeacher : t
          )
        );
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          const oldUsername = editingTeacher.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (newAssignments[oldUsername]) {
            newAssignments[newUsername] = newAssignments[oldUsername];
            delete newAssignments[oldUsername];
          }
          return newAssignments;
        });
        setAttendance((prev) => {
          const newAttendance = { ...prev };
          const oldUsername = editingTeacher.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (newAttendance[oldUsername]) {
            newAttendance[newUsername] = newAttendance[oldUsername];
            delete newAttendance[oldUsername];
          }
          return newAttendance;
        });
        setEditingTeacher(null);
        setEditingTeacherName("");
      } else {
        const errorData = await res.json();
        alert(`Failed to update teacher: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert(`Error updating teacher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteTeacher = async (teacherName: string) => {
    const teacher = teachers.find(t => t.name === teacherName);
    if (!teacher) return;
    
    try {
      const res = await fetch(`/api/teachers?id=${teacher.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setTeachers((prev) => prev.filter((t) => t.name !== teacherName));
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          const username = teacherName.toLowerCase().replace(/[^a-z0-9]/g, "");
          delete newAssignments[username];
          return newAssignments;
        });
        setAttendance((prev) => {
          const newAttendance = { ...prev };
          const username = teacherName.toLowerCase().replace(/[^a-z0-9]/g, "");
          delete newAttendance[username];
          return newAttendance;
        });
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const addStudent = async () => {
    const name = studentName.trim();
    const id = studentId.trim();
    const standard = studentStandard.trim();
    const teacherUsername = studentTeacher.trim();
    if (!name || !/^\d{5}$/.test(id) || students.some((s) => s.id === id)) return;
    
    try {
      const teacher = teachers.find(t => t.username === teacherUsername);
      const teacherId = teacher?.id || null;
      
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, standard, teacherId }),
      });
      
      if (res.ok) {
        const newStudent = await res.json();
        setStudents((prev) => [...prev, newStudent]);
        if (teacherUsername) {
          setAssignments((prev) => ({
            ...prev,
            [teacherUsername]: [...(prev[teacherUsername] ?? []), id],
          }));
        }
        setStudentName("");
        setStudentId("");
        setStudentStandard("");
        setStudentTeacher("");
      } else {
        const errorData = await res.json();
        console.error('Failed to add student:', errorData);
        alert(`Failed to add student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert(`Error adding student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveStudentEdit = async () => {
    if (!editingStudentId || !editingStudentData) return;
    const { name, id, standard, teacher } = editingStudentData;
    if (!name.trim() || !/^\d{5}$/.test(id.trim()) || (id !== editingStudentId && students.some((s) => s.id === id))) {
      return;
    }
    
    try {
      const teacherObj = teachers.find(t => t.username === teacher);
      const teacherId = teacherObj?.id || null;
      
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          name: name.trim(), 
          standard: standard.trim(),
          teacherId 
        }),
      });
      
      if (res.ok) {
        const updatedStudent = await res.json();
        setStudents((prev) =>
          prev.map((s) =>
            s.id === editingStudentId ? updatedStudent : s
          )
        );
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          Object.keys(newAssignments).forEach((t) => {
            newAssignments[t] = newAssignments[t].filter((sid) => sid !== editingStudentId);
            if (t === teacher && !newAssignments[t].includes(id)) {
              newAssignments[t].push(id);
            }
          });
          return newAssignments;
        });
        setEditingStudentId(null);
        setEditingStudentData(null);
      } else {
        const errorData = await res.json();
        alert(`Failed to update student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert(`Error updating student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add this function to handle student deletion
  const deleteStudent = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          Object.keys(newAssignments).forEach((t) => {
            newAssignments[t] = newAssignments[t].filter((sid) => sid !== studentId);
          });
          return newAssignments;
        });
        setAttendance((prev) => {
          const newAttendance = { ...prev };
          Object.keys(newAttendance).forEach((teacher) => {
            Object.keys(newAttendance[teacher] ?? {}).forEach((date) => {
              if (newAttendance[teacher][date][studentId]) {
                delete newAttendance[teacher][date][studentId];
              }
            });
          });
          return newAttendance;
        });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());
        if (lines.length < 2) {
          setCsvError("CSV must have at least a header and one data row");
          return;
        }
        const dataLines = lines.slice(1);
        const newTeachersToCreate: { name: string; username: string; password: string }[] = [];
        const newStudentsToCreate: { id: string; name: string; standard: string; teacherUsername: string }[] = [];
        const errors: string[] = [];
        
        dataLines.forEach((line, index) => {
          const parts = line.split(",").map((part) => part.trim());
          if (parts.length < 4) {
            errors.push(`Row ${index + 2}: Expected 4 columns but got ${parts.length}`);
            return;
          }
          const [name, standard, id, teacherName] = parts;
          if (!/^\d{5}$/.test(id)) {
            errors.push(`Row ${index + 2}: Student ID must be 5 digits`);
            return;
          }
          if (students.some((s) => s.id === id) || newStudentsToCreate.some((s) => s.id === id)) {
            return; // Skip duplicates
          }
          
          const username = teacherName.toLowerCase().replace(/[^a-z0-9]/g, "");
          
          // Check if teacher needs to be created
          if (!teachers.some(t => t.name === teacherName) && !newTeachersToCreate.some(t => t.name === teacherName)) {
            const password = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            newTeachersToCreate.push({ name: teacherName, username, password });
          }
          
          newStudentsToCreate.push({ id, name, standard: standard || "", teacherUsername: username });
        });
        
        if (errors.length > 0) {
          setCsvError(errors.join("; "));
          return;
        }
        
        // Create teachers first via API
        for (const teacher of newTeachersToCreate) {
          try {
            await fetch('/api/teachers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(teacher),
            });
          } catch (error) {
            console.error('Error creating teacher:', teacher.name, error);
          }
        }
        
        // Create students via bulk API
        try {
          const res = await fetch('/api/students/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students: newStudentsToCreate }),
          });
          
          if (res.ok) {
            const result = await res.json();
            console.log(`Created ${result.created} students`);
            if (result.errors && result.errors.length > 0) {
              console.warn('Some students failed:', result.errors);
            }
          }
        } catch (error) {
          console.error('Error bulk creating students:', error);
          setCsvError('Failed to upload students');
          return;
        }
        
        // Refresh all data from API
        try {
          const [teachersRes, studentsRes] = await Promise.all([
            fetch('/api/teachers'),
            fetch('/api/students'),
          ]);
          
          const teachersData = await teachersRes.json();
          const studentsData = await studentsRes.json();
          
          setTeachers(teachersData);
          setStudents(studentsData);
          
          // Rebuild assignments
          const assignmentsMap: Assignments = {};
          studentsData.forEach((student: any) => {
            if (student.teacher?.username) {
              if (!assignmentsMap[student.teacher.username]) {
                assignmentsMap[student.teacher.username] = [];
              }
              assignmentsMap[student.teacher.username].push(student.id);
            }
          });
          setAssignments(assignmentsMap);
          
          event.target.value = "";
          alert(`Successfully uploaded ${newStudentsToCreate.length} students and ${newTeachersToCreate.length} teachers!`);
        } catch (error) {
          console.error('Error refreshing data:', error);
          setCsvError('Upload succeeded but failed to refresh data. Please reload the page.');
        }
      } catch (error) {
        console.error('CSV processing error:', error);
        setCsvError("Error processing CSV file");
      }
    };
    reader.readAsText(file);
  };

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
            aria-label="Back to login"
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
        <div className="flex border-b-2 border-[#2D2D2D] mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "view"}
            onClick={() => setActiveTab("view")}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${activeTab === "view"
                ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
                : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"
              }`}
          >
            View Records
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "manage"}
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${activeTab === "manage"
                ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
                : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"
              }`}
          >
            Manage People
          </button>
        </div>

        {/* View Records Tab */}
        {activeTab === "view" && (
          <div className="space-y-6">
            {/* Daily Attendance Graph Container */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
              <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Daily Attendance Summary</h2>
              <div className="flex flex-col gap-4">
                <div className="w-full h-10 flex rounded-lg overflow-hidden border border-[#2D2D2D]">
                  {(() => {
                    const total =
                      dailyAttendanceSummary.present +
                      dailyAttendanceSummary.absent +
                      dailyAttendanceSummary.late;
                    const presentWidth = total > 0 ? (dailyAttendanceSummary.present / total) * 100 : 33.33;
                    const absentWidth = total > 0 ? (dailyAttendanceSummary.absent / total) * 100 : 33.33;
                    const lateWidth = total > 0 ? (dailyAttendanceSummary.late / total) * 100 : 33.33;
                    return (
                      <>
                        <div
                          className="bg-[#2E7D32] flex items-center justify-center text-xs text-white"
                          style={{ width: `${presentWidth}%`, minWidth: total === 0 ? "33.33%" : "auto" }}
                          title={`Present: ${dailyAttendanceSummary.present}`}
                        >
                          {dailyAttendanceSummary.present > 0 && <span>{dailyAttendanceSummary.present}</span>}
                        </div>
                        <div
                          className="bg-[#D32F2F] flex items-center justify-center text-xs text-white"
                          style={{ width: `${absentWidth}%`, minWidth: total === 0 ? "33.33%" : "auto" }}
                          title={`Absent: ${dailyAttendanceSummary.absent}`}
                        >
                          {dailyAttendanceSummary.absent > 0 && <span>{dailyAttendanceSummary.absent}</span>}
                        </div>
                        <div
                          className="bg-[#ED6C02] flex items-center justify-center text-xs text-white"
                          style={{ width: `${lateWidth}%`, minWidth: total === 0 ? "33.33%" : "auto" }}
                          title={`Late: ${dailyAttendanceSummary.late}`}
                        >
                          {dailyAttendanceSummary.late > 0 && <span>{dailyAttendanceSummary.late}</span>}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between text-sm text-[#B0B0B0]">
                  <span>
                    Present: <span className="text-[#A5D6A7] font-bold">{dailyAttendanceSummary.present}</span>
                  </span>
                  <span>
                    Absent: <span className="text-[#EF9A9A] font-bold">{dailyAttendanceSummary.absent}</span>
                  </span>
                  <span>
                    Late: <span className="text-[#FFE082] font-bold">{dailyAttendanceSummary.late}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Student Search Container */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
              <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Student Search</h2>
              <div className="relative max-w-lg">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudent(null);
                  }}
                  placeholder="Search student by name..."
                  className="w-full px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                  autoComplete="off"
                  aria-label="Search student by name"
                />
                {studentSearch && filteredStudentSearch.length > 0 && (
                  <ul
                    className="absolute z-10 left-0 right-0 bg-[#232323] border border-[#2D2D2D] rounded-lg mt-2 shadow-lg max-h-60 overflow-y-auto"
                    role="listbox"
                  >
                    {filteredStudentSearch.map((s: Student) => (
                      <li
                        key={s.id}
                        className="px-4 py-2 cursor-pointer hover:bg-[#3A86FF] hover:text-white transition-colors"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch(s.name);
                        }}
                        role="option"
                        aria-selected={selectedStudent?.id === s.id}
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
                {studentSearch && filteredStudentSearch.length === 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-[#232323] border border-[#2D2D2D] rounded-lg mt-2 shadow-lg p-4 text-[#B0B0B0]">
                    No students found
                  </div>
                )}
              </div>
              {selectedStudent && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Student Profile */}
                  <div className="bg-[#232323] rounded-lg p-6 border border-[#2D2D2D] shadow">
                    <h3 className="text-2xl font-bold text-[#F1F1F1] mb-2">{selectedStudent.name}</h3>
                    <p className="text-[#B0B0B0] mb-1">
                      ID: <span className="text-[#EAEAEA]">{selectedStudent.id}</span>
                    </p>
                    <p className="text-[#B0B0B0] mb-1">
                      Standard: <span className="text-[#EAEAEA]">{selectedStudent.standard || "-"}</span>
                    </p>
                    <p className="text-[#B0B0B0] mb-1">
                      Attendance Records: <span className="text-[#EAEAEA]">{studentAttendanceHistory.total}</span>
                    </p>
                  </div>
                  {/* Attendance History Graph */}
                  <div className="bg-[#232323] rounded-lg p-6 border border-[#2D2D2D] shadow flex flex-col items-center">
                    <h4 className="text-lg font-semibold text-[#F1F1F1] mb-4">Attendance History</h4>
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                      <div className="w-full h-8 flex rounded-lg overflow-hidden border border-[#2D2D2D]">
                        {(() => {
                          const total =
                            studentAttendanceHistory.present +
                            studentAttendanceHistory.absent +
                            studentAttendanceHistory.late;
                          const presentWidth = total > 0 ? (studentAttendanceHistory.present / total) * 100 : 33.33;
                          const absentWidth = total > 0 ? (studentAttendanceHistory.absent / total) * 100 : 33.33;
                          const lateWidth = total > 0 ? (studentAttendanceHistory.late / total) * 100 : 33.33;
                          return (
                            <>
                              <div
                                className="bg-[#2E7D32] flex items-center justify-center text-xs text-white"
                                style={{ width: `${presentWidth}%`, minWidth: total === 0 ? "33.33%" : "auto" }}
                                title={`Present: ${studentAttendanceHistory.present} days`}
                              >
                                {studentAttendanceHistory.present > 0 && (
                                  <span>{studentAttendanceHistory.present}</span>
                                )}
                              </div>
                              <div
                                className="bg-[#D32F2F] flex items-center justify-center text-xs text-white"
                                style={{ width: `${absentWidth}%`, minWidth: total === 0 ? "33.33%" : "auto" }}
                                title={`Absent: ${studentAttendanceHistory.absent} days`}
                              >
                                {studentAttendanceHistory.absent > 0 && (
                                  <span>{studentAttendanceHistory.absent}</span>
                                )}
                              </div>
                              <div
                                className="bg-[#ED6C02] flex items-center justify-center text-xs text-white"
                                style={{ width: `${lateWidth}%`, minWidth: total === 0 ? "33.33%" : "auto" }}
                                title={`Late: ${studentAttendanceHistory.late} days`}
                              >
                                {studentAttendanceHistory.late > 0 && <span>{studentAttendanceHistory.late}</span>}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between text-sm text-[#B0B0B0] w-full">
                        <span>
                          Present: <span className="text-[#A5D6A7] font-bold">{studentAttendanceHistory.present} days</span>
                        </span>
                        <span>
                          Absent: <span className="text-[#EF9A9A] font-bold">{studentAttendanceHistory.absent} days</span>
                        </span>
                        <span>
                          Late: <span className="text-[#FFE082] font-bold">{studentAttendanceHistory.late} days</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Calendar Container */}
              {selectedStudent && (
                <div className="mt-8 bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
                  <h4 className="text-lg font-semibold text-[#F1F1F1] mb-4">Attendance Calendar</h4>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      className="px-3 py-1 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200"
                      onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
                      aria-label="Previous month"
                    >
                      &#8592;
                    </button>
                    <span className="font-semibold text-[#EAEAEA]">
                      {calendarDate.toLocaleString("default", { month: "long" })} {calendarDate.getFullYear()}
                    </span>
                    <button
                      className="px-3 py-1 border border-[#2D2D2D] rounded-lg text-[#EAEAEA] bg-[#1E1E1E] hover:bg-[#3A86FF]/20 hover:text-[#3A86FF] transition-colors duration-200"
                      onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
                      aria-label="Next month"
                    >
                      &#8594;
                    </button>
                  </div>
                  <table className="w-full text-[#EAEAEA]">
                    <thead>
                      <tr>
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <th
                            key={d}
                            className="py-2 text-xs font-semibold text-[#B0B0B0] uppercase border-b border-[#2D2D2D]"
                            scope="col"
                          >
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let day = 1 - startDay;
                        const weeks: React.ReactElement[][] = [];
                        for (let w = 0; w < 6 && day <= daysInMonth; w++) {
                          const week: React.ReactElement[] = [];
                          for (let d = 0; d < 7; d++, day++) {
                            const dateObj = new Date(currentYear, currentMonth, day);
                            const isCurrentMonth = dateObj.getMonth() === currentMonth;
                            const dateStr = dateObj.toISOString().slice(0, 10);
                            const status = attendanceByDate[dateStr];
                            week.push(
                              <td key={d} className="text-center p-1">
                                {isCurrentMonth && day > 0 && day <= daysInMonth ? (
                                  <div
                                    className={`w-full h-8 rounded-xl border font-semibold transition-colors duration-200 ${status ? statusColor[status] : "bg-[#1E1E1E] border-[#2D2D2D] text-[#EAEAEA]"
                                      }`}
                                    title={status ? `${status.charAt(0).toUpperCase() + status.slice(1)}` : "No record"}
                                  >
                                    {day}
                                  </div>
                                ) : (
                                  <span className="w-full h-8 inline-block text-transparent"> </span>
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
              )}
            </div>
          </div>
        )}

        {/* Manage People Tab */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex border-b-2 border-[#2D2D2D]" role="tablist">
              <button
                role="tab"
                aria-selected={manageSubTab === "teachers"}
                onClick={() => setManageSubTab("teachers")}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${manageSubTab === "teachers"
                    ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
                    : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"
                  }`}
              >
                Teachers
              </button>
              <button
                role="tab"
                aria-selected={manageSubTab === "students"}
                onClick={() => setManageSubTab("students")}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 ${manageSubTab === "students"
                    ? "text-[#3A86FF] border-b-2 border-[#3A86FF] bg-[#1E1E1E]"
                    : "text-[#B0B0B0] hover:text-[#D1D1D1] hover:bg-[#2D2D2D]"
                  }`}
              >
                Students
              </button>
            </div>

            {/* Teachers Management */}
            {manageSubTab === "teachers" && (
              <div className="space-y-6">
                {/* Add Teacher */}
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Add Teacher</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newTeacher}
                      onChange={(e) => setNewTeacher(e.target.value)}
                      className="flex-1 px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                      placeholder="Teacher Name"
                      aria-label="Teacher name"
                    />
                    <button
                      onClick={addTeacher}
                      className="px-6 py-3 bg-[#3A86FF] text-[#F1F1F1] rounded-lg hover:bg-[#4361EE] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                    >
                      Add Teacher
                    </button>
                  </div>
                </div>

                {/* Teachers List */}
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]" ref={teacherContainerRef}>
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Current Teachers</h2>
                  {teachers.length === 0 ? (
                    <div className="text-center py-8 text-[#B0B0B0] bg-[#2D2D2D] rounded-lg border border-[#3A3A3A]">
                      No teachers added yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teachers.map((t) => (
                        <div
                          key={t.username}
                          className="border border-[#3A3A3A] rounded-lg p-5 hover:shadow-md transition-all duration-300 bg-[#1E1E1E]"
                        >
                          <h3 className="font-medium text-[#EAEAEA]">{t.name}</h3>
                          <div className="text-sm text-[#B0B0B0]">Username: <span className="font-mono">{t.username}</span></div>
                          <div className="text-sm text-[#B0B0B0]">Password: <span className="font-mono">{t.password}</span></div>
                          <button
                            onClick={() => setEditingTeacher(t.username)}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTeacher(t.name)}
                            className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Students Management */}
            {manageSubTab === "students" && (
              <div className="space-y-6">
                {/* Add Student */}
                <div className="bg-[#1E1E1E] rounded-xl p-4 sm:p-6 border border-[#2D2D2D]">
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Add Student</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                        placeholder="Student Name"
                        aria-label="Student name"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          if (e.target.value && !/^\d{5}$/.test(e.target.value)) {
                            setCsvError("Student ID must be 5 digits");
                          } else {
                            setCsvError(null);
                          }
                        }}
                        className="w-full px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                        placeholder="5-digit ID"
                        maxLength={5}
                        aria-label="Student ID"
                      />
                      {csvError && <p className="text-[#EF9A9A] text-sm mt-1">{csvError}</p>}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={studentStandard}
                        onChange={(e) => setStudentStandard(e.target.value)}
                        className="w-full px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                        placeholder="Standard"
                        aria-label="Student standard"
                      />
                    </div>
                    <div className="flex-1">
                      <select
                        value={studentTeacher}
                        onChange={(e) => setStudentTeacher(e.target.value)}
                        className="w-full px-4 py-3 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 shadow-sm bg-[#121212] text-[#EAEAEA]"
                        aria-label="Assign teacher"
                      >
                        <option value="">Assign Teacher</option>
                        {teachers.map((t) => (
                          <option key={t.username} value={t.username}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={addStudent}
                      className="px-6 py-3 bg-[#3A86FF] text-[#F1F1F1] rounded-lg hover:bg-[#4361EE] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                      aria-label="Add student"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Student
                    </button>
                  </div>
                </div>

                {/* Upload CSV */}
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Upload Students CSV</h2>
                  <div className="border-2 border-dashed border-[#3A3A3A] rounded-lg p-8 text-center bg-[#2D2D2D]">
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
                      <label className="px-6 py-3 bg-[#3A86FF] text-[#F1F1F1] rounded-lg hover:bg-[#4361EE] transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer font-medium">
                        Choose File
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                          aria-label="Upload student CSV"
                        />
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
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
                  <h2 className="text-xl font-semibold text-[#F1F1F1] mb-4">Current Students</h2>
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-[#B0B0B0] bg-[#2D2D2D] rounded-lg border border-[#3A3A3A]">
                      No students added yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[#3A3A3A] rounded-lg shadow-sm">
                      <table className="min-w-full divide-y divide-[#3A3A3A]" ref={studentTableRef}>
                        <thead className="bg-[#2D2D2D]">
                          <tr>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                              scope="col"
                            >
                              Name
                            </th>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                              scope="col"
                            >
                              ID
                            </th>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                              scope="col"
                            >
                              Standard
                            </th>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                              scope="col"
                            >
                              Teacher
                            </th>
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider"
                              scope="col"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-[#1E1E1E] divide-y divide-[#3A3A3A]">
                          {students.map((s) =>
                            editingStudentId === s.id ? (
                              <tr key={s.id} className="bg-[#2D2D2D]">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={editingStudentData?.name || ""}
                                    onChange={(e) =>
                                      setEditingStudentData((prev) => ({
                                        ...prev!,
                                        name: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 border border-[#2D2D2D] rounded bg-[#121212] text-[#EAEAEA] focus:ring-2 focus:ring-[#3A86FF]"
                                    aria-label="Edit student name"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveStudentEdit();
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={editingStudentData?.id || ""}
                                    onChange={(e) =>
                                      setEditingStudentData((prev) => ({
                                        ...prev!,
                                        id: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 border border-[#2D2D2D] rounded bg-[#121212] text-[#EAEAEA] focus:ring-2 focus:ring-[#3A86FF]"
                                    maxLength={5}
                                    aria-label="Edit student ID"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveStudentEdit();
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={editingStudentData?.standard || ""}
                                    onChange={(e) =>
                                      setEditingStudentData((prev) => ({
                                        ...prev!,
                                        standard: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 border border-[#2D2D2D] rounded bg-[#121212] text-[#EAEAEA] focus:ring-2 focus:ring-[#3A86FF]"
                                    aria-label="Edit student standard"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveStudentEdit();
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <select
                                    value={editingStudentData?.teacher || ""}
                                    onChange={(e) =>
                                      setEditingStudentData((prev) => ({
                                        ...prev!,
                                        teacher: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 border border-[#2D2D2D] rounded bg-[#121212] text-[#EAEAEA] focus:ring-2 focus:ring-[#3A86FF]"
                                    aria-label="Edit assigned teacher"
                                  >
                                    <option value="">No Teacher</option>
                                    {teachers.map((t) => (
                                      <option key={t.username} value={t.username}>
                                        {t.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <button
                                    onClick={saveStudentEdit}
                                    className="text-[#3A86FF] hover:text-[#4361EE] mr-2"
                                    aria-label="Save student edits"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingStudentId(null);
                                      setEditingStudentData(null);
                                    }}
                                    className="text-[#B0B0B0] hover:text-[#D1D1D1]"
                                    aria-label="Cancel student edits"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            ) : (
                              <tr key={s.id} className="hover:bg-[#2D2D2D] transition-colors duration-200">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#EAEAEA]">
                                  {s.name}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">{s.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">
                                  {s.standard || "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#B0B0B0]">
                                  {(() => {
                                    const teacher = teachers.find((t) => assignments[t.username]?.includes(s.id));
                                    return teacher ? teacher.name : "-";
                                  })()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => {
                                      setEditingStudentId(s.id);
                                      setEditingStudentData({
                                        name: s.name,
                                        id: s.id,
                                        standard: s.standard || "",
                                        teacher: (() => {
                                          const teacher = teachers.find((t) => assignments[t.username]?.includes(s.id));
                                          return teacher ? teacher.name : "";
                                        })(),
                                      });
                                    }}
                                    className="text-[#3A86FF] hover:text-[#4361EE] mr-2"
                                    aria-label={`Edit student ${s.name}`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteStudent(s.id)}
                                    className="text-[#EF9A9A] hover:text-[#D32F2F] transition-colors duration-200"
                                    aria-label={`Delete student ${s.name}`}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}