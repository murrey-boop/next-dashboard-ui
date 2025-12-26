"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Link from "next/link";

type DashboardData = {
  teacher: {
    name: string;
    employeeNo: string;
    photo: string | null;
  };
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalAssignments: number;
    pendingGrading: number;
  };
  classes: Array<{
    id: string;
    name: string;
    capacity: number;
    studentCount: number;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  recentSubmissions: Array<{
    id: string;
    studentName: string;
    assignmentTitle: string;
    subjectName: string;
    className: string;
    submittedAt: string;
    isGraded: boolean;
  }>;
};

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboard();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard", {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch");
      }
      const result = await res.json();
      setData(result);
    } catch (error: any) {
      console.error("Dashboard error:", error);
      toast.error(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {data.teacher.name.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Employee No: {data.teacher.employeeNo}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">My Classes</p>
              <p className="text-3xl font-bold mt-2">{data.stats.totalClasses}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold mt-2">{data.stats.totalStudents}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Assignments</p>
              <p className="text-3xl font-bold mt-2">{data.stats.totalAssignments}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending Grading</p>
              <p className="text-3xl font-bold mt-2">{data.stats.pendingGrading}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/teacher/assignments"
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center"
          >
            <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Create Assignment</span>
          </Link>

          <Link
            href="/teacher/attendance"
            className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center"
          >
            <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-medium">Mark Attendance</span>
          </Link>

          <Link
            href="/teacher/exams"
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center"
          >
            <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">Create Exam</span>
          </Link>

          <Link
            href="/teacher/students"
            className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition text-center"
          >
            <svg className="w-8 h-8 text-yellow-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium">View Students</span>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">My Classes</h2>
          {data.classes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No classes assigned</p>
          ) : (
            <div className="space-y-3">
              {data.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-semibold">{cls.name}</p>
                    <p className="text-sm text-gray-600">
                      {cls.studentCount} students
                    </p>
                  </div>
                  <Link
                    href={`/teacher/classes/${cls.id}`}
                    className="text-sm text-lamaSky hover:text-blue-700 font-medium"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
          {data.recentSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent submissions</p>
          ) : (
            <div className="space-y-3">
              {data.recentSubmissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sub.studentName}</p>
                    <p className="text-xs text-gray-600">{sub.assignmentTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sub.className} • {sub.subjectName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sub.isGraded
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {sub.isGraded ? "Graded" : "Pending"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">My Subjects</h2>
        <div className="flex flex-wrap gap-3">
          {data.subjects.map((subject) => (
            <div
              key={subject.id}
              className="px-4 py-2 bg-gradient-to-r from-lamaSky to-blue-600 text-white rounded-lg font-medium"
            >
              {subject.name} ({subject.code})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
