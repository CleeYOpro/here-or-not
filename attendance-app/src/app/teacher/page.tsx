"use client";

import { useRouter } from "next/navigation";

export default function TeacherPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Teacher Dashboard</h1>
      <button
        onClick={() => router.push("/")}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
      >
        Back to Login
      </button>
    </div>
  );
}
