"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type AssignmentSubmission = {
  id: string;
  submittedAt: string | null;
  marks: number | null;
  feedback: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  dueDate: string;
  totalMarks: number;
  createdAt: string;
  submission: AssignmentSubmission | null;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";
};

type Student = {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  gradeLevel: string;
  assignments: Assignment[];
};

const statusConfig = {
  PENDING: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
    icon: "📝",
  },
  SUBMITTED: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800",
    icon: "✅",
  },
  GRADED: {
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800",
    icon: "⭐",
  },
  OVERDUE: {
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
    icon: "⚠️",
  },
};

export default function ParentAssignmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded" | "overdue">("all");
  
  // Submission states
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/assignments/parent");
      
      if (!res.ok) {
        throw new Error("Failed to fetch assignments");
      }
      
      const data = await res.json();
      setStudents(data.students);
      
      if (data.students.length > 0 && !selectedStudent) {
        setSelectedStudent(data.students[0].studentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !selectedStudentData) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", selectedAssignment.id);
      formData.append("studentId", selectedStudentData.studentId);
      formData.append("submissionText", submissionText);
      if (submissionFile) {
        formData.append("file", submissionFile);
      }

      const res = await fetch("/api/assignments/parent/submit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Submission failed");

      // Success - refresh assignments
      await fetchAssignments();
      setShowSubmissionModal(false);
      setSelectedAssignment(null);
      setSubmissionText("");
      setSubmissionFile(null);
      toast.success("Assignment submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmissionModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionModal(true);
  };

  const downloadAssignment = (assignment: Assignment) => {
    // Create a simple text file with assignment details
    const content = `
ASSIGNMENT DETAILS
==================

Title: ${assignment.title}
Subject: ${assignment.subjectName}
Teacher: ${assignment.teacherName}
Due Date: ${new Date(assignment.dueDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}
Total Marks: ${assignment.totalMarks}

Description:
${assignment.description}

---
Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assignment.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Assignment downloaded!");
  };

  const selectedStudentData = students.find((s) => s.studentId === selectedStudent);

  const filteredAssignments = selectedStudentData?.assignments.filter((a) => {
    if (filter === "all") return true;
    return a.status.toLowerCase() === filter;
  }) || [];

  const getStatusCounts = () => {
    if (!selectedStudentData) return { pending: 0, submitted: 0, graded: 0, overdue: 0 };
    return {
      pending: selectedStudentData.assignments.filter((a) => a.status === "PENDING").length,
      submitted: selectedStudentData.assignments.filter((a) => a.status === "SUBMITTED").length,
      graded: selectedStudentData.assignments.filter((a) => a.status === "GRADED").length,
      overdue: selectedStudentData.assignments.filter((a) => a.status === "OVERDUE").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading assignments</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">
            View and track your children's assignments
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
                key={student.studentId}
                onClick={() => setSelectedStudent(student.studentId)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStudent === student.studentId
                    ? "bg-lamaSky text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {student.studentName}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStudentData && (
        <>
          {/* Student Info & Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-4">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedStudentData.studentName}
                </h2>
                <p className="text-gray-600">
                  {selectedStudentData.className} • Adm No: {selectedStudentData.admissionNo}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Pending</p>
                <p className="text-2xl font-bold text-blue-700">{statusCounts.pending}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600">Submitted</p>
                <p className="text-2xl font-bold text-yellow-700">{statusCounts.submitted}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Graded</p>
                <p className="text-2xl font-bold text-green-700">{statusCounts.graded}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-700">{statusCounts.overdue}</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-lamaSky text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({selectedStudentData.assignments.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📝 Pending ({statusCounts.pending})
              </button>
              <button
                onClick={() => setFilter("submitted")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "submitted"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ✅ Submitted ({statusCounts.submitted})
              </button>
              <button
                onClick={() => setFilter("graded")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "graded"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⭐ Graded ({statusCounts.graded})
              </button>
              <button
                onClick={() => setFilter("overdue")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "overdue"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⚠️ Overdue ({statusCounts.overdue})
              </button>
            </div>
          </div>

          {/* Assignments List */}
          {filteredAssignments.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
              <p className="text-gray-600 font-medium">No assignments found</p>
              <p className="text-gray-500 text-sm mt-1">
                {filter === "all" 
                  ? "No assignments have been posted yet"
                  : `No ${filter} assignments found`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                const config = statusConfig[assignment.status];
                const dueDate = new Date(assignment.dueDate);
                const isOverdue = assignment.status === "OVERDUE";
                
                return (
                  <div
                    key={assignment.id}
                    className={`${config.bg} rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{config.icon}</span>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {assignment.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {assignment.subjectName}
                              </span>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}
                              >
                                {assignment.status}
                              </span>
                              <span className="text-sm text-gray-500">
                                Teacher: {assignment.teacherName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {dueDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                        {assignment.description}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {assignment.totalMarks} marks
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Posted {new Date(assignment.createdAt).toLocaleDateString("en-GB")}
                          </span>
                          <button
                            onClick={() => downloadAssignment(assignment)}
                            className="flex items-center gap-1 text-lamaSky hover:text-blue-700 font-medium"
                            title="Download assignment details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>

                        <div className="flex gap-2">
                          {!assignment.submission && (assignment.status === "PENDING" || assignment.status === "OVERDUE") && (
                            <button
                              onClick={() => openSubmissionModal(assignment)}
                              className="px-4 py-2 bg-lamaSky text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                            >
                              Submit Assignment
                            </button>
                          )}
                        </div>

                        {assignment.submission && (
                          <div className="text-right">
                            {assignment.submission.marks !== null ? (
                              <div>
                                <p className="text-sm text-gray-600">Score</p>
                                <p className="text-lg font-bold text-green-600">
                                  {assignment.submission.marks}/{assignment.totalMarks}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">
                                Submitted {new Date(assignment.submission.submittedAt!).toLocaleDateString("en-GB")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {assignment.submission?.feedback && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">Teacher's Feedback:</p>
                          <p className="text-sm text-gray-600 italic">{assignment.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Submit Assignment</h2>
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setSelectedAssignment(null);
                    setSubmissionText("");
                    setSubmissionFile(null);
                  }}
                  aria-label="Close submission modal"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Assignment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-2">{selectedAssignment.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 font-medium">
                    {selectedAssignment.subjectName}
                  </span>
                  <span>Teacher: {selectedAssignment.teacherName}</span>
                  <span>Total Marks: {selectedAssignment.totalMarks}</span>
                </div>
                <p className="text-sm text-gray-700">{selectedAssignment.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Due: {new Date(selectedAssignment.dueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Notes/Answer
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-lamaSky focus:border-transparent"
                    rows={6}
                    placeholder="Type your answer or provide notes about your submission..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach File (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-lamaSky transition-colors">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const maxSize = 10 * 1024 * 1024;
                          if (file.size > maxSize) {
                            toast.error("File size exceeds 10MB limit. Please choose a smaller file.");
                            e.target.value = "";
                            return;
                          }
                          setSubmissionFile(file);
                          toast.success(`File selected: ${file.name}`);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          {submissionFile ? (
                            <span className="font-medium text-lamaSky">
                              📎 {submissionFile.name}
                              <span className="text-xs text-gray-500 ml-2">
                                ({(submissionFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </span>
                          ) : (
                            <>
                              <span className="text-lamaSky font-medium">Click to upload</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                        </p>
                      </div>
                    </label>
                  </div>
                  {submissionFile && (
                    <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm text-green-700">✓ File ready to upload</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionFile(null);
                          toast.info("File removed");
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-lamaSky text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionModal(false);
                      setSelectedAssignment(null);
                      setSubmissionText("");
                      setSubmissionFile(null);
                    }}
                    disabled={submitting}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
