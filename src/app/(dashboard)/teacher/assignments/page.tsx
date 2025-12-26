"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  dueDate: string;
  totalMarks: number;
  createdAt: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;
};

type Subject = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
};

type Submission = {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  marks: number | null;
  feedback: string | null;
  fileData: string | null;
  fileName: string | null;
};

export default function TeacherAssignments() {
  const { data: session, status } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    classId: "",
    dueDate: "",
    totalMarks: "",
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Grading state
  const [gradeData, setGradeData] = useState({
    marks: "",
    feedback: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [assignmentsRes, dashboardRes] = await Promise.all([
        fetch("/api/teacher/assignments"),
        fetch("/api/teacher/dashboard"),
      ]);

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments);
      }

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setSubjects(dashboardData.subjects);
        setClasses(dashboardData.classes);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.subjectId || !formData.classId || !formData.dueDate || !formData.totalMarks) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      let attachmentData = null;
      let attachmentName = null;

      // Handle file upload
      if (attachmentFile) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (attachmentFile.size > maxSize) {
          toast.error("File size should not exceed 10MB");
          return;
        }

        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(attachmentFile);
        });

        attachmentData = fileData;
        attachmentName = attachmentFile.name;
      }

      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachmentData,
          attachmentName,
        }),
      });

      if (!res.ok) throw new Error("Failed to create assignment");

      toast.success("Assignment created successfully!");
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        subjectId: "",
        classId: "",
        dueDate: "",
        totalMarks: "",
      });
      setAttachmentFile(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to create assignment");
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/teacher/assignments/${assignmentId}/submissions`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setSubmissions(data.submissions);
      setSelectedAssignment(assignmentId);
    } catch (error) {
      toast.error("Failed to load submissions");
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradingSubmission) return;

    const marks = parseInt(gradeData.marks);
    const assignment = assignments.find(a => 
      submissions.some(s => s.id === gradingSubmission.id)
    );

    if (assignment && marks > assignment.totalMarks) {
      toast.error(`Marks cannot exceed ${assignment.totalMarks}`);
      return;
    }

    try {
      const res = await fetch(`/api/teacher/assignments/submissions/${gradingSubmission.id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks: marks,
          feedback: gradeData.feedback,
        }),
      });

      if (!res.ok) throw new Error("Failed to grade");

      toast.success("Graded successfully!");
      setGradingSubmission(null);
      setGradeData({ marks: "", feedback: "" });
      
      // Refresh submissions
      if (selectedAssignment) {
        fetchSubmissions(selectedAssignment);
      }
      fetchData();
    } catch (error) {
      toast.error("Failed to grade submission");
    }
  };

  const downloadFile = (fileData: string, fileName: string) => {
    try {
      const link = document.createElement("a");
      link.href = fileData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
    }
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
          <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
          <p className="text-gray-600 mt-1">Create and manage assignments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          {showCreateForm ? "Cancel" : "+ Create Assignment"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Assignment</h2>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                  placeholder="Assignment title"
                />
              </div>

              <div>
                <label htmlFor="assignment-subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <select
                  id="assignment-subject"
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignment-class" className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  id="assignment-class"
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignment-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  id="assignment-due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks *
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                rows={4}
                placeholder="Assignment instructions..."
              />
            </div>

            <div>
              <label htmlFor="assignment-attachment" className="block text-sm font-medium text-gray-700 mb-1">
                Attachment (Optional)
              </label>
              <input
                id="assignment-attachment"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
              {attachmentFile && (
                <p className="text-sm text-green-600 mt-1">
                  📎 {attachmentFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-lamaSky text-white rounded-md hover:bg-blue-600"
              >
                Create Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No assignments yet. Create your first assignment!</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {assignment.subject}
                    </span>
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      {assignment.class}
                    </span>
                    <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      {assignment.totalMarks} marks
                    </span>
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{assignment.totalSubmissions}</p>
                  <p className="text-sm text-gray-600">Submissions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{assignment.gradedSubmissions}</p>
                  <p className="text-sm text-gray-600">Graded</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{assignment.pendingGrading}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>

              <button
                onClick={() => fetchSubmissions(assignment.id)}
                className="w-full px-4 py-2 bg-lamaSky text-white rounded-md hover:bg-blue-600 transition"
              >
                View Submissions & Grade
              </button>
            </div>
          ))
        )}
      </div>

      {/* Submissions Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Submissions</h2>
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissions([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {submissions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No submissions yet</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{submission.studentName}</h3>
                          <p className="text-sm text-gray-600">
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        {submission.marks !== null ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Graded: {submission.marks}
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </div>

                      {submission.fileName && (
                        <button
                          onClick={() => downloadFile(submission.fileData!, submission.fileName!)}
                          className="text-sm text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1"
                        >
                          📎 {submission.fileName}
                        </button>
                      )}

                      {submission.feedback && (
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <p className="text-sm text-gray-700"><strong>Feedback:</strong> {submission.feedback}</p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setGradingSubmission(submission);
                          setGradeData({
                            marks: submission.marks?.toString() || "",
                            feedback: submission.feedback || "",
                          });
                        }}
                        className="px-4 py-2 bg-lamaPurple text-white rounded-md hover:bg-purple-700 text-sm"
                      >
                        {submission.marks !== null ? "Update Grade" : "Grade Now"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Grade Submission</h2>
              <p className="text-sm text-gray-600 mt-1">{gradingSubmission.studentName}</p>
            </div>

            <form onSubmit={handleGrade} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    value={gradeData.marks}
                    onChange={(e) => setGradeData({ ...gradeData, marks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                    placeholder="Enter marks"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    value={gradeData.feedback}
                    onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                    rows={3}
                    placeholder="Optional feedback..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setGradingSubmission(null);
                    setGradeData({ marks: "", feedback: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-lamaSky text-white rounded-md hover:bg-blue-600"
                >
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
