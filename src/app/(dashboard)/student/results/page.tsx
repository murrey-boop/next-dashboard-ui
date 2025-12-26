import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

const StudentResultsPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/sign-in");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
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
      },
    },
  });

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800">Profile Incomplete</h2>
          <p className="text-yellow-700 mt-2">
            Your student profile is not yet set up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Exam Results</h1>

      {student.results.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No exam results yet
        </div>
      ) : (
        <div className="space-y-4">
          {student.results.map((result) => (
            <div
              key={result.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {result.exam.subject.name}
                  </h3>
                  <p className="text-gray-600">{result.exam.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-lamaSky">
                    {((Number(result.marks) / result.exam.totalMarks) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(result.exam.examDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="ml-2 font-semibold">{result.exam.totalMarks}</span>
                </div>
                <div>
                  <span className="text-gray-600">Grade:</span>
                  <span className="ml-2 font-semibold">{result.grade || "N/A"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;
