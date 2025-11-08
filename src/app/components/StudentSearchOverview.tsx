"use client";

import { useState, useEffect, useMemo } from "react";
import type { Student, Class } from "../page";

interface StudentSearchOverviewProps {
  students: Student[];
  classes: Class[];
  schoolId: string;
  onStudentUpdate: (updatedStudent: Student) => void;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late";
  studentId: string;
  classId: string;
  schoolId: string;
}

interface AttendanceHistory {
  attendance: AttendanceRecord[];
  summary: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

export default function StudentSearchOverview({
  students,
  classes,
  schoolId,
  onStudentUpdate,
}: StudentSearchOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    standard: "",
    classId: "",
  });
  const [saving, setSaving] = useState(false);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter students based on search and class
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filter by class
    if (selectedClassFilter) {
      filtered = filtered.filter((s) => s.classId === selectedClassFilter);
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.id.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [students, debouncedSearchTerm, selectedClassFilter]);

  // Fetch attendance history for selected student
  const fetchAttendanceHistory = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/student?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    fetchAttendanceHistory(student.id);
  };

  const openEditModal = () => {
    if (!selectedStudent) return;
    setEditForm({
      name: selectedStudent.name,
      standard: selectedStudent.standard || "",
      classId: selectedStudent.classId || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditForm({ name: "", standard: "", classId: "" });
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedStudent.id,
          name: editForm.name,
          standard: editForm.standard,
          classId: editForm.classId || null,
          schoolId: schoolId,
        }),
      });

      if (res.ok) {
        const updatedStudent = await res.json();
        setSelectedStudent(updatedStudent);
        onStudentUpdate(updatedStudent);
        closeEditModal();
      } else {
        alert("Failed to update student");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Error updating student");
    } finally {
      setSaving(false);
    }
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getAttendanceForDate = (day: number) => {
    if (!attendanceHistory) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceHistory.attendance.find((a) => a.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Attendance summary calculations
  const attendancePercentages = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.summary.total === 0) {
      return { present: 0, absent: 0, late: 0 };
    }
    const { present, absent, late, total } = attendanceHistory.summary;
    return {
      present: Math.round((present / total) * 100),
      absent: Math.round((absent / total) * 100),
      late: Math.round((late / total) * 100),
    };
  }, [attendanceHistory]);

  const getStudentClass = (student: Student) => {
    return classes.find((c) => c.id === student.classId);
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2D2D2D] mb-8">
      <h2 className="text-2xl font-bold text-[#F1F1F1] mb-6">Student Search & Attendance Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Search */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">
                Search Student
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full px-4 py-3 rounded-lg bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none transition-all duration-200"
              />
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">
                Filter by Class
              </label>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF] focus:outline-none transition-all duration-200"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Results */}
            <div className="mt-4">
              <div className="text-sm text-[#EAEAEA] mb-2">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-[#EAEAEA]">No students found</p>
                    <p className="text-sm text-[#888] mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const studentClass = getStudentClass(student);
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          selectedStudent?.id === student.id
                            ? "bg-[#3A86FF] text-white"
                            : "bg-[#121212] text-[#EAEAEA] hover:bg-[#2D2D2D]"
                        }`}
                      >
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-sm opacity-80">
                          ID: {student.id} • {studentClass?.name || "No class"}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Student Details & Attendance */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <div className="flex items-center justify-center h-full min-h-[400px] text-center">
              <div>
                <div className="text-6xl mb-4">𖨆</div>
                <p className="text-xl text-[#EAEAEA]">Select a student to view details</p>
                <p className="text-sm text-[#888] mt-2">Search and click on a student from the list</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A86FF]"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Details Card */}
              <div className="bg-[#121212] rounded-xl p-6 border border-[#2D2D2D]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[#F1F1F1]">{selectedStudent.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-[#EAEAEA]">
                      <span>ID: <strong>{selectedStudent.id}</strong></span>
                      <span>Grade: <strong>{selectedStudent.standard || "N/A"}</strong></span>
                      <span>Class: <strong>{getStudentClass(selectedStudent)?.name || "Unassigned"}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={openEditModal}
                    className="px-4 py-2 rounded-lg bg-[#3A86FF] text-white font-semibold hover:bg-[#4361EE] transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>

                {/* Attendance Summary */}
                {attendanceHistory && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-[#F1F1F1] mb-3">Attendance Summary</h4>
                    
                    {/* Visual Bar */}
                    <div className="relative h-8 rounded-full overflow-hidden bg-[#1E1E1E] mb-4 group">
                      {attendanceHistory.summary.total > 0 && (
                        <>
                          <div
                            className="absolute h-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] transition-all duration-500"
                            style={{ width: `${attendancePercentages.present}%` }}
                            title={`Present: ${attendanceHistory.summary.present} (${attendancePercentages.present}%)`}
                          />
                          <div
                            className="absolute h-full bg-gradient-to-r from-[#ED6C02] to-[#FF9800]"
                            style={{
                              left: `${attendancePercentages.present}%`,
                              width: `${attendancePercentages.late}%`,
                            }}
                            title={`Late: ${attendanceHistory.summary.late} (${attendancePercentages.late}%)`}
                          />
                          <div
                            className="absolute h-full bg-gradient-to-r from-[#D32F2F] to-[#F44336]"
                            style={{
                              left: `${attendancePercentages.present + attendancePercentages.late}%`,
                              width: `${attendancePercentages.absent}%`,
                            }}
                            title={`Absent: ${attendanceHistory.summary.absent} (${attendancePercentages.absent}%)`}
                          />
                        </>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                          <span className="text-sm text-[#EAEAEA]">Present</span>
                        </div>
                        <div className="text-2xl font-bold text-[#4CAF50]">
                          {attendancePercentages.present}%
                        </div>
                        <div className="text-xs text-[#888]">{attendanceHistory.summary.present} days</div>
                      </div>
                      <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-[#ED6C02]"></div>
                          <span className="text-sm text-[#EAEAEA]">Late</span>
                        </div>
                        <div className="text-2xl font-bold text-[#ED6C02]">
                          {attendancePercentages.late}%
                        </div>
                        <div className="text-xs text-[#888]">{attendanceHistory.summary.late} days</div>
                      </div>
                      <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-[#D32F2F]"></div>
                          <span className="text-sm text-[#EAEAEA]">Absent</span>
                        </div>
                        <div className="text-2xl font-bold text-[#D32F2F]">
                          {attendancePercentages.absent}%
                        </div>
                        <div className="text-xs text-[#888]">{attendanceHistory.summary.absent} days</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar */}
              {attendanceHistory && (
                <div className="bg-[#121212] rounded-xl p-6 border border-[#2D2D2D]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-semibold text-[#F1F1F1]">
                      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={previousMonth}
                        className="p-2 rounded-lg bg-[#1E1E1E] text-[#EAEAEA] hover:bg-[#2D2D2D] transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-2 rounded-lg bg-[#1E1E1E] text-[#EAEAEA] hover:bg-[#2D2D2D] transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-[#888] py-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const attendance = getAttendanceForDate(day);
                      const isTodayDate = isToday(day);

                      return (
                        <div
                          key={day}
                          className={`relative aspect-square flex items-center justify-center rounded-lg transition-all duration-200 ${
                            isTodayDate
                              ? "bg-[#3A86FF] bg-opacity-20 border-2 border-[#3A86FF]"
                              : "bg-[#1E1E1E] hover:bg-[#2D2D2D]"
                          }`}
                        >
                          <span className="text-sm text-[#EAEAEA]">{day}</span>
                          {attendance && (
                            <div
                              className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                                attendance.status === "present"
                                  ? "bg-[#4CAF50]"
                                  : attendance.status === "late"
                                  ? "bg-[#ED6C02]"
                                  : "bg-[#D32F2F]"
                              }`}
                              title={attendance.status}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-[#2D2D2D]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                      <span className="text-sm text-[#EAEAEA]">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ED6C02]"></div>
                      <span className="text-sm text-[#EAEAEA]">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#D32F2F]"></div>
                      <span className="text-sm text-[#EAEAEA]">Absent</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-xl p-6 max-w-md w-full border border-[#2D2D2D] animate-fade-in">
            <h3 className="text-xl font-bold text-[#F1F1F1] mb-4">Edit Student Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Grade</label>
                <input
                  type="text"
                  value={editForm.standard}
                  onChange={(e) => setEditForm({ ...editForm, standard: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Class</label>
                <select
                  value={editForm.classId}
                  onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#121212] text-white border border-[#333] focus:border-[#3A86FF] focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-[#4CAF50] text-white font-semibold hover:bg-[#45A049] transition-colors duration-200 disabled:bg-[#2D2D2D] disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={closeEditModal}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-[#757575] text-white font-semibold hover:bg-[#616161] transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #121212;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3A86FF;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4361EE;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
