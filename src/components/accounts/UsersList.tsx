"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type User = {
  id: string;
  email: string;
  role: string;
  name: string;
  surname: string;
  createdAt: string;
};

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.append("role", roleFilter);

      const res = await fetch(`/api/accounts/list?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user: ${email}?`)) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleResetPassword = async (id: string, email: string) => {
    if (!confirm(`Reset password for ${email} to default (School@123)?`)) return;

    try {
      const res = await fetch(`/api/accounts/${id}/reset-password`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reset");

      toast.success("Password reset successfully");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.surname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Users</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Students</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === "STUDENT").length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Teachers</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.role === "TEACHER").length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Parents</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter((u) => u.role === "PARENT").length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Staff</p>
          <p className="text-2xl font-bold text-yellow-600">
            {users.filter((u) => u.role === "STAFF").length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-center">Role</th>
              <th className="border p-3 text-center">Created At</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="border p-4 text-center text-gray-500">
                  No users found matching your criteria
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-3">
                    {user.name} {user.surname}
                  </td>
                  <td className="border p-3">{user.email}</td>
                  <td className="border p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-600"
                          : user.role === "TEACHER"
                          ? "bg-green-100 text-green-600"
                          : user.role === "STUDENT"
                          ? "bg-blue-100 text-blue-600"
                          : user.role === "PARENT"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="border p-3 text-center text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      className="text-blue-500 hover:underline text-sm mr-3"
                    >
                      Reset Password
                    </button>
                    {user.role !== "ADMIN" && (
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
