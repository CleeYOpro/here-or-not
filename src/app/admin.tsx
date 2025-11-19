"use client";

import type { School, Class } from "./page";
import { useMemo, useState } from "react";
import type { AttendanceMap, ClassAssignments, Student, AttendanceStatus } from "./page";
import StudentSearchOverview from "./components/StudentSearchOverview";

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
  
  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  
  // Inline editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    standard: string;
    classId: string;
  }>({ name: "", standard: "", classId: "" });

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
  
  // CSV Upload handler
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    
    setUploading(true);
    setUploadMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('schoolId', school.id);
      
      const res = await fetch('/api/students/csv', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUploadMessage(`✅ Success! Created: ${data.results.created}, Updated: ${data.results.updated}, Classes Created: ${data.results.classesCreated}`);
        
        // Refresh students and classes
        const studentsRes = await fetch(`/api/students?schoolId=${school.id}`);
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
        
        const classesRes = await fetch(`/api/classes?schoolId=${school.id}`);
        const classesData = await classesRes.json();
        setClasses(classesData);
        
        // Rebuild assignments
        const assignmentsMap: ClassAssignments = {};
        studentsData.forEach((student: Student) => {
          if (student.classId) {
            if (!assignmentsMap[student.classId]) {
              assignmentsMap[student.classId] = [];
            }
            assignmentsMap[student.classId].push(student.id);
          }
        });
        setAssignments(assignmentsMap);
        
        setCsvFile(null);
      } else {
        setUploadMessage(`❌ Error: ${data.error}${data.details ? ' - ' + data.details.join(', ') : ''}`);
      }
    } catch (error) {
      console.error('CSV upload error:', error);
      setUploadMessage('❌ Failed to upload CSV file');
    } finally {
      setUploading(false);
    }
  };
  
  // Start editing a student
  const startEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditForm({
      name: student.name,
      standard: student.standard || "",
      classId: student.classId || "",
    });
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditingStudentId(null);
    setEditForm({ name: "", standard: "", classId: "" });
  };
  
  // Save edited student
  const saveEdit = async (studentId: string) => {
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          name: editForm.name,
          standard: editForm.standard,
          classId: editForm.classId || null,
          schoolId: school.id,
        }),
      });
      
      if (res.ok) {
        const updatedStudent = await res.json();
        setStudents((prev) => prev.map((s) => s.id === studentId ? updatedStudent : s));
        
        // Update assignments
        setAssignments((prev) => {
          const newAssignments = { ...prev };
          // Remove from old class
          Object.keys(newAssignments).forEach((classId) => {
            newAssignments[classId] = newAssignments[classId].filter((sid) => sid !== studentId);
          });
          // Add to new class
          if (editForm.classId) {
            if (!newAssignments[editForm.classId]) {
              newAssignments[editForm.classId] = [];
            }
            newAssignments[editForm.classId].push(studentId);
          }
          return newAssignments;
        });
        
        cancelEdit();
      } else {
        const errorData = await res.json();
        alert(`Failed to update student: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert(`Error updating student: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              <h2 className="text-2xl font-bold text-[#F1F1F1] mb-4">Today&apos;s Attendance Summary</h2>
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
            {/* Student Search & Attendance Overview */}
            <StudentSearchOverview
              students={students}
              classes={classes}
              schoolId={school.id}
              onStudentUpdate={(updatedStudent) => {
                setStudents((prev) => prev.map((s) => s.id === updatedStudent.id ? updatedStudent : s));
                // Update assignments if class changed
                setAssignments((prev) => {
                  const newAssignments = { ...prev };
                  // Remove from all classes
                  Object.keys(newAssignments).forEach((classId) => {
                    newAssignments[classId] = newAssignments[classId].filter((sid) => sid !== updatedStudent.id);
                  });
                  // Add to new class
                  if (updatedStudent.classId) {
                    if (!newAssignments[updatedStudent.classId]) {
                      newAssignments[updatedStudent.classId] = [];
                    }
                    newAssignments[updatedStudent.classId].push(updatedStudent.id);
                  }
                  return newAssignments;
                });
              }}
            />
            
            
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
                
                {/* CSV Upload Section */}
                <div className="mb-8 p-4 bg-[#121212] rounded-lg border border-[#2D2D2D]">
                  <h3 className="text-lg font-semibold text-[#F1F1F1] mb-4">Upload Students via CSV</h3>
                  <p className="text-[#EAEAEA] text-sm mb-4">
                    CSV must contain columns: <strong>name</strong>, <strong>number</strong> (5 digits), <strong>grade</strong>, <strong>class</strong>
                  </p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="flex-1 px-4 py-2 rounded-lg bg-[#1E1E1E] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#3A86FF] file:text-white file:cursor-pointer hover:file:bg-[#4361EE]"
                    />
                    <button
                      onClick={handleCsvUpload}
                      disabled={!csvFile || uploading}
                      className="px-6 py-2 rounded-lg bg-[#3A86FF] text-white font-semibold hover:bg-[#4361EE] transition-colors duration-200 disabled:bg-[#2D2D2D] disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : 'Upload CSV'}
                    </button>
                  </div>
                  {uploadMessage && (
                    <div className={`mt-4 p-3 rounded-lg ${uploadMessage.startsWith('✅') ? 'bg-[#1B5E20] text-[#4CAF50]' : 'bg-[#451A1A] text-[#ff4d4f]'}`}>
                      {uploadMessage}
                    </div>
                  )}
                </div>
                
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
                      placeholder="Grade (optional)"
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

                {/* Editable Students Table */}
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-[#F1F1F1] mb-4">All Students ({students.length})</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#121212] border-b border-[#2D2D2D]">
                        <th className="px-4 py-3 text-left text-[#F1F1F1] font-semibold">ID</th>
                        <th className="px-4 py-3 text-left text-[#F1F1F1] font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-[#F1F1F1] font-semibold">Grade</th>
                        <th className="px-4 py-3 text-left text-[#F1F1F1] font-semibold">Class</th>
                        <th className="px-4 py-3 text-left text-[#F1F1F1] font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const isEditing = editingStudentId === student.id;
                        const studentClass = classes.find(c => c.id === student.classId);
                        
                        return (
                          <tr key={student.id} className="border-b border-[#2D2D2D] hover:bg-[#121212] transition-colors">
                            <td className="px-4 py-3 text-[#EAEAEA]">{student.id}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full px-3 py-1 rounded bg-[#121212] text-white border border-[#3A86FF] focus:outline-none"
                                />
                              ) : (
                                <span className="text-[#F1F1F1]">{student.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.standard}
                                  onChange={(e) => setEditForm({ ...editForm, standard: e.target.value })}
                                  className="w-full px-3 py-1 rounded bg-[#121212] text-white border border-[#3A86FF] focus:outline-none"
                                />
                              ) : (
                                <span className="text-[#EAEAEA]">{student.standard || '-'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={editForm.classId}
                                  onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                                  className="w-full px-3 py-1 rounded bg-[#121212] text-white border border-[#3A86FF] focus:outline-none"
                                >
                                  <option value="">Unassigned</option>
                                  {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[#EAEAEA]">{studentClass?.name || 'Unassigned'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(student.id)}
                                    className="px-3 py-1 rounded bg-[#4CAF50] text-white text-sm font-semibold hover:bg-[#45A049] transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-3 py-1 rounded bg-[#757575] text-white text-sm font-semibold hover:bg-[#616161] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEdit(student)}
                                    className="px-3 py-1 rounded bg-[#3A86FF] text-white text-sm font-semibold hover:bg-[#4361EE] transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteStudent(student.id)}
                                    className="px-3 py-1 rounded bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#C62828] transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="text-center py-8 text-[#EAEAEA]">
                      No students found. Add students manually or upload a CSV file.
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
