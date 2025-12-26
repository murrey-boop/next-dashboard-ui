"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type Incident = {
  id: string;
  studentName: string;
  studentAdmission: string;
  teacherName: string;
  title: string;
  description: string;
  incidentType: string;
  category: string;
  severity: string;
  actionTaken: string | null;
  incidentDate: string;
};

export default function ParentBehavior() {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");

  useEffect(() => {
    if (session) {
      fetchIncidents();
    }
  }, [session]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/parent/behavior");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setIncidents(data.incidents || []);
    } catch (error) {
      toast.error("Failed to load behavior incidents");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "POSITIVE":
        return "bg-green-100 text-green-800 border-green-300";
      case "NEGATIVE":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DISCIPLINE":
        return "⚖️";
      case "ACADEMIC":
        return "📚";
      case "SOCIAL":
        return "👥";
      default:
        return "📋";
    }
  };

  const uniqueStudents = Array.from(new Set(incidents.map((i) => i.studentName)));

  const filteredIncidents =
    selectedStudent === "all"
      ? incidents
      : incidents.filter((i) => i.studentName === selectedStudent);

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
          <h1 className="text-2xl font-bold text-gray-800">Behavior Records</h1>
          <p className="text-gray-600 mt-1">View your children's behavior incidents</p>
        </div>

        {uniqueStudents.length > 1 && (
          <select
            aria-label="Select child"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Children</option>
            {uniqueStudents.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Statistics */}
      {filteredIncidents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Total Incidents</p>
            <p className="text-2xl font-bold text-gray-800">{filteredIncidents.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Positive</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredIncidents.filter((i) => i.incidentType === "POSITIVE").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Negative</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredIncidents.filter((i) => i.incidentType === "NEGATIVE").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Neutral</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredIncidents.filter((i) => i.incidentType === "NEUTRAL").length}
            </p>
          </div>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            No behavior incidents recorded
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
                incident.incidentType === "POSITIVE"
                  ? "border-green-500"
                  : incident.incidentType === "NEGATIVE"
                  ? "border-red-500"
                  : "border-gray-500"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(incident.category)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{incident.title}</h3>
                      <p className="text-sm text-gray-600">
                        {incident.studentName} ({incident.studentAdmission})
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{incident.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm border ${getTypeColor(
                        incident.incidentType
                      )}`}
                    >
                      {incident.incidentType}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-300">
                      {incident.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(incident.severity)}`}>
                      Severity: {incident.severity}
                    </span>
                  </div>

                  {incident.actionTaken && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Action Taken:</strong> {incident.actionTaken}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(incident.incidentDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">Teacher: {incident.teacherName}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
