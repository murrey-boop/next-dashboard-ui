import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

const StudentDashboard = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/sign-in");
  }

  // Fetch student data
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      class: {
        include: {
          lessons: {
            include: {
              subject: true,
              teacher: true,
            },
          },
        },
      },
      results: {
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: {
          exam: {
            examDate: "desc",
          },
        },
        take: 5,
      },
      attendanceRecords: {
        orderBy: {
          date: "desc",
        },
        take: 30,
      },
      feeBalances: true,
    },
  });

  if (!student) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800">Profile Incomplete</h2>
          <p className="text-yellow-700 mt-2">
            Your student profile is not yet set up. Please contact the school administration.
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalLessons = student.class?.lessons.length || 0;
  const recentExams = student.results.length;
  const totalFees = student.feeBalances ? Number(student.feeBalances.totalFees) : 0;
  const amountPaid = student.feeBalances ? Number(student.feeBalances.amountPaid) : 0;
  const balance = totalFees - amountPaid;

  // Calculate attendance percentage
  const presentDays = student.attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;
  const totalDays = student.attendanceRecords.length;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Calculate average score
  const averageScore =
    student.results.length > 0
      ? student.results.reduce((sum, result) => sum + result.score, 0) /
        student.results.length
      : 0;

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {student.name}!
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-lamaSkyLight rounded-full p-3">
              <svg
                className="w-6 h-6 text-lamaSky"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">My Class</p>
              <p className="text-xl font-bold text-gray-900">
                {student.class?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-green-600">
                {attendancePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {averageScore.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Balance Alert */}
      {balance > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-orange-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-semibold text-orange-800">Fee Balance Pending</p>
              <p className="text-sm text-orange-700">
                You have an outstanding balance of KES {balance.toLocaleString()}.
                Please inform your parent or guardian.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/student/results"
          className="bg-gradient-to-br from-lamaSky to-lamaSkyLight rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg
                className="w-8 h-8 text-lamaSky"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg">View Results</h3>
              <p className="text-sm opacity-90">Check exam scores</p>
            </div>
          </div>
        </Link>

        <Link
          href="/student/attendance"
          className="bg-gradient-to-br from-green-500 to-green-400 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg">Attendance</h3>
              <p className="text-sm opacity-90">View records</p>
            </div>
          </div>
        </Link>

        <Link
          href="/student/assignments"
          className="bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg">Assignments</h3>
              <p className="text-sm opacity-90">Pending work</p>
            </div>
          </div>
        </Link>

        <Link
          href="/student/fees"
          className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg">Fee Statement</h3>
              <p className="text-sm opacity-90">Check balance</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Results */}
      {student.results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Exam Results</h2>
            <Link
              href="/student/results"
              className="text-lamaSky hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {student.results.slice(0, 3).map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {result.exam.subject.name}
                  </p>
                  <p className="text-sm text-gray-600">{result.exam.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-lamaSky">
                    {result.score}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(result.exam.examDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;