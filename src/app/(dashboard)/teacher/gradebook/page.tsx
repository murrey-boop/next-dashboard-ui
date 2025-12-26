"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  photo: string | null;
};

type Grade = {
  examTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
};

type StudentGrade = {
  student: Student;
  grades: Grade[];
  average: number;
};

type Class = {
  id: string;
  name: string;
};

export default function TeacherGradebook() {
  const { data: session } = useSession();
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchClasses();
    }
  }, [session]);

  useEffect(() => {
    if (selectedClass) {
      fetchGradebook();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      console.log("Fetching classes for gradebook...");
      const res = await fetch("/api/teacher/dashboard");
      console.log("Dashboard response status:", res.status);
      
      if (!res.ok) {
        const error = await res.json();
        console.error("Dashboard error:", error);
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      console.log("Dashboard data:", data);
      setClasses(data.classes || []);

      if (data.classes && data.classes.length > 0) {
        setSelectedClass(data.classes[0].id);
      }
    } catch (error) {
      console.error("Fetch classes error:", error);
      toast.error("Failed to load classes");
    }
  };

  const fetchGradebook = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      console.log("Fetching gradebook for class:", selectedClass);
      const res = await fetch(`/api/teacher/gradebook?classId=${selectedClass}`);
      console.log("Gradebook response status:", res.status);
      
      if (!res.ok) {
        const error = await res.json();
        console.error("Gradebook error:", error);
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      console.log("Gradebook data:", data);
      setStudentGrades(data.studentGrades || []);
    } catch (error) {
      console.error("Fetch gradebook error:", error);
      toast.error("Failed to load gradebook");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (studentGrades.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Get all unique exam titles
    const allExams = Array.from(
      new Set(studentGrades.flatMap((sg) => sg.grades.map((g) => g.examTitle)))
    );

    // Create CSV header
    const header = ["Student", "Admission No", ...allExams, "Average (%)"];
    const csvRows = [header.join(",")];

    // Create CSV rows
    studentGrades.forEach((sg) => {
      const row = [
        sg.student.name,
        sg.student.admissionNo,
        ...allExams.map((examTitle) => {
          const grade = sg.grades.find((g) => g.examTitle === examTitle);
          return grade ? `${grade.score}/${grade.maxScore}` : "-";
        }),
        sg.average.toFixed(1),
      ];
      csvRows.push(row.join(","));
    });

    // Download CSV
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gradebook_${selectedClass}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("Gradebook exported!");
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gradebook</h1>
          <p className="text-gray-600 mt-1">Consolidated view of student grades</p>
        </div>

        <div className="flex gap-3">
          <select
            aria-label="Select class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            disabled={studentGrades.length === 0}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {studentGrades.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
          No grades recorded for this class
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Student
                </th>
                {studentGrades[0]?.grades.map((grade, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {grade.examTitle}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentGrades.map((sg) => (
                <tr key={sg.student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {sg.student.photo ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={sg.student.photo}
                            alt={sg.student.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-lamaSky flex items-center justify-center text-white font-semibold">
                            {sg.student.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {sg.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sg.student.admissionNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  {sg.grades.map((grade, idx) => (
                    <td key={idx} className="px-4 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-medium ${getGradeColor(grade.percentage)}`}>
                        {grade.score}/{grade.maxScore}
                      </div>
                      <div className="text-xs text-gray-500">{grade.percentage.toFixed(1)}%</div>
                    </td>
                  ))}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className={`text-sm font-bold ${getGradeColor(sg.average)}`}>
                      {sg.average.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics */}
      {studentGrades.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{studentGrades.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Class Average</p>
            <p className="text-2xl font-bold text-blue-600">
              {(
                studentGrades.reduce((sum, sg) => sum + sg.average, 0) / studentGrades.length
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Highest Average</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.max(...studentGrades.map((sg) => sg.average)).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Lowest Average</p>
            <p className="text-2xl font-bold text-red-600">
              {Math.min(...studentGrades.map((sg) => sg.average)).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
