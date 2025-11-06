"use client";

import type { School, Class } from "./page";
import { useMemo, useState } from "react";
import type { AttendanceMap, ClassAssignments, Student, AttendanceStatus } from "./page";

interface AdminProps {
  goBack: () => void;
  school: School;
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  assignments: ClassAssignments;
  setAssignments: React.Dispatch<React.SetStateAction<ClassAssignments>>;
  attendance: AttendanceMap;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceMap>>;
}

export default function AdminDashboard({
  goBack,
  school,
  classes,
  setClasses,
  students,
  setStudents,
  assignments,
  setAssignments,
  attendance,
  setAttendance,
}: AdminProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');
  const [manageSubTab, setManageSubTab] = useState<'classes' | 'students'>('classes');
  const today = new Date().toISOString().slice(0, 10);

  // Daily attendance summary
  const dailyAttendanceSummary = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
    };
    classes.forEach((cls) => {
      const map = attendance[cls.id]?.[today] ?? {};
      Object.values(map).forEach((status) => {
        if (status === "present" || status === "absent" || status === "late") {
          summary[status] += 1;
        }
      });
    });
    return summary;
  }, [attendance, classes, today]);

  // Class management state
  const [newClassName, setNewClassName] = useState("");
  
  // Student management state
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentStandard, setStudentStandard] = useState("");
  const [studentClass, setStudentClass] = useState("");

  // Add class
  const addClass = async () => {
    const name = newClassName.trim();
    if (!name || classes.some(c => c.name === name)) return;
    
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, schoolId: school.id }),
      });
      
      if (res.ok) {
        const newClass = await res.json();
        setClasses((prev) => [...prev, newClass]);
        setNewClassName("");
      } else {
        const errorData = await res.json();
        alert(`Failed to add class: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding class:', error);
      alert(`Error adding class: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Delete class
  const deleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    try {
      const res = await fetch(`/api/classes?id=${classId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== classId));
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          delete newAssignments[classId];
          return newAssignments;
        });
        setAttendance((prev) => {
          const newAttendance = { ...prev };
          delete newAttendance[classId];
          return newAttendance;
        });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  // Add student
  const addStudent = async () => {
    const name = studentName.trim();
    const id = studentId.trim();
    const standard = studentStandard.trim();
    const className = studentClass.trim();
    
    if (!name || !/^\d{5}$/.test(id) || students.some((s) => s.id === id)) return;
    
    try {
      const cls = classes.find(c => c.name === className);
      const classId = cls?.id || null;
      
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, standard, classId, schoolId: school.id }),
      });
      
      if (res.ok) {
        const newStudent = await res.json();
        setStudents((prev) => [...prev, newStudent]);
        if (classId) {
          setAssignments((prev) => ({
            ...prev,
            [classId]: [...(prev[classId] ?? []), id],
          }));
        }
        setStudentName("");
        setStudentId("");
        setStudentStandard("");
        setStudentClass("");
      } else {
        const errorData = await res.json();
        alert(`Failed to add student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert(`Error adding student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Delete student
  const deleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          Object.keys(newAssignments).forEach((classId) => {
            newAssignments[classId] = newAssignments[classId].filter((sid) => sid !== studentId);
          });
          return newAssignments;
        });
        setAttendance((prev) => {
          const newAttendance = { ...prev };
          Object.keys(newAttendance).forEach((classId) => {
            Object.keys(newAttendance[classId] ?? {}).forEach((date) => {
              if (newAttendance[classId][date][studentId]) {
                delete newAttendance[classId][date][studentId];
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

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-12 font-sans text-[#EAEAEA]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#F1F1F1] tracking-tight">Admin Dashboard</h1>
            <p className="text-[#EAEAEA] mt-2 text-base">{school.name} - Manage classes, students, and attendance</p>
          </div>
          <button
            onClick={goBack}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#D32F2F] text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-[#2D2D2D]">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 font-semibold text-lg transition-colors duration-200 ${
              activeTab === 'view'
                ? 'text-[#3A86FF] border-b-2 border-[#3A86FF]'
                : 'text-[#EAEAEA] hover:text-[#3A86FF]'
            }`}
          >
            View Records
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 font-semibold text-lg transition-colors duration-200 ${
              activeTab === 'manage'
                ? 'text-[#3A86FF] border-b-2 border-[#3A86FF]'
                : 'text-[#EAEAEA] hover:text-[#3A86FF]'
            }`}
          >
            Manage
          </button>
        </div>

        {/* View Tab */}
        {activeTab === 'view' && (
          <div className="space-y-8">
            {/* Daily Summary */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
              <h2 className="text-2xl font-bold text-[#F1F1F1] mb-4">Today's Attendance Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121212] p-6 rounded-lg border border-[#2D2D2D]">
                  <div className="text-[#4CAF50] text-4xl font-bold">{dailyAttendanceSummary.present}</div>
                  <div className="text-[#EAEAEA] mt-2">Present</div>
                </div>
                <div className="bg-[#121212] p-6 rounded-lg border border-[#2D2D2D]">
                  <div className="text-[#ED6C02] text-4xl font-bold">{dailyAttendanceSummary.late}</div>
                  <div className="text-[#EAEAEA] mt-2">Late</div>
                </div>
                <div className="bg-[#121212] p-6 rounded-lg border border-[#2D2D2D]">
                  <div className="text-[#D32F2F] text-4xl font-bold">{dailyAttendanceSummary.absent}</div>
                  <div className="text-[#EAEAEA] mt-2">Absent</div>
                </div>
              </div>
            </div>

            {/* Classes Overview */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
              <h2 className="text-2xl font-bold text-[#F1F1F1] mb-4">Classes ({classes.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="bg-[#121212] p-4 rounded-lg border border-[#2D2D2D]">
                    <div className="text-[#F1F1F1] font-semibold text-lg">{cls.name}</div>
                    <div className="text-[#EAEAEA] text-sm mt-1">
                      {assignments[cls.id]?.length || 0} students
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Students Overview */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
              <h2 className="text-2xl font-bold text-[#F1F1F1] mb-4">All Students ({students.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2D2D2D]">
                      <th className="text-left py-3 px-4 text-[#EAEAEA]">ID</th>
                      <th className="text-left py-3 px-4 text-[#EAEAEA]">Name</th>
                      <th className="text-left py-3 px-4 text-[#EAEAEA]">Standard</th>
                      <th className="text-left py-3 px-4 text-[#EAEAEA]">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const studentClass = classes.find(c => c.id === student.classId);
                      return (
                        <tr key={student.id} className="border-b border-[#2D2D2D] hover:bg-[#2D2D2D]">
                          <td className="py-3 px-4 text-[#EAEAEA]">{student.id}</td>
                          <td className="py-3 px-4 text-[#F1F1F1]">{student.name}</td>
                          <td className="py-3 px-4 text-[#EAEAEA]">{student.standard || '-'}</td>
                          <td className="py-3 px-4 text-[#EAEAEA]">{studentClass?.name || 'Unassigned'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-8">
            {/* Sub-tab navigation */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setManageSubTab('classes')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  manageSubTab === 'classes'
                    ? 'bg-[#3A86FF] text-white'
                    : 'bg-[#1E1E1E] text-[#EAEAEA] hover:bg-[#2D2D2D]'
                }`}
              >
                Manage Classes
              </button>
              <button
                onClick={() => setManageSubTab('students')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  manageSubTab === 'students'
                    ? 'bg-[#3A86FF] text-white'
                    : 'bg-[#1E1E1E] text-[#EAEAEA] hover:bg-[#2D2D2D]'
                }`}
              >
                Manage Students
              </button>
            </div>

            {/* Manage Classes */}
            {manageSubTab === 'classes' && (
              <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
                <h2 className="text-2xl font-bold text-[#F1F1F1] mb-6">Manage Classes</h2>
                
                {/* Add Class Form */}
                <div className="mb-8 p-4 bg-[#121212] rounded-lg border border-[#2D2D2D]">
                  <h3 className="text-lg font-semibold text-[#F1F1F1] mb-4">Add New Class</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Class name (e.g., Grade 5A)"
                      className="flex-1 px-4 py-2 rounded-lg bg-[#1E1E1E] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                    />
                    <button
                      onClick={addClass}
                      className="px-6 py-2 rounded-lg bg-[#3A86FF] text-white font-semibold hover:bg-[#4361EE] transition-colors duration-200"
                    >
                      Add Class
                    </button>
                  </div>
                </div>

                {/* Classes List */}
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-[#2D2D2D]">
                      <div>
                        <div className="text-[#F1F1F1] font-semibold">{cls.name}</div>
                        <div className="text-[#EAEAEA] text-sm">{assignments[cls.id]?.length || 0} students</div>
                      </div>
                      <button
                        onClick={() => deleteClass(cls.id)}
                        className="px-4 py-2 rounded-lg bg-[#D32F2F] text-white font-semibold hover:bg-[#C62828] transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manage Students */}
            {manageSubTab === 'students' && (
              <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D]">
                <h2 className="text-2xl font-bold text-[#F1F1F1] mb-6">Manage Students</h2>
                
                {/* Add Student Form */}
                <div className="mb-8 p-4 bg-[#121212] rounded-lg border border-[#2D2D2D]">
                  <h3 className="text-lg font-semibold text-[#F1F1F1] mb-4">Add New Student</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Student name"
                      className="px-4 py-2 rounded-lg bg-[#1E1E1E] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="5-digit ID"
                      maxLength={5}
                      className="px-4 py-2 rounded-lg bg-[#1E1E1E] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={studentStandard}
                      onChange={(e) => setStudentStandard(e.target.value)}
                      placeholder="Standard (optional)"
                      className="px-4 py-2 rounded-lg bg-[#1E1E1E] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                    />
                    <select
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#1E1E1E] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                    >
                      <option value="">Select class (optional)</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={addStudent}
                    className="w-full px-6 py-2 rounded-lg bg-[#3A86FF] text-white font-semibold hover:bg-[#4361EE] transition-colors duration-200"
                  >
                    Add Student
                  </button>
                </div>

                {/* Students List */}
                <div className="space-y-3">
                  {students.map((student) => {
                    const studentClass = classes.find(c => c.id === student.classId);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-[#2D2D2D]">
                        <div>
                          <div className="text-[#F1F1F1] font-semibold">{student.name}</div>
                          <div className="text-[#EAEAEA] text-sm">
                            ID: {student.id} | Class: {studentClass?.name || 'Unassigned'} | Standard: {student.standard || '-'}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="px-4 py-2 rounded-lg bg-[#D32F2F] text-white font-semibold hover:bg-[#C62828] transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
