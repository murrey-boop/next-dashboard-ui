"use client";

import { useState } from "react";
import FeeStructures from "@/components/fees/FeeStructures";
import PaymentRecording from "@/components/fees/PaymentRecording";
import DefaultersList from "@/components/fees/DefaultersList";
import FeeReports from "@/components/fees/FeeReports";

type TabType = "structures" | "payments" | "defaulters" | "reports";

export default function AdminFeesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("structures");

  const tabs: { id: TabType; label: string }[] = [
    { id: "structures", label: "Fee Structures" },
    { id: "payments", label: "Record Payment" },
    { id: "defaulters", label: "Defaulters" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Fee Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 font-semibold transition-colors ${
              activeTab === tab.id
                ? "text-lamaPurple border-b-2 border-lamaPurple"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "structures" && <FeeStructures />}
        {activeTab === "payments" && <PaymentRecording />}
        {activeTab === "defaulters" && <DefaultersList />}
        {activeTab === "reports" && <FeeReports />}
      </div>
    </div>
  );
}
