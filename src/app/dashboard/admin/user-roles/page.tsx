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
      } else {
        const error = await response.json();
        alert(`Fout bij wijzigen rol: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Er is een fout opgetreden bij het wijzigen van de rol");
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
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin", href: "/dashboard/admin" },
            { label: "Gebruikersrollen" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
              Gebruikersrollen Beheer
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Beheer gebruikersrollen en permissies voor het systeem
            </p>
          </div>
        </div>

        {/* Role Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRoles.map((role) => {
            const roleInfo = getRoleDisplayInfo(role);
            const userCount = users.filter((u) => u.role === role).length;

            return (
              <Card key={role} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{roleInfo.emoji}</span>
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
                    <span className="text-2xl font-bold text-blue-600">
                      {userCount}
                    </span>
                    <p className="text-xs text-gray-500">gebruikers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {roleInfo.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Alle Gebruikers
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
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
                    const roleInfo = getRoleDisplayInfo(user.role as UserRole);

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-8 w-8 text-gray-400 mr-3" />
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
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{roleInfo.emoji}</span>
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {roleInfo.name}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
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
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
            </div>
          )}
        </Card>

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
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Gebruiker Informatie
                </h4>
                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selecteer Nieuwe Rol
                </label>
                <div className="space-y-3">
                  {availableRoles.map((role) => {
                    const roleInfo = getRoleDisplayInfo(role);

                    return (
                      <label
                        key={role}
                        className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          selectedRole === role
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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
                          <span className="text-2xl">{roleInfo.emoji}</span>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {roleInfo.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {roleInfo.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Toegangsniveau: {getRoleLevel(role)}
                            </p>
                          </div>
                        </div>
                        {selectedRole === role && (
                          <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              {selectedRole !== selectedUser.role && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
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
