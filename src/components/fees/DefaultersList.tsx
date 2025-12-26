"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type Defaulter = {
  id: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  termName: string;
  totalFees: number;
  paidAmount: number;
  balance: number;
  status: string;
  lastPaymentDate: string | null;
};

export default function DefaultersList() {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    classId: "",
    termId: "",
    minBalance: "",
  });

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchClassesAndTerms();
    fetchDefaulters();
  }, []);

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

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.classId) params.append("classId", filters.classId);
      if (filters.termId) params.append("termId", filters.termId);
      if (filters.minBalance) params.append("minBalance", filters.minBalance);

      const res = await fetch(`/api/fees/defaulters?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setDefaulters(data);
    } catch (error) {
      toast.error("Failed to load defaulters list");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    fetchDefaulters();
  };

  const clearFilters = () => {
    setFilters({ classId: "", termId: "", minBalance: "" });
    setTimeout(() => fetchDefaulters(), 100);
  };

  const exportToCSV = () => {
    const headers = [
      "Admission No",
      "Student Name",
      "Class",
      "Term",
      "Total Fees",
      "Paid Amount",
      "Balance",
      "Status",
      "Last Payment",
    ];

    const rows = defaulters.map((d) => [
      d.admissionNumber,
      d.studentName,
      d.className,
      d.termName,
      d.totalFees,
      d.paidAmount,
      d.balance,
      d.status,
      d.lastPaymentDate
        ? new Date(d.lastPaymentDate).toLocaleDateString()
        : "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `defaulters-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Exported to CSV");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-100";
      case "PARTIAL":
        return "text-yellow-600 bg-yellow-100";
      case "PENDING":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fee Defaulters</h2>
        <button
          onClick={exportToCSV}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
        >
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-4 gap-4">
        <div>
          <label htmlFor="class-filter" className="block text-sm font-medium mb-1">Class</label>
          <select
            id="class-filter"
            value={filters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="term-filter" className="block text-sm font-medium mb-1">Term</label>
          <select
            id="term-filter"
            value={filters.termId}
            onChange={(e) => handleFilterChange("termId", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Terms</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Min Balance (KES)
          </label>
          <input
            type="number"
            value={filters.minBalance}
            onChange={(e) => handleFilterChange("minBalance", e.target.value)}
            placeholder="e.g., 5000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            min="0"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={applyFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total Defaulters</h3>
          <p className="text-2xl font-bold text-red-600">{defaulters.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total Outstanding</h3>
          <p className="text-2xl font-bold text-yellow-600">
            KES {defaulters.reduce((sum, d) => sum + d.balance, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Average Balance</h3>
          <p className="text-2xl font-bold text-blue-600">
            KES{" "}
            {defaulters.length > 0
              ? Math.round(
                  defaulters.reduce((sum, d) => sum + d.balance, 0) /
                    defaulters.length
                ).toLocaleString()
              : 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Admission No</th>
              <th className="border p-3 text-left">Student Name</th>
              <th className="border p-3 text-left">Class</th>
              <th className="border p-3 text-left">Term</th>
              <th className="border p-3 text-right">Total Fees</th>
              <th className="border p-3 text-right">Paid</th>
              <th className="border p-3 text-right">Balance</th>
              <th className="border p-3 text-center">Status</th>
              <th className="border p-3 text-left">Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {defaulters.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border p-4 text-center text-gray-500"
                >
                  No defaulters found with the current filters.
                </td>
              </tr>
            ) : (
              defaulters.map((defaulter) => (
                <tr key={defaulter.id} className="hover:bg-gray-50">
                  <td className="border p-3">{defaulter.admissionNumber}</td>
                  <td className="border p-3 font-medium">
                    {defaulter.studentName}
                  </td>
                  <td className="border p-3">{defaulter.className}</td>
                  <td className="border p-3">{defaulter.termName}</td>
                  <td className="border p-3 text-right">
                    {defaulter.totalFees.toLocaleString()}
                  </td>
                  <td className="border p-3 text-right">
                    {defaulter.paidAmount.toLocaleString()}
                  </td>
                  <td className="border p-3 text-right font-semibold text-red-600">
                    {defaulter.balance.toLocaleString()}
                  </td>
                  <td className="border p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        defaulter.status
                      )}`}
                    >
                      {defaulter.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    {defaulter.lastPaymentDate
                      ? new Date(defaulter.lastPaymentDate).toLocaleDateString()
                      : "No payments"}
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
