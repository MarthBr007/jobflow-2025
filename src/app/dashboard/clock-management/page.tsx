"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClockIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/clock-status");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
      }
    } catch (error) {
      console.error("Error updating clock status:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ClockIcon className="w-6 h-6 text-blue-500" />
          Klokstatus Beheren
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user.name || user.email}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status: {user.status}
                  </p>
                  {user.lastClockIn && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Laatste inklok:{" "}
                      {new Date(user.lastClockIn).toLocaleString()}
                    </p>
                  )}
                  {user.lastClockOut && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Laatste uitklok:{" "}
                      {new Date(user.lastClockOut).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClockStatus(user.id, true)}
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    title="Inklokken"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleClockStatus(user.id, false)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    title="Uitklokken"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
