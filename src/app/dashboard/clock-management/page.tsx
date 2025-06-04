"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import MetricCard from "@/components/ui/MetricCard";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  lastClockIn: string | null;
  lastClockOut: string | null;
}

export default function ClockManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") {
      fetchUsers();

      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/clock-status");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        showToast("Fout bij ophalen van gebruikers", "error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Er is iets misgegaan bij het ophalen van gegevens", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClockStatus = async (userId: string, clockIn: boolean) => {
    try {
      const response = await fetch("/api/admin/clock-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          [clockIn ? "clockIn" : "clockOut"]: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Update de lokale state
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  status: clockIn ? "WORKING" : "AVAILABLE",
                  lastClockIn: clockIn
                    ? new Date().toISOString()
                    : user.lastClockIn,
                  lastClockOut: !clockIn
                    ? new Date().toISOString()
                    : user.lastClockOut,
                }
              : user
          )
        );

        showToast(
          `${users.find((u) => u.id === userId)?.name} succesvol ${
            clockIn ? "ingeklokt" : "uitgeklokt"
          }`,
          "success"
        );
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Er is een fout opgetreden", "error");
      }
    } catch (error) {
      console.error("Error updating clock status:", error);
      showToast(
        "Er is iets misgegaan bij het bijwerken van de klokstatus",
        "error"
      );
    }
  };

  // Calculate statistics
  const totalUsers = users.length;
  const workingUsers = users.filter((u) => u.status === "WORKING").length;
  const availableUsers = users.filter((u) => u.status === "AVAILABLE").length;
  const unavailableUsers = users.filter(
    (u) => u.status === "UNAVAILABLE"
  ).length;
  const recentClockIns = users.filter((u) => {
    if (!u.lastClockIn) return false;
    const clockInTime = new Date(u.lastClockIn);
    const now = new Date();
    const diffHours =
      (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    return diffHours <= 1; // Within last hour
  }).length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "WORKING":
        return {
          label: "Werkt",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-700",
          icon: <PlayIcon className="w-4 h-4" />,
        };
      case "AVAILABLE":
        return {
          label: "Beschikbaar",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-700",
          icon: <CheckCircleIcon className="w-4 h-4" />,
        };
      case "UNAVAILABLE":
        return {
          label: "Niet beschikbaar",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-700",
          icon: <ExclamationTriangleIcon className="w-4 h-4" />,
        };
      default:
        return {
          label: status || "Onbekend",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-700",
          icon: <ExclamationTriangleIcon className="w-4 h-4" />,
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl font-semibold text-gray-700 dark:text-gray-300"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-gray-900 dark:text-white">Niet ingelogd</div>
    );
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return (
      <div className="p-8 text-gray-900 dark:text-white">Geen toegang</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard" },
          { label: "Klokstatus Beheren" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 dark:from-blue-900/20 dark:via-green-900/20 dark:to-purple-900/20 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-green-600 rounded-xl">
                <ClockIcon className="text-white h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Klokstatus Beheren
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Beheer de klokstatus van alle medewerkers in real-time
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{workingUsers} Werkend</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{availableUsers} Beschikbaar</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>{recentClockIns} Recent ingeklokt</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-3 py-2 text-sm font-medium text-green-800 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:text-green-200 dark:border-green-700">
                <ShieldCheckIcon className="inline w-4 h-4 mr-1" />
                Live Monitoring
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Auto-refresh: 30s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Totaal Personeel"
          value={totalUsers}
          icon={<UsersIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle medewerkers"
          trend={{
            value: 0,
            isPositive: true,
            label: "actief",
          }}
        />

        <MetricCard
          title="Aan het werk"
          value={workingUsers}
          icon={<PlayIcon className="w-8 h-8" />}
          color="green"
          subtitle="Momenteel ingeklokt"
          trend={{
            value: Math.round((workingUsers / totalUsers) * 100) || 0,
            isPositive: true,
            label: "% van totaal",
          }}
        />

        <MetricCard
          title="Beschikbaar"
          value={availableUsers}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Klaar om te werken"
          trend={{
            value: Math.round((availableUsers / totalUsers) * 100) || 0,
            isPositive: true,
            label: "% van totaal",
          }}
        />

        <MetricCard
          title="Recent Ingeklokt"
          value={recentClockIns}
          icon={<ChartBarIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Laatste uur"
          trend={{
            value: recentClockIns,
            isPositive: true,
            label: "nieuwe kloks",
          }}
        />
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Geen medewerkers gevonden
          </h3>
          <p className="max-w-md mx-auto text-gray-500 dark:text-gray-400">
            Er zijn momenteel geen medewerkers om te beheren.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const statusConfig = getStatusConfig(user.status);

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="transition-all duration-200 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700 hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1 space-x-4">
                      {/* User Avatar */}
                      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 shadow-sm bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                        <span className="text-lg font-bold text-white">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* User Info */}
                        <div className="flex items-center mb-2 space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.name || user.email}
                          </h3>
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}
                          >
                            {statusConfig.icon}
                            <span>{statusConfig.label}</span>
                          </span>
                        </div>

                        {user.name && (
                          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                        )}

                        {/* Clock Times Grid */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {user.lastClockIn && (
                            <div className="flex items-center space-x-2 text-sm">
                              <PlayIcon className="w-4 h-4 text-green-500 dark:text-green-400" />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  Laatste inklok:
                                </span>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {formatDateTime(user.lastClockIn)}
                                </div>
                              </div>
                            </div>
                          )}

                          {user.lastClockOut && (
                            <div className="flex items-center space-x-2 text-sm">
                              <StopIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  Laatste uitklok:
                                </span>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {formatDateTime(user.lastClockOut)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Working Time Calculation */}
                        {user.status === "WORKING" && user.lastClockIn && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm text-green-800 dark:text-green-200">
                              <ClockIcon className="w-4 h-4" />
                              <span className="font-medium">
                                Werkend sinds:{" "}
                                {Math.floor(
                                  (Date.now() -
                                    new Date(user.lastClockIn).getTime()) /
                                    (1000 * 60)
                                )}{" "}
                                minuten
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleClockStatus(user.id, true)}
                          variant="primary"
                          size="sm"
                          leftIcon={<CheckIcon className="w-4 h-4" />}
                          className="text-white bg-green-600 shadow-sm hover:bg-green-700"
                          disabled={user.status === "WORKING"}
                        >
                          Inklokken
                        </Button>
                        <Button
                          onClick={() => handleClockStatus(user.id, false)}
                          variant="primary"
                          size="sm"
                          leftIcon={<XMarkIcon className="w-4 h-4" />}
                          className="text-white bg-red-600 shadow-sm hover:bg-red-700"
                          disabled={user.status !== "WORKING"}
                        >
                          Uitklokken
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
