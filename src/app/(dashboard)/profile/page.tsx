"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Image from "next/image";

type ProfileData = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  photo: string | null;
  role: string;
  children?: Array<{
    id: string;
    name: string;
    admissionNumber: string;
    className: string;
    photo: string | null;
  }>;
  subjects?: Array<{
    id: string;
    name: string;
  }>;
  classes?: Array<{
    id: string;
    name: string;
  }>;
  admissionNumber?: string;
  className?: string;
  parentName?: string;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        address: data.address || "",
        email: data.email || "",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Profile updated successfully");
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Password change failed");
      }

      toast.success("Password changed successfully");
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="text-center py-12 text-gray-500">
          Profile not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold uppercase">
          {profile.role}
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profile.photo ? (
              <Image
                src={profile.photo}
                alt={`${profile.firstName} ${profile.lastName}`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                {profile.firstName?.[0]}
                {profile.lastName?.[0]}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-gray-600 mb-2">@{profile.username}</p>
            <p className="text-gray-700">
              <strong>Email:</strong> {profile.email}
            </p>
            {profile.phone && (
              <p className="text-gray-700">
                <strong>Phone:</strong> {profile.phone}
              </p>
            )}
            {profile.address && (
              <p className="text-gray-700">
                <strong>Address:</strong> {profile.address}
              </p>
            )}

            {/* Role-specific information */}
            {profile.role === "student" && (
              <div className="mt-4 space-y-1">
                <p className="text-gray-700">
                  <strong>Admission No:</strong> {profile.admissionNumber}
                </p>
                <p className="text-gray-700">
                  <strong>Class:</strong> {profile.className}
                </p>
                <p className="text-gray-700">
                  <strong>Parent:</strong> {profile.parentName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Parent: Children */}
        {profile.role === "parent" && profile.children && profile.children.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">My Children</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {profile.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {child.photo ? (
                      <Image
                        src={child.photo}
                        alt={child.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                        {child.name.split(" ")[0][0]}
                        {child.name.split(" ")[1]?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{child.name}</p>
                    <p className="text-sm text-gray-600">{child.className}</p>
                    <p className="text-xs text-gray-500">
                      {child.admissionNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teacher: Subjects and Classes */}
        {profile.role === "teacher" && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid md:grid-cols-2 gap-6">
              {profile.subjects && profile.subjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.subjects.map((subject) => (
                      <span
                        key={subject.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.classes && profile.classes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.classes.map((cls) => (
                      <span
                        key={cls.id}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {cls.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {editMode ? "Cancel Edit" : "Edit Profile"}
          </button>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {editMode && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-firstname" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="profile-firstname"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-lastname" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="profile-lastname"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="profile-address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="profile-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Form */}
      {showPasswordForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-600 mt-1">
                Minimum 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
