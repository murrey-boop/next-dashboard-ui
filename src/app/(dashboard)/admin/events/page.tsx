"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  eventType: string;
  className: string | null;
};

type Class = {
  id: string;
  name: string;
};

export default function AdminCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    endDate: "",
    eventType: "OTHER",
    classId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, classesRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/classes"),
      ]);

      if (!eventsRes.ok || !classesRes.ok) throw new Error("Failed to fetch");

      const [eventsData, classesData] = await Promise.all([
        eventsRes.json(),
        classesRes.json(),
      ]);

      setEvents(eventsData.events);
      setClasses(classesData.classes);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.eventDate) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast.success("Event created!");
      setShowCreateForm(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Event deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      endDate: "",
      eventType: "OTHER",
      classId: "",
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "HOLIDAY":
        return "bg-green-100 text-green-800";
      case "EXAM":
        return "bg-red-100 text-red-800";
      case "MEETING":
        return "bg-blue-100 text-blue-800";
      case "SPORTS":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <h1 className="text-2xl font-bold text-gray-800">Calendar Events</h1>
          <p className="text-gray-600 mt-1">Manage school calendar</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + New Event
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Event</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EXAM">Exam</option>
                    <option value="MEETING">Meeting</option>
                    <option value="SPORTS">Sports</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Class
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All School</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Create Event
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

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            No events scheduled
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(
                    event.eventType
                  )}`}
                >
                  {event.eventType}
                </span>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {event.title}
              </h3>

              {event.description && (
                <p className="text-gray-600 text-sm mb-3">{event.description}</p>
              )}

              <div className="space-y-1 text-sm text-gray-500">
                <p>
                  <strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}
                  {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                </p>
                {event.className && (
                  <p>
                    <strong>Class:</strong> {event.className}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
