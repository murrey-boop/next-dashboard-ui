import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

const ParentDashboard = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "PARENT") {
    redirect("/sign-in");
  }

  // Fetch parent data with children and fee information
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          class: true,
          feeBalance: true,
        },
      },
    },
  });

  const childrenCount = parent?.students.length || 0;
  const totalFees = parent?.students.reduce((sum, student) => {
    return sum + (student.feeBalance ? Number((student.feeBalance as any).totalFees) : 0);
  }, 0) || 0;
  
  const totalPaid = parent?.students.reduce((sum, student) => {
    return sum + (student.feeBalance ? Number((student.feeBalance as any).amountPaid) : 0);
  }, 0) || 0;

  const paymentStatus = totalFees === 0 ? "No Fees" :
    totalPaid >= totalFees ? "Paid" :
    totalPaid > 0 ? "Partial" : "Pending";

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {session.user.name}!
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-lamaSkyLight rounded-full p-3">
              <svg className="w-6 h-6 text-lamaSky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Children</p>
              <p className="text-2xl font-bold text-gray-900">{childrenCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-lamaYellowLight rounded-full p-3">
              <svg className="w-6 h-6 text-lamaYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">KES {totalFees.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-lamaPurpleLight rounded-full p-3">
              <svg className="w-6 h-6 text-lamaPurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/parent/fees"
          className="bg-gradient-to-br from-lamaSky to-lamaSkyLight rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg className="w-8 h-8 text-lamaSky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-semibold">Fee Information</h3>
              <p className="text-sm mt-1 opacity-90">View & pay fees</p>
            </div>
          </div>
        </Link>

        <div className="bg-gradient-to-br from-lamaYellow to-lamaYellowLight rounded-xl shadow-sm p-6 cursor-not-allowed opacity-60">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg className="w-8 h-8 text-lamaYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-semibold">Academic Reports</h3>
              <p className="text-sm mt-1 opacity-90">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-lamaPurple to-lamaPurpleLight rounded-xl shadow-sm p-6 cursor-not-allowed opacity-60">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg className="w-8 h-8 text-lamaPurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-semibold">Messages</h3>
              <p className="text-sm mt-1 opacity-90">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-400 rounded-xl shadow-sm p-6 cursor-not-allowed opacity-60">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-white rounded-full p-3">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-white">
              <h3 className="font-semibold">School Events</h3>
              <p className="text-sm mt-1 opacity-90">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Important Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">School Term Information</p>
              <p className="text-sm text-gray-600 mt-1">
                Current term fees and payment deadlines are available in the Fee Information section.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">Payment Reminders</p>
              <p className="text-sm text-gray-600 mt-1">
                Please ensure timely payment of school fees to avoid any inconvenience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;