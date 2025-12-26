"use client";

import { useEffect, useState } from "react";

type SubjectResult = {
  id: string;
  subjectName: string;
  subjectCode: string;
  marks: number;
  grade: string | null;
  remarks: string | null;
};

type ExamResult = {
  examId: string;
  examTitle: string;
  examDate: string;
  className: string;
  totalMarks: number;
  results: SubjectResult[];
};

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  class: {
    name: string;
    gradeLevel: string;
  };
  stats: {
    totalExams: number;
    averageMarks: number;
    gradeDistribution: { [key: string]: number };
  };
  exams: ExamResult[];
  allResults: any[];
};

const gradeColors: { [key: string]: string } = {
  A: "bg-green-100 text-green-800",
  "A-": "bg-green-50 text-green-700",
  "B+": "bg-blue-100 text-blue-800",
  B: "bg-blue-50 text-blue-700",
  "B-": "bg-blue-50 text-blue-600",
  "C+": "bg-yellow-100 text-yellow-800",
  C: "bg-yellow-50 text-yellow-700",
  "C-": "bg-yellow-50 text-yellow-600",
  "D+": "bg-orange-100 text-orange-800",
  D: "bg-orange-50 text-orange-700",
  "D-": "bg-orange-50 text-orange-600",
  E: "bg-red-100 text-red-800",
};

export default function ParentResultsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"exams" | "subjects">("exams");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/results/parent");
      
      if (!res.ok) {
        throw new Error("Failed to fetch results data");
      }
      
      const data = await res.json();
      setStudents(data.students);
      
      // Auto-select first student
      if (data.students.length > 0 && !selectedStudent) {
        setSelectedStudent(data.students[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading results</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No student records found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Results</h1>
          <p className="text-gray-600 mt-1">
            View your children's exam results and performance
          </p>
        </div>
      </div>

      {/* Student Selector */}
      {students.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Child
          </label>
          <div className="flex gap-2">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStudent === student.id
                    ? "bg-lamaSky text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {student.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStudentData && (
        <>
          {/* Student Info & Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-lamaSkyLight rounded-full p-4">
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedStudentData.name}
                </h2>
                <p className="text-gray-600">
                  {selectedStudentData.class.name} • Adm No: {selectedStudentData.admissionNo}
                </p>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Exams</p>
                <p className="text-2xl font-bold text-blue-700">
                  {selectedStudentData.stats.totalExams}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Average Marks</p>
                <p className="text-2xl font-bold text-green-700">
                  {selectedStudentData.stats.averageMarks}%
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-2">Grade Distribution</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(selectedStudentData.stats.gradeDistribution).map(
                    ([grade, count]) => (
                      <span
                        key={grade}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          gradeColors[grade] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {grade}: {count}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* No Results Message */}
          {selectedStudentData.exams.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <svg
                className="w-12 h-12 text-yellow-400 mx-auto mb-3"
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
              <p className="text-yellow-800 font-medium">No exam results available yet</p>
              <p className="text-yellow-600 text-sm mt-1">
                Results will appear here once exams are published
              </p>
            </div>
          ) : (
            <>
              {/* View Mode Toggle */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("exams")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === "exams"
                        ? "bg-lamaSky text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    By Exams
                  </button>
                  <button
                    onClick={() => setViewMode("subjects")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === "subjects"
                        ? "bg-lamaSky text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    By Subjects
                  </button>
                </div>
              </div>

              {/* Results Display */}
              {viewMode === "exams" ? (
                <div className="space-y-4">
                  {selectedStudentData.exams.map((exam) => {
                    const totalMarks = exam.results.reduce((sum, r) => sum + r.marks, 0);
                    const maxMarks = exam.totalMarks * exam.results.length;
                    const percentage = (totalMarks / maxMarks) * 100;

                    return (
                      <div
                        key={exam.examId}
                        className="bg-white rounded-xl shadow-sm border overflow-hidden"
                      >
                        <div className="bg-gray-50 px-6 py-4 border-b">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {exam.examTitle}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(exam.examDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Overall Score</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Marks
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Grade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {exam.results.map((result) => (
                                <tr key={result.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {result.subjectName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {result.subjectCode}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {result.marks} / {exam.totalMarks}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {result.grade ? (
                                      <span
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                          gradeColors[result.grade] ||
                                          "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {result.grade}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {result.remarks || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <p className="text-center text-gray-500 py-8">
                    Subject-wise view coming soon...
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
