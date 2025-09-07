"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [role, setRole] = useState<"admin" | "teacher" | null>(null);
  const router = useRouter();

  const handleLogin = (selectedRole: "admin" | "teacher") => {
    setRole(selectedRole);
    router.push(`/${selectedRole}`);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-80 text-center">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleLogin("admin")}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Login as Admin
          </button>
          <button
            onClick={() => handleLogin("teacher")}
            className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Login as Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
