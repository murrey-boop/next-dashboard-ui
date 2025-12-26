"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type Class = {
  id: string;
  name: string;
  studentCount: number;
};

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  photo: string | null;
};

type AttendanceRecord = {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
};

export default function TeacherAttendance() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchClasses();
    }
  }, [status]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setClasses(data.classes);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load classes");
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log("Fetching students for class:", selectedClass);
      const res = await fetch(`/api/teacher/classes/${selectedClass}/students`);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to fetch students:", errorData);
        throw new Error(errorData.error || "Failed to fetch");
      }

      const data = await res.json();
      console.log("Students fetched:", data.students.length);
      setStudents(data.students);

      // Initialize attendance - check if already marked for today
      const attendanceRes = await fetch(
        `/api/teacher/attendance?classId=${selectedClass}&date=${selectedDate}`
      );
      
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        const existingAttendance: Record<string, string> = {};
        
        attendanceData.attendance.forEach((record: any) => {
          existingAttendance[record.studentId] = record.status;
        });
        
        setAttendance(existingAttendance);
      } else {
        // No attendance marked yet, set all to PRESENT by default
        const initialAttendance: Record<string, string> = {};
        data.students.forEach((student: Student) => {
          initialAttendance[student.id] = "PRESENT";
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      toast.error("Failed to load students");
    }
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || Object.keys(attendance).length === 0) {
      toast.error("Please select a class and mark attendance");
      return;
    }

    setSaving(true);
    try {
      const attendanceRecords = Object.entries(attendance).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      );

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          attendance: attendanceRecords,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Attendance saved successfully!");
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500 hover:bg-green-600";
      case "ABSENT":
        return "bg-red-500 hover:bg-red-600";
      case "LATE":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "EXCUSED":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-700";
      case "ABSENT":
        return "bg-red-100 text-red-700";
      case "LATE":
        return "bg-yellow-100 text-yellow-700";
      case "EXCUSED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    Object.values(attendance).forEach((status) => {
      if (status === "PRESENT") stats.present++;
      else if (status === "ABSENT") stats.absent++;
      else if (status === "LATE") stats.late++;
      else if (status === "EXCUSED") stats.excused++;
    });

    return stats;
  };

  const stats = getStats();

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
        <h1 className="text-2xl font-bold text-gray-800">Mark Attendance</h1>
        <p className="text-gray-600 mt-1">
          Record daily attendance for your classes
        </p>
      </div>

      {/* Class & Date Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="attendance-class" className="block text-sm font-medium text-gray-700 mb-2">
              Select Class *
            </label>
            <select
              id="attendance-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount} students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            <p className="text-sm text-green-600">Present</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            <p className="text-sm text-red-600">Absent</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
            <p className="text-sm text-yellow-600">Late</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{stats.excused}</p>
            <p className="text-sm text-blue-600">Excused</p>
          </div>
        </div>
      )}

      {/* Students List */}
      {!selectedClass ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Please select a class to mark attendance</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No students found in this class</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {student.photo ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={student.photo}
                                alt={student.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                {student.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.admissionNo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleAttendanceChange(student.id, status)
                                }
                                className={`px-3 py-1 rounded-md text-white text-sm font-medium transition ${
                                  attendance[student.id] === status
                                    ? getStatusColor(status)
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                              >
                                {status.charAt(0)}
                              </button>
                            )
                          )}
                        </div>
                        <div className="mt-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                              attendance[student.id]
                            )}`}
                          >
                            {attendance[student.id]}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-3 bg-lamaSky text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
