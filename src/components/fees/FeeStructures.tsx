"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type FeeStructure = {
  id: string;
  className: string;
  termName: string;
  tuitionFee: number;
  transportFee: number;
  activityFee: number;
  examFee: number;
  totalFee: number;
  dueDate: string;
};

export default function FeeStructures() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    classId: "",
    termId: "",
    tuitionFee: "",
    transportFee: "",
    activityFee: "",
    examFee: "",
    dueDate: "",
  });

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchStructures();
    fetchClassesAndTerms();
  }, []);

  const fetchStructures = async () => {
    try {
      const res = await fetch("/api/fees/structures");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStructures(data);
    } catch (error) {
      toast.error("Failed to load fee structures");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesAndTerms = async () => {
    try {
      const [classRes, termRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/terms"),
      ]);
      if (classRes.ok) setClasses(await classRes.json());
      if (termRes.ok) setTerms(await termRes.json());
    } catch (error) {
      console.error("Failed to fetch classes/terms");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalFee =
      Number(formData.tuitionFee) +
      Number(formData.transportFee) +
      Number(formData.activityFee) +
      Number(formData.examFee);

    const payload = {
      classId: formData.classId,
      termId: formData.termId,
      tuitionFee: Number(formData.tuitionFee),
      transportFee: Number(formData.transportFee),
      activityFee: Number(formData.activityFee),
      examFee: Number(formData.examFee),
      totalFee,
      dueDate: formData.dueDate,
    };

    try {
      const url = editingId
        ? `/api/fees/structures/${editingId}`
        : "/api/fees/structures";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(editingId ? "Updated successfully" : "Created successfully");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchStructures();
    } catch (error) {
      toast.error("Failed to save fee structure");
    }
  };

  const handleEdit = (structure: FeeStructure) => {
    setFormData({
      classId: structure.className, // Will need to map back to ID
      termId: structure.termName,
      tuitionFee: structure.tuitionFee.toString(),
      transportFee: structure.transportFee.toString(),
      activityFee: structure.activityFee.toString(),
      examFee: structure.examFee.toString(),
      dueDate: structure.dueDate,
    });
    setEditingId(structure.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee structure?")) return;

    try {
      const res = await fetch(`/api/fees/structures/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Deleted successfully");
      fetchStructures();
    } catch (error) {
      toast.error("Failed to delete fee structure");
    }
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      termId: "",
      tuitionFee: "",
      transportFee: "",
      activityFee: "",
      examFee: "",
      dueDate: "",
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fee Structures</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-lamaPurple hover:bg-opacity-80 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? "Cancel" : "+ Add Fee Structure"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              value={formData.classId}
              onChange={(e) =>
                setFormData({ ...formData, classId: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
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
            <label className="block text-sm font-medium mb-1">Term</label>
            <select
              value={formData.termId}
              onChange={(e) =>
                setFormData({ ...formData, termId: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tuition Fee (KES)
            </label>
            <input
              type="number"
              value={formData.tuitionFee}
              onChange={(e) =>
                setFormData({ ...formData, tuitionFee: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Transport Fee (KES)
            </label>
            <input
              type="number"
              value={formData.transportFee}
              onChange={(e) =>
                setFormData({ ...formData, transportFee: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Activity Fee (KES)
            </label>
            <input
              type="number"
              value={formData.activityFee}
              onChange={(e) =>
                setFormData({ ...formData, activityFee: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Exam Fee (KES)
            </label>
            <input
              type="number"
              value={formData.examFee}
              onChange={(e) =>
                setFormData({ ...formData, examFee: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              min="0"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
            >
              {editingId ? "Update" : "Create"} Fee Structure
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Class</th>
              <th className="border p-3 text-left">Term</th>
              <th className="border p-3 text-right">Tuition</th>
              <th className="border p-3 text-right">Transport</th>
              <th className="border p-3 text-right">Activity</th>
              <th className="border p-3 text-right">Exam</th>
              <th className="border p-3 text-right">Total</th>
              <th className="border p-3 text-left">Due Date</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.length === 0 ? (
              <tr>
                <td colSpan={9} className="border p-4 text-center text-gray-500">
                  No fee structures found. Click &quot;Add Fee Structure&quot; to create one.
                </td>
              </tr>
            ) : (
              structures.map((structure) => (
                <tr key={structure.id} className="hover:bg-gray-50">
                  <td className="border p-3">{structure.className}</td>
                  <td className="border p-3">{structure.termName}</td>
                  <td className="border p-3 text-right">
                    {structure.tuitionFee.toLocaleString()}
                  </td>
                  <td className="border p-3 text-right">
                    {structure.transportFee.toLocaleString()}
                  </td>
                  <td className="border p-3 text-right">
                    {structure.activityFee.toLocaleString()}
                  </td>
                  <td className="border p-3 text-right">
                    {structure.examFee.toLocaleString()}
                  </td>
                  <td className="border p-3 text-right font-semibold">
                    {structure.totalFee.toLocaleString()}
                  </td>
                  <td className="border p-3">
                    {new Date(structure.dueDate).toLocaleDateString()}
                  </td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleEdit(structure)}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(structure.id)}
                      className="text-red-500 hover:underline"
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
  );
}
