"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  email: string | null;
  phone: string | null;
  photo: string | null;
  dateOfBirth: string;
  address: string | null;
};

type AttendanceData = {
  date: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

type PerformanceData = {
  studentName: string;
  admissionNo: string;
  exams: { title: string; score: number }[];
  average: number;
};

export default function TeacherReports() {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchClasses();
    }
  }, [session]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setClasses(data.classes || []);

      if (data.classes && data.classes.length > 0) {
        setSelectedClass(data.classes[0].id);
      }
    } catch (error) {
      toast.error("Failed to load classes");
    }
  };

  const generateClassRegister = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/reports/class-register?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const students: Student[] = data.students;
      const className = classes.find((c) => c.id === selectedClass)?.name || "Class";

      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text(`Class Register - ${className}`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      // Table
      autoTable(doc, {
        startY: 35,
        head: [["#", "Admission No", "Student Name", "Date of Birth", "Contact"]],
        body: students.map((student, index) => [
          index + 1,
          student.admissionNo,
          student.name,
          new Date(student.dateOfBirth).toLocaleDateString(),
          student.phone || student.email || "N/A",
        ]),
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`class_register_${className}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Class register downloaded!");
    } catch (error) {
      toast.error("Failed to generate class register");
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceReport = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/reports/attendance?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const attendanceData: AttendanceData[] = data.attendance;
      const className = classes.find((c) => c.id === selectedClass)?.name || "Class";

      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text(`Attendance Report - ${className}`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      // Summary
      const totalDays = attendanceData.length;
      const avgAttendance =
        attendanceData.reduce((sum, d) => sum + d.percentage, 0) / totalDays || 0;

      doc.setFontSize(12);
      doc.text(`Total Days: ${totalDays}`, 14, 40);
      doc.text(`Average Attendance: ${avgAttendance.toFixed(1)}%`, 14, 48);

      // Table
      autoTable(doc, {
        startY: 55,
        head: [["Date", "Present", "Absent", "Total", "Attendance %"]],
        body: attendanceData.map((d) => [
          new Date(d.date).toLocaleDateString(),
          d.present,
          d.absent,
          d.total,
          `${d.percentage.toFixed(1)}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
      });

      doc.save(`attendance_report_${className}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Attendance report downloaded!");
    } catch (error) {
      toast.error("Failed to generate attendance report");
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceReport = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/reports/performance?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const performanceData: PerformanceData[] = data.performance;
      const className = classes.find((c) => c.id === selectedClass)?.name || "Class";

      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text(`Performance Report - ${className}`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      // Get all exam titles
      const examTitles =
        performanceData[0]?.exams.map((e) => e.title) || [];

      // Table
      autoTable(doc, {
        startY: 35,
        head: [["Student", "Admission No", ...examTitles, "Average"]],
        body: performanceData.map((p) => [
          p.studentName,
          p.admissionNo,
          ...p.exams.map((e) => e.score),
          p.average.toFixed(1),
        ]),
        theme: "grid",
        headStyles: { fillColor: [168, 85, 247] },
      });

      doc.save(`performance_report_${className}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Performance report downloaded!");
    } catch (error) {
      toast.error("Failed to generate performance report");
    } finally {
      setLoading(false);
    }
  };

  const generateDataSheet = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/reports/class-register?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const students: Student[] = data.students;
      const className = classes.find((c) => c.id === selectedClass)?.name || "Class";

      // Generate CSV
      const headers = ["Admission No", "Name", "Date of Birth", "Email", "Phone", "Address"];
      const csvRows = [headers.join(",")];

      students.forEach((student) => {
        const row = [
          student.admissionNo,
          `"${student.name}"`,
          new Date(student.dateOfBirth).toLocaleDateString(),
          student.email || "",
          student.phone || "",
          `"${student.address || ""}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data_sheet_${className}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Data sheet downloaded!");
    } catch (error) {
      toast.error("Failed to generate data sheet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Downloads</h1>
        <p className="text-gray-600 mt-1">
          Generate and download various reports for your classes
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="report-class" className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select
          id="report-class"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full md:w-64 p-2 border border-gray-300 rounded-lg"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Class Register */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-semibold text-gray-800">Class Register</h3>
              <p className="text-sm text-gray-600">Student list with details</p>
            </div>
          </div>
          <button
            onClick={generateClassRegister}
            disabled={loading || !selectedClass}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>

        {/* Attendance Report */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-800">Attendance Report</h3>
              <p className="text-sm text-gray-600">Daily attendance statistics</p>
            </div>
          </div>
          <button
            onClick={generateAttendanceReport}
            disabled={loading || !selectedClass}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>

        {/* Performance Report */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📈</span>
            <div>
              <h3 className="font-semibold text-gray-800">Performance Report</h3>
              <p className="text-sm text-gray-600">Exam scores and averages</p>
            </div>
          </div>
          <button
            onClick={generatePerformanceReport}
            disabled={loading || !selectedClass}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>

        {/* Data Sheet */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📑</span>
            <div>
              <h3 className="font-semibold text-gray-800">Data Sheet</h3>
              <p className="text-sm text-gray-600">Comprehensive student data</p>
            </div>
          </div>
          <button
            onClick={generateDataSheet}
            disabled={loading || !selectedClass}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky mx-auto"></div>
            <p className="mt-4 text-gray-700">Generating report...</p>
          </div>
        </div>
      )}
    </div>
  );
}
