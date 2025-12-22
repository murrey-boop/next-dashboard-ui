"use client";

import { useState } from "react";
import CreateUser from "@/components/accounts/CreateUser";
import BulkImport from "@/components/accounts/BulkImport";
import UsersList from "@/components/accounts/UsersList";

type TabType = "create" | "bulk" | "manage";

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("create");

  const tabs: { id: TabType; label: string }[] = [
    { id: "create", label: "Create User" },
    { id: "bulk", label: "Bulk Import" },
    { id: "manage", label: "Manage Users" },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Account Management</h1>

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
        {activeTab === "create" && <CreateUser />}
        {activeTab === "bulk" && <BulkImport />}
        {activeTab === "manage" && <UsersList />}
      </div>
    </div>
  );
}
