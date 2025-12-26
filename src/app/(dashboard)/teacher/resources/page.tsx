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
  downloads: number;
  createdAt: string;
};

type Subject = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
};

export default function TeacherResources() {
  const { data: session } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    classId: "",
    fileUrl: "",
    isPublic: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      console.log("Fetching resources and dashboard data...");
      const [resourcesRes, dashboardRes] = await Promise.all([
        fetch("/api/teacher/resources"),
        fetch("/api/teacher/dashboard"),
      ]);

      console.log("Resources response status:", resourcesRes.status);
      console.log("Dashboard response status:", dashboardRes.status);

      if (!resourcesRes.ok || !dashboardRes.ok) {
        const resourcesError = !resourcesRes.ok ? await resourcesRes.json() : null;
        const dashboardError = !dashboardRes.ok ? await dashboardRes.json() : null;
        console.error("Resources error:", resourcesError);
        console.error("Dashboard error:", dashboardError);
        throw new Error("Failed to fetch");
      }

      const [resourcesData, dashboardData] = await Promise.all([
        resourcesRes.json(),
        dashboardRes.json(),
      ]);

      console.log("Resources data:", resourcesData);
      console.log("Dashboard data:", dashboardData);

      setResources(resourcesData.resources || []);
      setSubjects(dashboardData.subjects || []);
      setClasses(dashboardData.classes || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Please provide a title");
      return;
    }

    if (!selectedFile && !formData.fileUrl) {
      toast.error("Please upload a file or provide a URL");
      return;
    }

    setUploading(true);

    try {
      let fileData = null;
      let fileName = null;
      let fileType = null;

      if (selectedFile) {
        const reader = new FileReader();
        fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }

      const res = await fetch("/api/teacher/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fileData,
          fileName,
          fileType,
        }),
      });

      if (!res.ok) throw new Error("Failed to upload");

      toast.success("Resource uploaded!");
      setShowUploadForm(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error("Failed to upload resource");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const res = await fetch(`/api/teacher/resources/${resource.id}/download`);
      if (!res.ok) throw new Error("Failed to download");

      const data = await res.json();

      if (data.fileData) {
        const link = document.createElement("a");
        link.href = data.fileData;
        link.download = resource.fileName || "download";
        link.click();
      } else if (data.fileUrl) {
        window.open(data.fileUrl, "_blank");
      }

      // Increment download count
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r
        )
      );
    } catch (error) {
      toast.error("Failed to download resource");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subjectId: "",
      classId: "",
      fileUrl: "",
      isPublic: true,
    });
    setSelectedFile(null);
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
          <h1 className="text-2xl font-bold text-gray-800">Resource Library</h1>
          <p className="text-gray-600 mt-1">Teaching materials and resources</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Upload Resource
        </button>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Resource</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label htmlFor="resource-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="resource-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label htmlFor="resource-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="resource-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="resource-subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    id="resource-subject"
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="resource-class" className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    id="resource-class"
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="resource-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File (Max 10MB)
                </label>
                <input
                  id="resource-file"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mp3"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="resource-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Or provide URL
                </label>
                <input
                  id="resource-url"
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is-public"
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="mr-2"
                />
                <label htmlFor="is-public" className="text-sm text-gray-700">Make public to all teachers</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Resource"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            No resources uploaded yet
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{getFileIcon(resource.fileType)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-4">
                {resource.subjectName && (
                  <p>
                    <strong>Subject:</strong> {resource.subjectName}
                  </p>
                )}
                {resource.className && (
                  <p>
                    <strong>Class:</strong> {resource.className}
                  </p>
                )}
                <p>
                  <strong>Downloads:</strong> {resource.downloads}
                </p>
              </div>

              <button
                onClick={() => handleDownload(resource)}
                className="w-full bg-lamaSky text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm"
              >
                📥 Download
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
