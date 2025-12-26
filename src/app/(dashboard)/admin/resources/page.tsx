"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  fileName: string | null;
  fileType: string | null;
  subjectName: string | null;
  className: string | null;
  uploadedBy: string;
  isPublic: boolean;
  downloads: number;
  createdAt: string;
};

export default function AdminResources() {
  const { data: session } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchResources();
    }
  }, [session]);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/admin/resources");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setResources(data.resources || []);
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Resource deleted successfully");
      setResources((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return "🔗";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("doc")) return "📝";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎥";
    return "📎";
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
          <h1 className="text-2xl font-bold text-gray-800">Resource Management</h1>
          <p className="text-gray-600 mt-1">Manage all uploaded teaching resources</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">Total Resources</p>
          <p className="text-2xl font-bold text-gray-800">{resources.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">Public Resources</p>
          <p className="text-2xl font-bold text-green-600">
            {resources.filter((r) => r.isPublic).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">Private Resources</p>
          <p className="text-2xl font-bold text-blue-600">
            {resources.filter((r) => !r.isPublic).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">Total Downloads</p>
          <p className="text-2xl font-bold text-purple-600">
            {resources.reduce((sum, r) => sum + r.downloads, 0)}
          </p>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Subject/Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Uploaded By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Visibility
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Downloads
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {resources.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No resources uploaded yet
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(resource.fileType)}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{resource.title}</p>
                        {resource.description && (
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-800">{resource.subjectName || "-"}</p>
                    <p className="text-sm text-gray-600">{resource.className || "-"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-800">{resource.uploadedBy}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        resource.isPublic
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {resource.isPublic ? "Public" : "Private"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-800">{resource.downloads}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setDeleteConfirm(resource.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this resource? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
