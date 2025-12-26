"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Class = {
  id: string;
  name: string;
  grade: number;
  section: string;
  capacity: number;
  studentsCount: number;
  classTeacherName: string | null;
};

export default function ClassesListPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/admin/classes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setClasses(data.classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.section.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Classes</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lamaSky"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Classes</p>
          <p className="text-2xl font-bold text-gray-800">{classes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Students</p>
          <p className="text-2xl font-bold text-green-600">
            {classes.reduce((sum, cls) => sum + cls.studentsCount, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Capacity</p>
          <p className="text-2xl font-bold text-blue-600">
            {classes.reduce((sum, cls) => sum + cls.capacity, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Showing Results</p>
          <p className="text-2xl font-bold text-purple-600">{filteredClasses.length}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No classes found
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                  <p className="text-sm text-gray-600">
                    Grade {cls.grade} - Section {cls.section}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    cls.studentsCount >= cls.capacity
                      ? "bg-red-100 text-red-800"
                      : cls.studentsCount >= cls.capacity * 0.8
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {cls.studentsCount}/{cls.capacity}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students</span>
                  <span className="font-semibold text-gray-800">
                    {cls.studentsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-semibold text-gray-800">{cls.capacity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Class Teacher</span>
                  <span className="font-semibold text-gray-800">
                    {cls.classTeacherName || "Not Assigned"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      cls.studentsCount >= cls.capacity
                        ? "bg-red-500"
                        : cls.studentsCount >= cls.capacity * 0.8
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (cls.studentsCount / cls.capacity) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <Link
                href={`/classes/${cls.id}`}
                className="block w-full text-center bg-lamaSky text-white py-2 rounded-lg hover:bg-blue-600 transition"
              >
                View Details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
