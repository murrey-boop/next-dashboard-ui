"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Teacher = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
};

type ScheduleEntry = {
  id?: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
};

export default function AdminSchedules() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<ScheduleEntry>({
    teacherId: "",
    subjectId: "",
    classId: "",
    day: "Monday",
    startTime: "08:00",
    endTime: "09:00",
    room: "",
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherSchedule();
    }
  }, [selectedTeacher]);

  const fetchInitialData = async () => {
    try {
      const [teachersRes, subjectsRes, classesRes] = await Promise.all([
        fetch("/api/admin/teachers"),
        fetch("/api/admin/subjects"),
        fetch("/api/admin/classes"),
      ]);

      if (!teachersRes.ok || !subjectsRes.ok || !classesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [teachersData, subjectsData, classesData] = await Promise.all([
        teachersRes.json(),
        subjectsRes.json(),
        classesRes.json(),
      ]);

      setTeachers(teachersData.teachers || []);
      setSubjects(subjectsData.subjects || []);
      setClasses(classesData.classes || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedule = async () => {
    try {
      const res = await fetch(`/api/admin/schedules?teacherId=${selectedTeacher}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      toast.error("Failed to load schedule");
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, teacherId: selectedTeacher }),
      });

      if (!res.ok) throw new Error("Failed to add");

      toast.success("Schedule added successfully!");
      setShowAddForm(false);
      fetchTeacherSchedule();
      resetForm();
    } catch (error) {
      toast.error("Failed to add schedule");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete this schedule entry?")) return;

    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Schedule deleted!");
      fetchTeacherSchedule();
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  const handleBulkGenerate = async () => {
    if (!confirm("Generate schedules for all teachers? This will overwrite existing schedules.")) return;

    try {
      const res = await fetch("/api/admin/schedules/bulk", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to generate");

      toast.success("Bulk schedules generated!");
      if (selectedTeacher) fetchTeacherSchedule();
    } catch (error) {
      toast.error("Failed to generate schedules");
    }
  };

  const resetForm = () => {
    setFormData({
      teacherId: "",
      subjectId: "",
      classId: "",
      day: "Monday",
      startTime: "08:00",
      endTime: "09:00",
      room: "",
    });
  };

  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.name || "N/A";
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "N/A";
  const getClassName = (id: string) => classes.find((c) => c.id === id)?.name || "N/A";

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
          <h1 className="text-2xl font-bold text-gray-800">Manage Schedules</h1>
          <p className="text-gray-600 mt-1">Assign classes to teachers</p>
        </div>
        <button
          onClick={handleBulkGenerate}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
        >
          🔄 Auto-Generate All
        </button>
      </div>

      {/* Teacher Selection */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <label htmlFor="schedule-teacher" className="block text-sm font-medium text-gray-700 mb-2">
          Select Teacher
        </label>
        <select
          id="schedule-teacher"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lamaSky"
        >
          <option value="">-- Choose a teacher --</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeacher && (
        <>
          {/* Add Schedule Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {showAddForm ? "Cancel" : "+ Add Schedule Entry"}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Add Schedule Entry</h3>
              <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="schedule-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    id="schedule-subject"
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
                  <label htmlFor="schedule-class" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    id="schedule-class"
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

                <div>
                  <label htmlFor="schedule-day" className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    id="schedule-day"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="schedule-room" className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <input
                    id="schedule-room"
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Room 101"
                  />
                </div>

                <div>
                  <label htmlFor="schedule-start-time" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    id="schedule-start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="schedule-end-time" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    id="schedule-end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    Add Entry
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Schedule Table */}
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No schedule entries yet. Click "Add Schedule Entry" to create one.
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{schedule.day}</td>
                      <td className="px-4 py-3">
                        {schedule.startTime} - {schedule.endTime}
                      </td>
                      <td className="px-4 py-3">{getSubjectName(schedule.subjectId)}</td>
                      <td className="px-4 py-3">{getClassName(schedule.classId)}</td>
                      <td className="px-4 py-3">{schedule.room || "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => schedule.id && handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
