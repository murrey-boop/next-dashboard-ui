"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

type ClassDetail = {
  id: string;
  name: string;
  gradeLevel: string;
  capacity: number;
  studentCount: number;
  averagePerformance: number;
};

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  photo: string | null;
  averageMarks: number | null;
};

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setClassDetail(data.class);
      setStudents(data.students);
    } catch (error) {
      toast.error("Failed to load class details");
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

  if (!classDetail) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-lamaSky hover:underline mb-2"
        >
          ← Back to Classes
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{classDetail.name}</h1>
        <p className="text-gray-600 mt-1">{classDetail.gradeLevel.replace(/_/g, " ")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-sm font-medium opacity-90">Total Students</h3>
          <p className="text-3xl font-bold mt-2">
            {classDetail.studentCount}/{classDetail.capacity}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-sm font-medium opacity-90">Avg Performance</h3>
          <p className="text-3xl font-bold mt-2">
            {classDetail.averagePerformance.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-sm font-medium opacity-90">Capacity</h3>
          <p className="text-3xl font-bold mt-2">
            {((classDetail.studentCount / classDetail.capacity) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => router.push(`/teacher/attendance?class=${classId}`)}
            className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            📋 Mark Attendance
          </button>
          <button
            onClick={() => router.push(`/teacher/assignments?class=${classId}`)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            📝 Create Assignment
          </button>
          <button
            onClick={() => router.push(`/teacher/exams?class=${classId}`)}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
          >
            📊 Create Exam
          </button>
        </div>
      </div>

      {/* Student Roster */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Roster</h3>

        {students.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No students in this class</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Admission No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Avg Marks
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {student.photo ? (
                          <Image
                            src={student.photo}
                            alt={student.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400">
                            👤
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{student.admissionNo}</td>
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-center">
                      {student.averageMarks !== null
                        ? `${student.averageMarks.toFixed(1)}%`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.averageMarks !== null ? (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            student.averageMarks >= 75
                              ? "bg-green-100 text-green-800"
                              : student.averageMarks >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.averageMarks >= 75
                            ? "Excellent"
                            : student.averageMarks >= 50
                            ? "Good"
                            : "Needs Improvement"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
