"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type BehaviorIncident = {
  id: string;
  studentName: string;
  studentAdmission: string;
  title: string;
  description: string;
  incidentType: string;
  category: string;
  severity: string;
  actionTaken: string | null;
  incidentDate: string;
};

type Student = {
  id: string;
  name: string;
  admissionNo: string;
};

export default function TeacherBehavior() {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    description: "",
    incidentType: "NEUTRAL",
    category: "OTHER",
    severity: "MEDIUM",
    actionTaken: "",
    incidentDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      console.log("Fetching behavior incidents and students...");
      const [incidentsRes, studentsRes] = await Promise.all([
        fetch("/api/teacher/behavior"),
        fetch("/api/teacher/students"),
      ]);

      console.log("Incidents response status:", incidentsRes.status);
      console.log("Students response status:", studentsRes.status);

      if (!incidentsRes.ok || !studentsRes.ok) {
        const incidentsError = !incidentsRes.ok ? await incidentsRes.json() : null;
        const studentsError = !studentsRes.ok ? await studentsRes.json() : null;
        console.error("Incidents error:", incidentsError);
        console.error("Students error:", studentsError);
        throw new Error("Failed to fetch");
      }

      const [incidentsData, studentsData] = await Promise.all([
        incidentsRes.json(),
        studentsRes.json(),
      ]);

      console.log("Incidents data:", incidentsData);
      console.log("Students data:", studentsData);

      setIncidents(incidentsData.incidents || []);
      setStudents(studentsData.students || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId || !formData.title || !formData.description) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const res = await fetch("/api/teacher/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast.success("Behavior incident recorded!");
      setShowCreateForm(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error("Failed to record incident");
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      title: "",
      description: "",
      incidentType: "NEUTRAL",
      category: "OTHER",
      severity: "MEDIUM",
      actionTaken: "",
      incidentDate: new Date().toISOString().split("T")[0],
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "POSITIVE":
        return "bg-green-100 text-green-800";
      case "NEGATIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      default:
        return "text-gray-600";
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Behavior Tracking</h1>
          <p className="text-gray-600 mt-1">Record and monitor student behavior</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Record Incident
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Record Behavior Incident</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="behavior-student" className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                <select
                  id="behavior-student"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Brief summary"
                  required
                />
              </div>

              <div>
                <label htmlFor="behavior-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="behavior-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="incident-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Date *
                  </label>
                  <input
                    id="incident-date"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, incidentDate: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="incident-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="incident-type"
                    value={formData.incidentType}
                    onChange={(e) =>
                      setFormData({ ...formData, incidentType: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="POSITIVE">Positive</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="NEGATIVE">Negative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="incident-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="incident-category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="DISCIPLINE">Discipline</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="SOCIAL">Social</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="incident-severity" className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    id="incident-severity"
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Taken
                </label>
                <textarea
                  value={formData.actionTaken}
                  onChange={(e) =>
                    setFormData({ ...formData, actionTaken: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="What action was taken?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Save Incident
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

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            No behavior incidents recorded
          </div>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {incident.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                        incident.incidentType
                      )}`}
                    >
                      {incident.incidentType}
                    </span>
                    <span className={`text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity} Severity
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Student:</strong> {incident.studentName} ({incident.studentAdmission})
                  </p>

                  <p className="text-gray-700 mb-2">{incident.description}</p>

                  {incident.actionTaken && (
                    <div className="bg-blue-50 p-3 rounded mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Action Taken:</strong> {incident.actionTaken}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-500 mt-4 pt-4 border-t">
                <span>
                  <strong>Category:</strong> {incident.category}
                </span>
                <span>
                  <strong>Date:</strong>{" "}
                  {new Date(incident.incidentDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
