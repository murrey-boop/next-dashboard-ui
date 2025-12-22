"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type Subject = {
  id: string;
  name: string;
  code?: string;
};

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch subjects");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Subject name is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/subjects/${editingId}` : "/api/subjects";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save subject");
      }

      toast.success(editingId ? "Subject updated!" : "Subject created!");
      setFormData({ name: "", code: "" });
      setEditingId(null);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setFormData({ name: subject.name, code: subject.code || "" });
    setEditingId(subject.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete subject");
      }

      toast.success("Subject deleted!");
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const cancelEdit = () => {
    setFormData({ name: "", code: "" });
    setEditingId(null);
  };

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-6">Subject Management</h1>

      {/* Create/Edit Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Subject" : "Add New Subject"}
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Subject Code (Optional)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., MATH101"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition"
          >
            {loading ? "Saving..." : editingId ? "Update" : "Add Subject"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Subject Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Subject Code
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No subjects found. Add your first subject above.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {subject.code || "-"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
