"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Image from "next/image";

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  photo: string | null;
  className: string;
};

type Class = {
  id: string;
  name: string;
};

export default function TeacherStudents() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    filterStudents();
  }, [selectedClass, searchTerm, students]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setStudents(data.students);
      setClasses(data.classes);
      setFilteredStudents(data.students);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Filter by class
    if (selectedClass) {
      filtered = filtered.filter((student) => student.className === selectedClass);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
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
        <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
        <p className="text-gray-600 mt-1">
          All students from your classes ({filteredStudents.length} of {students.length})
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="student-class-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              id="student-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lamaSky"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or admission number..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lamaSky"
            />
          </div>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
          No students found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="bg-gradient-to-r from-lamaSky to-blue-500 h-24"></div>
              <div className="relative -mt-12 flex flex-col items-center pb-6">
                <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200">
                  {student.photo ? (
                    <Image
                      src={student.photo}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-3xl text-gray-400">
                      👤
                    </div>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-800 text-center px-2">
                  {student.name}
                </h3>

                <div className="mt-2 space-y-1 text-center">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Admission:</span> {student.admissionNo}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Class:</span> {student.className}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className="px-3 py-1 text-sm bg-lamaSky text-white rounded hover:bg-blue-600 transition"
                    onClick={() => toast.success("View details feature coming soon!")}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
