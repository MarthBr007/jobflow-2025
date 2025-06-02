"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  ShieldCheckIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Modal from "@/components/ui/Modal";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  UserRole,
  getRoleDisplayInfo,
  getRoleLevel,
  hasHigherOrEqualRole,
  isAdmin,
} from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  status: string;
}

export default function UserRolesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("EMPLOYEE");
  const [showRoleModal, setShowRoleModal] = useState(false);

  const userRole = session?.user?.role as UserRole;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/personnel");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Fout bij ophalen van gebruikers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/users/${selectedUser.id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: selectedRole,
          }),
        }
      );

      if (response.ok) {
        await fetchUsers();
        setShowRoleModal(false);
        setSelectedUser(null);
        showToast(
          `Rol succesvol gewijzigd naar ${
            getRoleDisplayInfo(selectedRole).name
          }`,
          "success"
        );
      } else {
        const error = await response.json();
        showToast(`Fout bij wijzigen rol: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      showToast(
        "Er is een fout opgetreden bij het wijzigen van de rol",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const canModifyUser = (targetUser: User): boolean => {
    if (!isAdmin(userRole)) return false;
    // Admin can modify all users except they can't demote themselves if they're the only admin
    return true;
  };

  const availableRoles: UserRole[] = [
    "ADMIN",
    "MANAGER",
    "HR_MANAGER",
    "PLANNER",
    "EMPLOYEE",
    "FREELANCER",
  ];

  return (
    <PermissionGuard permission="canChangeUserRoles">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />

        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin", href: "/dashboard/admin" },
            { label: "Gebruikersrollen" },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
                Gebruikersrollen Beheer
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Beheer gebruikersrollen en permissies voor het systeem
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => router.back()}>
                Terug
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Role Information Cards */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Rol Overzicht
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRoles.map((role) => {
                const roleInfo = getRoleDisplayInfo(role);
                const userCount = users.filter((u) => u.role === role).length;

                return (
                  <Card key={role} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                            <span className="text-2xl">{roleInfo.emoji}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {roleInfo.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Niveau {getRoleLevel(role)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-blue-600">
                            {userCount}
                          </span>
                          <p className="text-xs text-gray-500">gebruikers</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {roleInfo.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Users Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Alle Gebruikers
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Beheer rollen en permissies van gebruikers
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Gebruikers laden...
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Gebruiker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Huidige Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Bedrijf
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => {
                      const roleInfo = getRoleDisplayInfo(
                        user.role as UserRole
                      );

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full mr-3">
                                <UserGroupIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-lg">
                                <span className="text-lg">
                                  {roleInfo.emoji}
                                </span>
                              </div>
                              <div>
                                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {roleInfo.name}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Niveau {getRoleLevel(user.role as UserRole)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                user.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {user.status === "active" ? "Actief" : "Inactief"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canModifyUser(user) && (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<PencilIcon className="h-4 w-4" />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role as UserRole);
                                  setShowRoleModal(true);
                                }}
                                className="hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300"
                              >
                                Rol Wijzigen
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="p-12 text-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Geen gebruikers gevonden
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Er zijn nog geen gebruikers in het systeem.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Role Change Modal */}
        <Modal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          title="Gebruikersrol Wijzigen"
          description={`Wijzig de rol van ${selectedUser?.name}`}
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-6">
              {/* Current User Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Gebruiker Informatie
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.email}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Huidige rol:{" "}
                      {getRoleDisplayInfo(selectedUser.role as UserRole).name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Selecteer Nieuwe Rol
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableRoles.map((role) => {
                    const roleInfo = getRoleDisplayInfo(role);

                    return (
                      <label
                        key={role}
                        className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedRole === role
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          value={role}
                          checked={selectedRole === role}
                          onChange={(e) =>
                            setSelectedRole(e.target.value as UserRole)
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${
                              selectedRole === role
                                ? "bg-blue-100 dark:bg-blue-800"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            <span className="text-xl">{roleInfo.emoji}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {roleInfo.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {roleInfo.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Toegangsniveau: {getRoleLevel(role)}
                            </p>
                          </div>
                        </div>
                        {selectedRole === role && (
                          <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              {selectedRole !== selectedUser.role && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Rol Wijziging Waarschuwing
                      </h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        Het wijzigen van een gebruikersrol heeft directe invloed
                        op hun toegangsrechten in het systeem. Zorg ervoor dat
                        je de gevolgen begrijpt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={saving}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleRoleChange}
                  loading={saving}
                  disabled={saving || selectedRole === selectedUser.role}
                  leftIcon={<ShieldCheckIcon className="h-4 w-4" />}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? "Opslaan..." : "Rol Wijzigen"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
}
