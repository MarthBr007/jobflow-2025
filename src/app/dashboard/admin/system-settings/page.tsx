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
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import PermissionGuard from "@/components/ui/PermissionGuard";

const settingsCategories = [
  {
    title: "Email Instellingen",
    description: "Beheer e-mail configuratie en notificaties",
    icon: EnvelopeIcon,
    href: "/dashboard/admin/email-settings",
    color: "bg-blue-500",
  },
  {
    title: "Werklocaties",
    description: "Beheer vaste werklocaties en adressen",
    icon: MapPinIcon,
    href: "/dashboard/admin/work-locations",
    color: "bg-green-500",
  },
  {
    title: "Werkzaamheden Types",
    description: "Configureer types werkzaamheden en categorieën",
    icon: WrenchScrewdriverIcon,
    href: "/dashboard/work-types",
    color: "bg-purple-500",
  },
  {
    title: "Systeem Beveiliging",
    description: "Beheer gebruikersrollen en toegangsrechten",
    icon: ShieldCheckIcon,
    href: "/dashboard/admin/security-settings",
    color: "bg-red-500",
  },
  {
    title: "Tijd & Planning",
    description: "Configureer werk- en rusttijden",
    icon: ClockIcon,
    href: "/dashboard/admin/time-settings",
    color: "bg-orange-500",
  },
  {
    title: "Bedrijfsinstellingen",
    description: "Algemene bedrijfsinformatie en configuratie",
    icon: ServerIcon,
    href: "/dashboard/admin/company-settings",
    color: "bg-indigo-500",
  },
];

export default function SystemSettings() {
  return (
    <PermissionGuard permission="canManageSystemSettings">
      <SystemSettingsContent />
    </PermissionGuard>
  );
}

function SystemSettingsContent() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Systeeminstellingen" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Systeeminstellingen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configureer en beheer alle systeemwijde instellingen
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            Admin Toegang
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {settingsCategories.map((category) => (
          <div
            key={category.title}
            className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 ${category.color} rounded-lg p-3`}
                >
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => router.push(category.href)}
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-gray-50 dark:group-hover:bg-gray-700"
                >
                  Configureren
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick System Info */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Systeem Informatie
          </h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Systeem Versie
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                JobFlow v2025.1.0
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Database Status
              </dt>
              <dd className="mt-1 text-sm text-green-600 dark:text-green-400">
                ✓ Verbonden
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Laatste Update
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date().toLocaleDateString("nl-NL")}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Snelle Acties
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={() => router.push("/dashboard/personnel")}
              variant="outline"
              leftIcon={<ShieldCheckIcon className="h-5 w-5" />}
              className="justify-start"
            >
              Gebruikers Beheren
            </Button>
            <Button
              onClick={() => router.push("/dashboard/admin/email-settings")}
              variant="outline"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              className="justify-start"
            >
              Email Testen
            </Button>
            <Button
              onClick={() => router.push("/dashboard/projects")}
              variant="outline"
              leftIcon={<Cog6ToothIcon className="h-5 w-5" />}
              className="justify-start"
            >
              Systeem Logs
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              leftIcon={<ClockIcon className="h-5 w-5" />}
              className="justify-start"
            >
              Cache Legen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
