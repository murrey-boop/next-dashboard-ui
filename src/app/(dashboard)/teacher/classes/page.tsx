"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Link from "next/link";

type Class = {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  capacity: number;
};

export default function TeacherClasses() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchClasses();
    }
  }, [status]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setClasses(data.classes);
    } catch (error) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
        <p className="text-gray-600 mt-1">Classes you are teaching</p>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
          No classes assigned yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/teacher/classes/${cls.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
            >
              <div className="bg-gradient-to-r from-lamaSky to-blue-500 p-6">
                <h3 className="text-xl font-bold text-white">{cls.name}</h3>
                <p className="text-blue-100 mt-1">{cls.gradeLevel.replace(/_/g, " ")}</p>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-semibold text-gray-800">
                      {cls.studentCount}/{cls.capacity}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-lamaSky h-2 rounded-full"
                      style={{
                        width: `${(cls.studentCount / cls.capacity) * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-lamaSky hover:underline font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
