"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Cog6ToothIcon,
  ServerIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  EyeIcon,
  KeyIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
import PermissionGuard from "@/components/ui/PermissionGuard";
import { motion } from "framer-motion";

const settingsCategories = [
  {
    title: "Document Templates",
    description: "Beheer briefpapier, logo's en document templates",
    icon: DocumentTextIcon,
    href: "/dashboard/admin/document-templates",
    color: "bg-gradient-to-br from-cyan-500 to-blue-600",
    bgColor:
      "from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20",
    textColor: "text-cyan-700 dark:text-cyan-300",
    status: "active",
    items: 5,
  },
  {
    title: "Email Instellingen",
    description: "Beheer e-mail configuratie en notificaties",
    icon: EnvelopeIcon,
    href: "/dashboard/admin/email-settings",
    color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    bgColor:
      "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    textColor: "text-blue-700 dark:text-blue-300",
    status: "configured",
    items: 8,
  },
  {
    title: "Werklocaties",
    description: "Beheer vaste werklocaties en adressen",
    icon: MapPinIcon,
    href: "/dashboard/admin/work-locations",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
    bgColor:
      "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    textColor: "text-green-700 dark:text-green-300",
    status: "active",
    items: 12,
  },
  {
    title: "Werkzaamheden Types",
    description: "Configureer types werkzaamheden en categorieën",
    icon: WrenchScrewdriverIcon,
    href: "/dashboard/work-types",
    color: "bg-gradient-to-br from-purple-500 to-violet-600",
    bgColor:
      "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
    textColor: "text-purple-700 dark:text-purple-300",
    status: "configured",
    items: 15,
  },
  {
    title: "Systeem Beveiliging",
    description: "Beheer gebruikersrollen en toegangsrechten",
    icon: ShieldCheckIcon,
    href: "/dashboard/admin/security-settings",
    color: "bg-gradient-to-br from-red-500 to-pink-600",
    bgColor: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
    textColor: "text-red-700 dark:text-red-300",
    status: "critical",
    items: 6,
  },
  {
    title: "Tijd & Planning",
    description: "Configureer werk- en rusttijden",
    icon: ClockIcon,
    href: "/dashboard/admin/time-settings",
    color: "bg-gradient-to-br from-orange-500 to-amber-600",
    bgColor:
      "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
    textColor: "text-orange-700 dark:text-orange-300",
    status: "configured",
    items: 10,
  },
  {
    title: "Bedrijfsinstellingen",
    description: "Algemene bedrijfsinformatie en configuratie",
    icon: BuildingOfficeIcon,
    href: "/dashboard/admin/company-settings",
    color: "bg-gradient-to-br from-indigo-500 to-purple-600",
    bgColor:
      "from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20",
    textColor: "text-indigo-700 dark:text-indigo-300",
    status: "configured",
    items: 12,
  },
];

const quickActions = [
  {
    title: "Gebruikers Beheren",
    description: "Nieuwe gebruikers toevoegen of bewerken",
    icon: UserGroupIcon,
    href: "/dashboard/personnel",
    color: "from-blue-500 to-indigo-600",
    count: 44,
  },
  {
    title: "Email Testen",
    description: "Test email configuratie en verzending",
    icon: EnvelopeIcon,
    href: "/dashboard/admin/email-settings",
    color: "from-green-500 to-emerald-600",
    count: 8,
  },
  {
    title: "Beveiligings Audit",
    description: "Bekijk systeem logs en beveiliging",
    icon: EyeIcon,
    href: "/dashboard/admin/security-settings",
    color: "from-purple-500 to-violet-600",
    count: 12,
  },
  {
    title: "Systeem Status",
    description: "Controleer systeem gezondheid",
    icon: ServerIcon,
    href: "/dashboard/admin/system-settings",
    color: "from-orange-500 to-red-600",
    count: 3,
  },
];

function SystemSettingsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [systemStats, setSystemStats] = useState({
    totalUsers: 44,
    activeConfigs: 7,
    lastBackup: new Date().toLocaleDateString("nl-NL"),
    systemHealth: 98,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
      case "configured":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "critical":
        return "Vereist aandacht";
      case "configured":
        return "Geconfigureerd";
      case "active":
        return "Actief";
      default:
        return "Standaard";
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Systeeminstellingen" },
        ]}
        className="mb-6"
      />

      {/* Modern Header with Gradient */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 px-6 py-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Cog6ToothIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Systeeminstellingen
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configureer en beheer alle systeemwijde instellingen voor
                  optimale prestaties
                </p>
              </div>
            </div>

            {/* Admin Access Badge */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-xl border border-green-200 dark:border-green-700 shadow-sm">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span className="text-sm font-bold">Admin Toegang</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-2 font-medium">
                <div className="h-2.5 w-2.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-sm"></div>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {systemStats.systemHealth}%
                  </strong>{" "}
                  systeem gezondheid
                </span>
              </span>
              <span className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
                <ServerIcon className="h-4 w-4" />
                <span>
                  <strong>{systemStats.activeConfigs}</strong> configuraties
                  actief
                </span>
              </span>
            </div>
            <div className="hidden lg:flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">
                Laatste backup: {systemStats.lastBackup}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Totaal Gebruikers"
          value={systemStats.totalUsers}
          icon={<UserGroupIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Actieve accounts"
          trend={{
            value: 8,
            isPositive: true,
            label: "deze maand",
          }}
        />

        <MetricCard
          title="Configuraties"
          value={systemStats.activeConfigs}
          icon={<Cog6ToothIcon className="w-8 h-8" />}
          color="green"
          subtitle="Instellingen modules"
          trend={{
            value: 100,
            isPositive: true,
            label: "volledig geconfigureerd",
          }}
        />

        <MetricCard
          title="Systeem Gezondheid"
          value={`${systemStats.systemHealth}%`}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Algehele status"
          status={systemStats.systemHealth > 95 ? "success" : "normal"}
          trend={{
            value: 2,
            isPositive: true,
            label: "vs vorige week",
          }}
        />

        <MetricCard
          title="Beveiliging Status"
          value="Goed"
          icon={<ShieldCheckIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Geen waarschuwingen"
          status="success"
          trend={{
            value: 0,
            isPositive: true,
            label: "actieve bedreigingen",
          }}
        />
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-indigo-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Snelle Acties
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Veelgebruikte beheersfuncties voor snelle toegang
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-purple-50/20 dark:bg-purple-900/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500 hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`h-12 w-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {action.title}
                    </h4>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {action.count}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {action.description}
                </p>
                <Button
                  onClick={() => router.push(action.href)}
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:border-purple-300 dark:group-hover:border-purple-600 transition-all duration-200"
                >
                  Openen
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Categories Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Cog6ToothIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Instellingen Modules
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configureer alle aspecten van het JobFlow systeem
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50/20 dark:bg-blue-900/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {settingsCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1"
              >
                {/* Header Section */}
                <div
                  className={`bg-gradient-to-r ${category.bgColor} p-6 border-b border-gray-200 dark:border-gray-700`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`h-12 w-12 ${category.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {category.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(
                            category.status
                          )}`}
                        >
                          {getStatusText(category.status)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {category.items} items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {category.description}
                  </p>

                  <Button
                    onClick={() => router.push(category.href)}
                    variant="outline"
                    size="md"
                    rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                    className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-all duration-200 font-semibold"
                  >
                    Configureren
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* System Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-700/50 dark:via-slate-700/50 dark:to-zinc-700/50 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
                <ServerIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Systeem Informatie
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Technische details en status van het systeem
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/20 dark:bg-gray-700/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700">
                  <ServerIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Systeem Versie
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                JobFlow v2025.1.0
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Database Status
                </span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                ✓ Verbonden
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
                  <ClockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Laatste Update
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString("nl-NL")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  return (
    <PermissionGuard permission="canManageSystemSettings">
      <SystemSettingsContent />
    </PermissionGuard>
  );
}
