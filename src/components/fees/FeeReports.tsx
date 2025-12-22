"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ReportData = {
  overview: {
    totalExpectedRevenue: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
    totalStudents: number;
    paidStudents: number;
    partialStudents: number;
    pendingStudents: number;
  };
  byClass: Array<{
    className: string;
    expected: number;
    collected: number;
    pending: number;
    rate: number;
  }>;
  byTerm: Array<{
    termName: string;
    expected: number;
    collected: number;
    pending: number;
    rate: number;
  }>;
  byMonth: Array<{
    month: string;
    amount: number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export default function FeeReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      fetchReportData();
    }
  }, [selectedTerm]);

  const fetchTerms = async () => {
    try {
      const res = await fetch("/api/terms");
      if (res.ok) {
        const termsData = await res.json();
        setTerms(termsData);
        if (termsData.length > 0) {
          setSelectedTerm(termsData[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch terms");
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fees/reports?termId=${selectedTerm}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const reportData = await res.json();
      setData(reportData);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Fee Collection Reports</h2>
        <div>
          <label className="mr-2 text-sm font-medium">Select Term:</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Expected Revenue
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            KES {data.overview.totalExpectedRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Total Collected
          </h3>
          <p className="text-2xl font-bold text-green-600">
            KES {data.overview.totalCollected.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Total Pending
          </h3>
          <p className="text-2xl font-bold text-red-600">
            KES {data.overview.totalPending.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Collection Rate
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {data.overview.collectionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Student Status Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Total Students
          </h3>
          <p className="text-2xl font-bold text-gray-700">
            {data.overview.totalStudents}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Paid</h3>
          <p className="text-2xl font-bold text-green-600">
            {data.overview.paidStudents}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Partial</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {data.overview.partialStudents}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending</h3>
          <p className="text-2xl font-bold text-red-600">
            {data.overview.pendingStudents}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Collection by Class */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Collection by Class</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="collected" fill="#82ca9d" name="Collected" />
              <Bar dataKey="pending" fill="#ff8042" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collection Rate by Class */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            Collection Rate by Class
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="rate" fill="#8884d8" name="Collection Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Collections */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Monthly Collections</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.byMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                strokeWidth={2}
                name="Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.byPaymentMethod}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ method, amount }) =>
                  `${method}: KES ${amount.toLocaleString()}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {data.byPaymentMethod.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* By Class Table */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Class-wise Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-right">Expected</th>
                <th className="p-2 text-right">Collected</th>
                <th className="p-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.byClass.map((row) => (
                <tr key={row.className} className="border-t">
                  <td className="p-2">{row.className}</td>
                  <td className="p-2 text-right">
                    {row.expected.toLocaleString()}
                  </td>
                  <td className="p-2 text-right">
                    {row.collected.toLocaleString()}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {row.rate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Payment Method Table */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Method</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {data.byPaymentMethod.map((row) => (
                <tr key={row.method} className="border-t">
                  <td className="p-2">{row.method.replace('_', ' ')}</td>
                  <td className="p-2 text-right">
                    KES {row.amount.toLocaleString()}
                  </td>
                  <td className="p-2 text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
