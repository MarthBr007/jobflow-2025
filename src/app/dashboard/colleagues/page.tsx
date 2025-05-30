"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  UserGroupIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface Colleague {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  workTypes?: string[];
}

export default function Colleagues() {
  const { data: session } = useSession();
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColleagues = async () => {
      try {
        const response = await fetch("/api/colleagues");
        if (response.ok) {
          const data = await response.json();
          setColleagues(data);
        }
      } catch (error) {
        console.error("Error fetching colleagues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchColleagues();
  }, []);

  const getRoleText = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "employee":
        return "Medewerker";
      case "freelancer":
        return "Freelancer";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-indigo-100 text-indigo-800";
      case "freelancer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Collega's" },
        ]}
        className="mb-1 sm:mb-4"
      />

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          👥 Collega's
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Overzicht van alle collega's
        </p>
      </div>

      {/* Colleagues Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {colleagues.map((colleague) => (
          <motion.div
            key={colleague.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-xl border border-gray-200 dark:border-gray-700 touch-manipulation"
          >
            <div className="p-3.5 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                      {colleague.name}
                    </h3>
                    <span
                      className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                        colleague.role
                      )}`}
                    >
                      {getRoleText(colleague.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                  <span className="truncate">{colleague.email}</span>
                </div>

                <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                  <span className="truncate">{colleague.company}</span>
                </div>

                {colleague.workTypes && colleague.workTypes.length > 0 && (
                  <div className="flex items-start text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <BriefcaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {colleague.workTypes.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
