"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PermissionGuard from "@/components/ui/PermissionGuard";
import LeaveBalancesTab from "./components/LeaveBalancesTab";
import LeaveRequestsTab from "./components/LeaveRequestsTab";

export default function LeaveManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("requests");

  const tabs = [
    {
      id: "requests",
      name: "Verlofaanvragen",
      icon: DocumentTextIcon,
      description: "Verlofaanvragen goedkeuren en beheren",
    },
    {
      id: "balances",
      name: "Verlof Saldo's",
      icon: AdjustmentsHorizontalIcon,
      description: "Beheer verlof saldo's per medewerker",
    },
    {
      id: "reports",
      name: "Rapportages",
      icon: ChartBarIcon,
      description: "Verlofrapportages bekijken",
    },
  ];

  return (
    <PermissionGuard requiredRole={["ADMIN", "MANAGER"]}>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin", href: "/dashboard/admin" },
            { label: "Verlof Beheer" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Verlof Beheer
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Centraal beheer voor verlof saldo's en aanvragen
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <UserGroupIcon className="h-4 w-4" />
              <span>Admin Beheer</span>
            </div>
          </div>
        </div>

        {/* Info Card for Vacation Accrual */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 Vakantie-Opbouw Beheer
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Vakantie-opbouw wordt nu beheerd per individuele medewerker in
                hun personeelsdossier. Ga naar{" "}
                <strong>
                  Personeel → [Medewerker] → Verlof & Aanwezigheid
                </strong>{" "}
                om vakantie-opbouw te bekijken en te berekenen.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:z-10 transition-all duration-200 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <Icon
                        className={`h-5 w-5 mb-2 ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-blue-600 dark:text-blue-400" : ""
                        }`}
                      >
                        {tab.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                        {tab.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {activeTab === "requests" && <LeaveRequestsTab />}
            {activeTab === "balances" && <LeaveBalancesTab />}
            {activeTab === "reports" && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Rapportages</h3>
                <p>Verlofrapportages komen binnenkort beschikbaar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
