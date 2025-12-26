"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
};

export default function TeacherAnnouncements() {
  const { data: session, status } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnnouncements();
    }
  }, [status]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/teacher/announcements");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setAnnouncements(data.announcements);
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "IMPORTANT":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
        <p className="text-gray-600 mt-1">School and class announcements</p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            No announcements at this time
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${getPriorityColor(
                announcement.priority
              )}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {announcement.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                    announcement.priority
                  )}`}
                >
                  {announcement.priority}
                </span>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap mb-4">
                {announcement.content}
              </p>
              <p className="text-sm text-gray-500">
                Posted: {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
