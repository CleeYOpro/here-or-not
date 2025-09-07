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
}: AdminProps) {
  // Local form state
  const [newTeacher, setNewTeacher] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"view" | "manage">("view");
  const [manageSubTab, setManageSubTab] = useState<"teachers" | "students">("teachers");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []); // YYYY-MM-DD

  // Derived maps
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
    if (!name || !/^\d{5}$/.test(id)) return; // 5-digit id
    if (students.some((s) => s.id === id)) return; // unique id
    setStudents((prev) => [...prev, { id, name }]);
    setStudentName("");
    setStudentId("");
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
    setTeachers(prev => prev.filter(t => t !== teacherName));
    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[teacherName];
      return newAssignments;
    });
    setAttendance(prev => {
      const newAttendance = { ...prev };
      delete newAttendance[teacherName];
      return newAttendance;
    });
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setAssignments(prev => {
      const newAssignments: Assignments = {};
      Object.keys(prev).forEach(teacher => {
        newAssignments[teacher] = prev[teacher].filter(id => id !== studentId);
      });
      return newAssignments;
    });
    setAttendance(prev => {
      const newAttendance: AttendanceMap = {};
      Object.keys(prev).forEach(teacher => {
        newAttendance[teacher] = {};
        Object.keys(prev[teacher]).forEach(date => {
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
        const lines = text.split('\n');
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

          const parts = trimmedLine.split(',').map(part => part.trim());
          if (parts.length < 4) {
            errors.push(`Row ${index+2}: Expected 4 columns but got ${parts.length}`);
            return;
          }

          const [name, standard, id, teacherName] = parts;

          // Validate student id
          if (!/^\d{5}$/.test(id)) {
            errors.push(`Row ${index+2}: Student ID must be 5 digits`);
            return;
          }

          // Check if teacher exists, if not, add to newTeachers
          if (!teachers.includes(teacherName) && !newTeachers.includes(teacherName)) {
            newTeachers.push(teacherName);
          }

          // Check if student exists (by id) in current students or in newStudents we are adding
          if (students.some(s => s.id === id) || newStudents.some(s => s.id === id)) {
            // Skip duplicate student
            return;
          }

          // Add student
          newStudents.push({
            id,
            name,
            standard: standard || undefined,
          });

          // Assign student to teacher
          if (!newAssignments[teacherName]) {
            newAssignments[teacherName] = [];
          }
          if (!newAssignments[teacherName].includes(id)) {
            newAssignments[teacherName].push(id);
          }
        });

        if (errors.length > 0) {
          setCsvError(errors.join('; '));
          return;
        }

        // Update state
        setTeachers(prev => [...prev, ...newTeachers]);
        setStudents(prev => [...prev, ...newStudents]);
        setAssignments(newAssignments);
        
        // Reset file input
        event.target.value = '';
      } catch (error) {
        setCsvError("Error processing CSV file");
      }
    };
    reader.readAsText(file);
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage teachers, students, and attendance</p>
          </div>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Login
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${activeTab === "view" 
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            View Records
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${activeTab === "manage" 
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            Manage People
          </button>
        </div>

        {/* View Records Tab */}
        {activeTab === "view" && (
          <div className="space-y-6">
            {/* Search Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Teachers</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by teacher name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <select
                    value={selectedTeacherForView || ""}
                    onChange={(e) => setSelectedTeacherForView(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="">Select a teacher</option>
                    {filteredTeachers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Teacher Details */}
            {selectedTeacherForView && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{selectedTeacherForView}</h2>
                  <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {today}
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Attendance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const counts = summarizeAttendance(selectedTeacherForView, today);
                      return (
                        <>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="text-2xl font-bold text-green-700">{counts.present}</div>
                            <div className="text-green-600">Present</div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                            <div className="text-2xl font-bold text-red-700">{counts.absent}</div>
                            <div className="text-red-600">Absent</div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                            <div className="text-2xl font-bold text-yellow-700">{counts.late}</div>
                            <div className="text-yellow-600">Late</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Assigned Students */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Assigned Students</h3>
                  {(() => {
                    const assignedStudents = students.filter(s => 
                      assignedForTeacher(selectedTeacherForView).has(s.id)
                    );
                    
                    if (assignedStudents.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          No students assigned to this teacher
                        </div>
                      );
                    }
                    
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {assignedStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.standard || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => unassignStudent(selectedTeacherForView, s.id)}
                                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
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
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setManageSubTab("teachers")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${manageSubTab === "teachers" 
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                Teachers
              </button>
              <button
                onClick={() => setManageSubTab("students")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${manageSubTab === "students" 
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                Students
              </button>
            </div>

            {/* Teachers Management */}
            {manageSubTab === "teachers" && (
              <div className="space-y-6">
                {/* Add Teacher */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Teacher</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newTeacher}
                      onChange={(e) => setNewTeacher(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Teacher Name"
                    />
                    <button
                      onClick={addTeacher}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Teacher
                    </button>
                  </div>
                </div>

                {/* Teachers List */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Teachers</h2>
                  {teachers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      No teachers added yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teachers.map((t) => (
                        <div key={t} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-800">{t}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {assignedForTeacher(t).size} students assigned
                              </p>
                            </div>
                            <button
                              onClick={() => deleteTeacher(t)}
                              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
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
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Student</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Student Name"
                    />
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="5-digit ID"
                      maxLength={5}
                    />
                    <button
                      onClick={addStudent}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Student
                    </button>
                  </div>
                </div>

                {/* Upload CSV */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Students CSV</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600 mb-2">Upload a CSV file with student data</p>
                      <p className="text-sm text-gray-500 mb-4">Columns: Name, Standard, ID, Teacher</p>
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                        Choose File
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {csvError && (
                      <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {csvError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Students</h2>
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      No students added yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{s.standard || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => deleteStudent(s.id)}
                                  className="text-red-600 hover:text-red-900 transition-colors duration-200"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}