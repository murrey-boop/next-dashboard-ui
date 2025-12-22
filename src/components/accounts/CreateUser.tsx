"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type UserRole = "TEACHER" | "STUDENT" | "PARENT" | "STAFF";

export default function CreateUser() {
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [loading, setLoading] = useState(false);
  const [createNewParent, setCreateNewParent] = useState(false);

  const [formData, setFormData] = useState({
    // Common fields
    email: "",
    name: "",
    surname: "",
    phone: "",
    address: "",
    bloodType: "",
    birthday: "",
    sex: "MALE",

    // Student specific
    admissionNumber: "",
    classId: "",
    parentId: "",

    // New parent creation fields
    parentName: "",
    parentSurname: "",
    parentEmail: "",
    parentPhone: "",

    // Teacher/Staff specific
    employeeNumber: "",
    tscNumber: "",
    teacherRole: "TEACHER",
    qualification: "",
    subject1: "",
    subject2: "",
    subject3: "",
    subject4: "",
    subject5: "",
  });

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [parents, setParents] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Generate admission/employee number when role changes
    if (role === "STUDENT") {
      generateAdmissionNumber();
    } else if (role === "TEACHER" || role === "STAFF") {
      generateEmployeeNumber();
    }
  }, [role]);

  const fetchData = async () => {
    try {
      const [classRes, parentRes, subjectRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/parents/list"),
        fetch("/api/subjects"),
      ]);

      if (classRes.ok) setClasses(await classRes.json());
      if (parentRes.ok) setParents(await parentRes.json());
      if (subjectRes.ok) setSubjects(await subjectRes.json());
    } catch (error) {
      console.error("Failed to fetch data");
    }
  };

  const generateAdmissionNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    setFormData((prev) => ({ ...prev, admissionNumber: `STU${year}${random}` }));
  };

  const generateEmployeeNumber = () => {
    const prefix = role === "TEACHER" ? "TCH" : "STF";
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    setFormData((prev) => ({ ...prev, employeeNumber: `${prefix}${year}${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Age validation for teachers and staff (must be 18+)
    if ((role === "TEACHER" || role === "STAFF") && formData.birthday) {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Check if they haven't had their birthday this year
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;
      
      if (actualAge < 18) {
        toast.error(`${role}s must be at least 18 years old`);
        return;
      }
    }
    
    setLoading(true);

    const payload = {
      role,
      ...formData,
    };

    try {
      const res = await fetch("/api/accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }

      const user = await res.json();
      toast.success(`${role} account created successfully! Default password: School@123`);
      
      // Reset form
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      surname: "",
      phone: "",
      address: "",
      bloodType: "",
      birthday: "",
      sex: "MALE",
      admissionNumber: "",
      classId: "",
      parentId: "",
      parentName: "",
      parentSurname: "",
      parentEmail: "",
      parentPhone: "",
      employeeNumber: "",
      tscNumber: "",
      teacherRole: "TEACHER",
      qualification: "",
      subject1: "",
      subject2: "",
      subject3: "",
      subject4: "",
      subject5: "",
    });
    if (role === "STUDENT") {
      generateAdmissionNumber();
    } else if (role === "TEACHER" || role === "STAFF") {
      generateEmployeeNumber();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create New User Account</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium mb-2">Select Role *</label>
          <div className="grid grid-cols-4 gap-4">
            {(["STUDENT", "TEACHER", "PARENT", "STAFF"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-4 rounded-lg border-2 transition ${
                  role === r
                    ? "border-lamaPurple bg-lamaPurplleLight"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="font-semibold">{r}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="+254..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth *</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sex *</label>
            <select
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Blood Type</label>
            <select
              value={formData.bloodType}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Student Specific Fields */}
        {role === "STUDENT" && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-900">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Admission Number (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.admissionNumber}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Class *</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
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

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Parent/Guardian
                </label>
                
                <div className="flex items-center gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setCreateNewParent(false)}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      !createNewParent
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    Select Existing Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateNewParent(true)}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      createNewParent
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    Create New Parent
                  </button>
                </div>

                {!createNewParent ? (
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">No parent (Optional)</option>
                    {parents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 p-4 bg-white rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">Parent account will be created automatically</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Parent First Name *</label>
                        <input
                          type="text"
                          value={formData.parentName}
                          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required={createNewParent}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Parent Last Name *</label>
                        <input
                          type="text"
                          value={formData.parentSurname}
                          onChange={(e) => setFormData({ ...formData, parentSurname: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required={createNewParent}
                          placeholder="Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Parent Email *</label>
                        <input
                          type="email"
                          value={formData.parentEmail}
                          onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required={createNewParent}
                          placeholder="parent@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Parent Phone *</label>
                        <input
                          type="tel"
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          required={createNewParent}
                          placeholder="+254..."
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Default password: <span className="font-semibold">School@123</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teacher Specific Fields */}
        {role === "TEACHER" && (
          <div className="bg-green-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-green-900">Teacher Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Employee Number (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.employeeNumber}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  TSC Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.tscNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, tscNumber: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Teachers Service Commission Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teacher Position/Role *</label>
                <select
                  value={formData.teacherRole}
                  onChange={(e) =>
                    setFormData({ ...formData, teacherRole: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="TEACHER">Teacher</option>
                  <option value="SENIOR_TEACHER">Senior Teacher</option>
                  <option value="DEPUTY_HEAD">Deputy Headteacher</option>
                  <option value="HEADTEACHER">Headteacher</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., B.Ed, M.Ed"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Subjects to Teach *
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Subject 1 *</label>
                      <input
                        type="text"
                        value={formData.subject1}
                        onChange={(e) => setFormData({ ...formData, subject1: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Subject 2 *</label>
                      <input
                        type="text"
                        value={formData.subject2}
                        onChange={(e) => setFormData({ ...formData, subject2: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., English"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Subject 3 *</label>
                      <input
                        type="text"
                        value={formData.subject3}
                        onChange={(e) => setFormData({ ...formData, subject3: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., Science"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Subject 4 (Optional)</label>
                      <input
                        type="text"
                        value={formData.subject4}
                        onChange={(e) => setFormData({ ...formData, subject4: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., History"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Subject 5 (Optional)</label>
                      <input
                        type="text"
                        value={formData.subject5}
                        onChange={(e) => setFormData({ ...formData, subject5: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., Art"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Specific Fields */}
        {role === "STAFF" && (
          <div className="bg-yellow-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-yellow-900">Staff Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Employee Number (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.employeeNumber}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Position/Role</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Librarian, Accountant"
                />
              </div>
            </div>
          </div>
        )}

        {/* Parent has no specific fields - just common ones */}
        {role === "PARENT" && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Parent Information</h3>
            <p className="text-sm text-gray-600">
              Parent accounts can be linked to students later from the student creation form.
            </p>
          </div>
        )}

        {/* Default Password Info */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
          <p className="text-sm font-medium">
            ⚠️ Default Password: <span className="font-bold">School@123</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            User will be prompted to change password on first login (feature to be implemented)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg transition font-semibold"
          >
            {loading ? "Creating..." : `Create ${role} Account`}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-8 py-3 rounded-lg transition font-semibold"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}
