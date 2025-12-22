"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function BulkImport() {
  const [role, setRole] = useState<"STUDENT" | "TEACHER" | "PARENT">("STUDENT");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const downloadTemplate = () => {
    let csvContent = "";
    
    if (role === "STUDENT") {
      csvContent = "name,surname,email,phone,birthday,sex,bloodType,address,classId\n";
      csvContent += "John,Doe,john.doe@example.com,+254712345678,2010-01-15,MALE,A+,Nairobi,class-id-here\n";
      csvContent += "Jane,Smith,jane.smith@example.com,+254723456789,2011-03-20,FEMALE,B+,Mombasa,class-id-here\n";
    } else if (role === "TEACHER") {
      csvContent = "name,surname,email,phone,birthday,sex,bloodType,address,qualification,subjects\n";
      csvContent += "Robert,Brown,robert.brown@example.com,+254734567890,1985-05-10,MALE,O+,Kisumu,B.Ed,subject-id-1;subject-id-2\n";
      csvContent += "Mary,Johnson,mary.j@example.com,+254745678901,1990-08-25,FEMALE,AB+,Nakuru,M.Ed,subject-id-3\n";
    } else if (role === "PARENT") {
      csvContent = "name,surname,email,phone,birthday,sex,bloodType,address\n";
      csvContent += "Peter,Williams,peter.w@example.com,+254756789012,1980-12-01,MALE,A-,Eldoret\n";
      csvContent += "Sarah,Davis,sarah.d@example.com,+254767890123,1982-07-15,FEMALE,B-,Thika\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${role.toLowerCase()}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);

    try {
      const res = await fetch("/api/accounts/bulk-import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await res.json();
      setResults(data);
      toast.success(
        `Successfully created ${data.successful} accounts. ${data.failed} failed.`
      );
      setFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Bulk Import Users</h2>

      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Role *</label>
          <div className="grid grid-cols-3 gap-4">
            {(["STUDENT", "TEACHER", "PARENT"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setFile(null);
                  setResults(null);
                }}
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

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Download the CSV template for {role.toLowerCase()}s</li>
            <li>Fill in the required information (do not change column headers)</li>
            <li>Save the file as CSV format</li>
            <li>Upload the file using the form below</li>
            <li>Review results and fix any errors</li>
          </ol>
        </div>

        {/* Download Template */}
        <div>
          <button
            onClick={downloadTemplate}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition"
          >
            📥 Download CSV Template for {role}
          </button>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg transition"
          >
            {file ? (
              <div>
                <p className="font-medium">Selected: {file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Click to select CSV file</p>
                <p className="text-sm text-gray-500">or drag and drop here</p>
              </div>
            )}
          </label>
        </div>

        {/* Upload Button */}
        {file && (
          <div>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg transition font-semibold"
            >
              {loading ? "Uploading..." : `Upload & Create ${role} Accounts`}
            </button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Import Results</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold">{results.total}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{results.successful}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                <div className="bg-red-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <ul className="text-sm space-y-1">
                    {results.errors.map((error: any, index: number) => (
                      <li key={index} className="text-red-700">
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {results.successful > 0 && (
              <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-sm font-medium text-green-900">
                  ✓ {results.successful} {role.toLowerCase()}(s) created successfully with default password: School@123
                </p>
              </div>
            )}
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>All accounts will be created with default password: <strong>School@123</strong></li>
            <li>Email addresses must be unique across the system</li>
            <li>For students: classId must be a valid class ID from the system</li>
            <li>For teachers: subjects should be semicolon-separated IDs (e.g., id1;id2;id3)</li>
            <li>Date format: YYYY-MM-DD (e.g., 2010-01-15)</li>
            <li>Sex values: MALE or FEMALE only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
