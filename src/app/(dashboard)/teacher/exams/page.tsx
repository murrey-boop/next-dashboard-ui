"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type Exam = {
  id: string;
  title: string;
  subject: string;
  class: string;
  examDate: string;
  totalMarks: number;
  submittedCount: number;
  totalStudents: number;
};

type Subject = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  marks: number | null;
};

export default function TeacherExams() {
  const { data: session, status } = useSession();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    subjectId: "",
    classId: "",
    examDate: "",
    totalMarks: 100,
    duration: 60,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [examsRes, dashboardRes] = await Promise.all([
        fetch("/api/teacher/exams"),
        fetch("/api/teacher/dashboard"),
      ]);

      if (!examsRes.ok || !dashboardRes.ok) throw new Error("Failed to fetch");

      const examsData = await examsRes.json();
      const dashboardData = await dashboardRes.json();

      setExams(examsData.exams);
      setSubjects(dashboardData.subjects);
      setClasses(dashboardData.classes);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subjectId || !formData.classId || !formData.examDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/teacher/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create exam");

      toast.success("Exam created successfully!");
      setShowCreateForm(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error("Failed to create exam");
    }
  };

  const handleOpenMarks = async (exam: Exam) => {
    setSelectedExam(exam);
    setShowMarksModal(true);

    try {
      const res = await fetch(`/api/teacher/exams/${exam.id}/marks`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setStudents(data.students);
    } catch (error) {
      toast.error("Failed to load students");
    }
  };

  const handleUpdateMarks = async (studentId: string, marks: number) => {
    if (marks < 0 || marks > (selectedExam?.totalMarks || 100)) {
      toast.error(`Marks must be between 0 and ${selectedExam?.totalMarks}`);
      return;
    }

    try {
      const res = await fetch(`/api/teacher/exams/${selectedExam?.id}/marks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, marks }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Marks updated!");
      
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, marks } : s))
      );
    } catch (error) {
      toast.error("Failed to update marks");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subjectId: "",
      classId: "",
      examDate: "",
      totalMarks: 100,
      duration: 60,
    });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exams & Results</h1>
          <p className="text-gray-600 mt-1">Create exams and enter marks</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Create Exam
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Exam</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Mid-Term Exam 2024"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="exam-subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    id="exam-subject"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="exam-class" className="block text-sm font-medium text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    id="exam-class"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="exam-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date *
                  </label>
                  <input
                    id="exam-date"
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="exam-total-marks" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    id="exam-total-marks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="exam-duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min)
                  </label>
                  <input
                    id="exam-duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Create Exam
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marks Modal */}
      {showMarksModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedExam.title}</h2>
                <p className="text-sm text-gray-600">
                  {selectedExam.subject} • {selectedExam.class} • Total: {selectedExam.totalMarks} marks
                </p>
              </div>
              <button
                onClick={() => setShowMarksModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Admission No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Marks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{student.admissionNo}</td>
                      <td className="px-4 py-3">{student.name}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={student.marks ?? ""}
                          onChange={(e) =>
                            handleUpdateMarks(student.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 p-2 border border-gray-300 rounded text-center"
                          min="0"
                          max={selectedExam.totalMarks}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Exams List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total Marks</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Progress</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No exams created yet. Click "Create Exam" to add one.
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{exam.title}</td>
                  <td className="px-4 py-3">{exam.subject}</td>
                  <td className="px-4 py-3">{exam.class}</td>
                  <td className="px-4 py-3">{new Date(exam.examDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">{exam.totalMarks}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">
                      {exam.submittedCount}/{exam.totalStudents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleOpenMarks(exam)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                    >
                      Enter Marks
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
