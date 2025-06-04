"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  GiftIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import MetricCard from "@/components/ui/MetricCard";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useConfirm } from "@/hooks/useConfirm";

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  category:
    | "DAILY"
    | "WEEKLY"
    | "PROJECT"
    | "SPECIAL"
    | "HOLIDAY"
    | "MAINTENANCE";
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  shifts: ScheduleTemplateShift[];
  userAssignments: UserScheduleAssignment[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduleTemplateShift {
  id: string;
  role: string;
  startTime: string;
  endTime: string;
  breaks?: Array<{
    startTime: string;
    endTime: string;
    type: "morning" | "lunch" | "afternoon";
    duration: number;
  }>;
  totalBreakDuration?: number;
  minPersons: number;
  maxPersons?: number;
  requirements: string[];
  notes?: string;
  workLocation?: {
    id: string;
    name: string;
    city: string;
  };
  project?: {
    id: string;
    name: string;
    company: string;
  };
}

interface UserScheduleAssignment {
  id: string;
  userId: string;
  templateId: string;
  dayOfWeek: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  customStartTime?: string;
  customEndTime?: string;
  customBreaks?: Array<{
    startTime: string;
    endTime: string;
    type: "morning" | "lunch" | "afternoon";
    duration: number;
  }>;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
}

const CATEGORY_OPTIONS = [
  {
    value: "DAILY",
    label: "Dagelijks",
    icon: <CalendarDaysIcon className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "WEEKLY",
    label: "Wekelijks",
    icon: <ChartBarIcon className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "PROJECT",
    label: "Project",
    icon: <BriefcaseIcon className="w-4 h-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "SPECIAL",
    label: "Speciaal",
    icon: <SparklesIcon className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "HOLIDAY",
    label: "Feestdag",
    icon: <GiftIcon className="w-4 h-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "MAINTENANCE",
    label: "Onderhoud",
    icon: <WrenchScrewdriverIcon className="w-4 h-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" },
  { value: 0, label: "Zondag" },
];

export default function ScheduleTemplatesDeprecationPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Rooster Templates (Vervangen)" },
        ]}
        className="mb-4"
      />

      {/* Deprecation Notice Card */}
      <div className="overflow-hidden bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border border-orange-200 shadow-lg dark:bg-gradient-to-r dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-xl dark:border-orange-700">
        <div className="px-8 py-10 text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 rounded-full">
            <ExclamationTriangleIcon className="text-white h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🔄 Systeem Vernieuwd!
          </h1>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            Rooster Templates zijn vervangen door het nieuwe{" "}
            <strong>Werkpatronen</strong> systeem. Dit geeft je veel meer
            flexibiliteit en een eenvoudigere workflow.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-blue-600" />
              Waarom Werkpatronen Beter Zijn
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Eenvoudiger Workflow
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Directe toewijzing aan personeel zonder tussenstappen
                </p>
              </div>

              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Flexibele Tijden
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Elke dag kan eigen start- en eindtijden hebben
                </p>
              </div>

              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Automatische Roosters
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Roosters worden automatisch gegenereerd vanuit patronen
                </p>
              </div>

              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Betere Integratie
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Direct zichtbaar op personeelspagina en planning
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard/admin/schedule-patterns")}
              variant="primary"
              size="lg"
              leftIcon={<CalendarDaysIcon className="h-5 w-5" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ga naar Werkpatronen
            </Button>

            <Button
              onClick={() => router.push("/dashboard/personnel")}
              variant="outline"
              size="lg"
              leftIcon={<UserGroupIcon className="h-5 w-5" />}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Personeel Beheren
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              💡 <strong>Tip:</strong> Je bestaande roosters blijven gewoon
              werken. Nieuwe planningen maken we nu via werkpatronen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
