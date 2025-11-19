"use client";

import { useState } from 'react';
import type { Student, ClassAssignments } from '../page';

interface StudentManagementProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: string[];
  assignments: ClassAssignments;
  setAssignments: React.Dispatch<React.SetStateAction<ClassAssignments>>;
  deleteStudent: (id: string) => void;
}

export default function StudentManagement({
  students,
  setStudents,
  teachers,
  assignments,
  setAssignments,
  deleteStudent
}: StudentManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-[#1E1E1E] rounded-lg shadow-lg p-6 border border-[#2D2D2D]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#F1F1F1]">
          Current Students
        </h2>
        <div className="relative w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full px-4 py-2 border border-[#2D2D2D] rounded-lg focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] transition-all duration-300 bg-[#121212] text-[#EAEAEA]"
          />
        </div>
      </div>
      
      {students.length === 0 ? (
        <div className="text-center py-8 text-[#B0B0B0] bg-[#2D2D2D] rounded-lg border border-[#3A3A3A]">
          No students added yet
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#3A3A3A] rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-[#3A3A3A]">
            <thead className="bg-[#2D2D2D]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                  Standard
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#1E1E1E] divide-y divide-[#3A3A3A]">
              {students
                .filter(s => 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.id.includes(searchQuery) ||
                  (s.standard || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((s) => (
                  <tr key={s.id} className="hover:bg-[#2D2D2D] transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-[#EAEAEA]">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#EAEAEA]">
                      {s.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={s.standard || ''}
                        onChange={(e) => {
                          const newStandard = e.target.value;
                          setStudents(prev => prev.map(student => 
                            student.id === s.id ? {...student, standard: newStandard} : student
                          ));
                        }}
                        className="px-2 py-1 rounded bg-[#121212] text-[#EAEAEA] border border-[#3A3A3A] focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF]"
                      >
                        <option value="">Select Standard</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num.toString()}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={Object.entries(assignments).find(([, students]) => 
                          students.includes(s.id))?.[0] || ''}
                        onChange={(e) => {
                          const newTeacher = e.target.value;
                          const oldTeacher = Object.entries(assignments).find(([, students]) => 
                            students.includes(s.id))?.[0];
                          
                          setAssignments(prev => {
                            const newAssignments = { ...prev };
                            // Remove from old teacher
                            if (oldTeacher) {
                              newAssignments[oldTeacher] = prev[oldTeacher].filter(id => id !== s.id);
                            }
                            // Add to new teacher
                            if (newTeacher) {
                              newAssignments[newTeacher] = [...(prev[newTeacher] || []), s.id];
                            }
                            return newAssignments;
                          });
                        }}
                        className="px-2 py-1 rounded bg-[#121212] text-[#EAEAEA] border border-[#3A3A3A] focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF]"
                      >
                        <option value="">Unassigned</option>
                        {teachers.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => deleteStudent(s.id)}
                        className="text-[#EF9A9A] hover:text-[#D32F2F] transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
