"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Bus = {
  id: string;
  registrationNo: string;
  capacity: number;
  driverName: string | null;
  route: string | null;
  status: string;
  studentsCount: number;
};

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    registrationNo: "",
    capacity: "",
    driverName: "",
    route: "",
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await fetch("/api/admin/buses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBuses(data.buses);
    } catch (error) {
      console.error("Error fetching buses:", error);
      toast.error("Failed to load buses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.registrationNo || !formData.capacity) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/admin/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast.success("Bus created!");
      setShowCreateForm(false);
      fetchBuses();
      resetForm();
    } catch (error) {
      toast.error("Failed to create bus");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bus?")) return;

    try {
      const res = await fetch(`/api/admin/buses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Bus deleted!");
      fetchBuses();
    } catch (error) {
      toast.error("Failed to delete bus");
    }
  };

  const resetForm = () => {
    setFormData({
      registrationNo: "",
      capacity: "",
      driverName: "",
      route: "",
    });
  };

  const filteredBuses = buses.filter((bus) =>
    bus.registrationNo.toLowerCase().includes(search.toLowerCase()) ||
    bus.route?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: buses.length,
    active: buses.filter((b) => b.status === "ACTIVE").length,
    totalCapacity: buses.reduce((sum, b) => sum + b.capacity, 0),
    totalStudents: buses.reduce((sum, b) => sum + b.studentsCount, 0),
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bus Management</h1>
          <p className="text-gray-600 mt-1">Manage school transportation fleet</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Add Bus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Buses</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Capacity</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalCapacity}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Students Using</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalStudents}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by registration or route..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lamaSky"
        />
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Add New Bus</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNo}
                    onChange={(e) =>
                      setFormData({ ...formData, registrationNo: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., KAA 123B"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bus-capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    id="bus-capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bus-driver" className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name
                  </label>
                  <input
                    id="bus-driver"
                    type="text"
                    value={formData.driverName}
                    onChange={(e) =>
                      setFormData({ ...formData, driverName: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route
                  </label>
                  <input
                    type="text"
                    value={formData.route}
                    onChange={(e) =>
                      setFormData({ ...formData, route: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., CBD - Westlands"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Create Bus
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

      {/* Bus List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuses.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">
            No buses found
          </div>
        ) : (
          filteredBuses.map((bus) => (
            <div
              key={bus.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {bus.registrationNo}
                  </h3>
                  <p className="text-sm text-gray-600">{bus.route || "No route assigned"}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    bus.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {bus.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{bus.capacity} seats</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-medium">{bus.studentsCount}/{bus.capacity}</span>
                </div>
                {bus.driverName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-medium">{bus.driverName}</span>
                  </div>
                )}
              </div>

              {/* Occupancy bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Occupancy</span>
                  <span>{Math.round((bus.studentsCount / bus.capacity) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      bus.studentsCount / bus.capacity > 0.9
                        ? "bg-red-500"
                        : bus.studentsCount / bus.capacity > 0.7
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${(bus.studentsCount / bus.capacity) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(bus.id)}
                className="w-full text-red-600 border border-red-600 py-2 rounded-lg hover:bg-red-50 transition text-sm font-medium"
              >
                Delete Bus
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
