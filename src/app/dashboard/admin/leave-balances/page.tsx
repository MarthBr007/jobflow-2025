"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  HeartIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PermissionGuard from "@/components/ui/PermissionGuard";

interface LeaveBalance {
  id: string | null;
  userId: string;
  year: number;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
  vacationDaysRemaining: number;
  sickDaysUsed: number;
  compensationHours: number;
  compensationUsed: number;
  specialLeaveUsed: number;
  notes: string | null;
  lastUpdatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeType: string;
  leaveBalance: LeaveBalance;
}

interface BalanceData {
  year: number;
  employees: Employee[];
  totalEmployees: number;
}

export default function LeaveBalancesPage() {
  const { data: session } = useSession();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    vacationDaysTotal: 25,
    vacationDaysUsed: 0,
    sickDaysUsed: 0,
    compensationHours: 0,
    compensationUsed: 0,
    specialLeaveUsed: 0,
    notes: "",
  });

  const [bulkForm, setBulkForm] = useState({
    vacationDaysTotal: 25,
    compensationHours: 0,
  });

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/leave-balances?year=${selectedYear}`
      );
      const data = await response.json();

      if (data.success) {
        setBalanceData(data.data);
      } else {
        setError(data.error || "Failed to fetch leave balances");
      }
    } catch (error) {
      console.error("Error fetching leave balances:", error);
      setError("Failed to fetch leave balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceData();
  }, [selectedYear]);

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      vacationDaysTotal: employee.leaveBalance.vacationDaysTotal,
      vacationDaysUsed: employee.leaveBalance.vacationDaysUsed,
      sickDaysUsed: employee.leaveBalance.sickDaysUsed,
      compensationHours: employee.leaveBalance.compensationHours,
      compensationUsed: employee.leaveBalance.compensationUsed,
      specialLeaveUsed: employee.leaveBalance.specialLeaveUsed,
      notes: employee.leaveBalance.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveBalance = async () => {
    if (!editingEmployee) return;

    try {
      setSaving(true);
      const response = await fetch("/api/admin/leave-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingEmployee.id,
          year: selectedYear,
          ...editForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchBalanceData(); // Refresh data
        setShowEditModal(false);
        setEditingEmployee(null);
      } else {
        setError(data.error || "Failed to update leave balance");
      }
    } catch (error) {
      console.error("Error updating leave balance:", error);
      setError("Failed to update leave balance");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/leave-balances/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: selectedYear,
          defaultSettings: bulkForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchBalanceData(); // Refresh data
        setShowBulkModal(false);
        setError(null);
      } else {
        setError(data.error || "Failed to perform bulk import");
      }
    } catch (error) {
      console.error("Error performing bulk import:", error);
      setError("Failed to perform bulk import");
    } finally {
      setSaving(false);
    }
  };

  const calculateVacationRemaining = (total: number, used: number) => {
    return Math.max(0, total - used);
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    const sign = hours < 0 ? "-" : "";
    return `${sign}${h}u ${m}m`;
  };

  const getEmployeeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PERMANENT: "Vast",
      FREELANCER: "Freelancer",
      FLEX_WORKER: "Oproep",
    };
    return labels[type] || type;
  };

  const getEmployeeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PERMANENT:
        "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
      FREELANCER:
        "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200",
      FLEX_WORKER:
        "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200",
    };
    return (
      colors[type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    );
  };

  return (
    <PermissionGuard requiredRole={["ADMIN", "MANAGER"]}>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin", href: "/dashboard" },
            { label: "Verlof Saldo Beheer" },
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <AdjustmentsHorizontalIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Verlof Saldo Beheer
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Beheer verlof saldo's voor alle medewerkers in{" "}
                    {selectedYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
                <Button
                  onClick={() => setShowBulkModal(true)}
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Bulk Instellen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {balanceData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Totaal Medewerkers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {balanceData.totalEmployees}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Gem. Vakantiedagen
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {balanceData.employees.length > 0
                      ? Math.round(
                          balanceData.employees.reduce(
                            (sum, emp) =>
                              sum + emp.leaveBalance.vacationDaysTotal,
                            0
                          ) / balanceData.employees.length
                        )
                      : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Actief Jaar
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedYear}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Balances Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verlof Saldo's per Medewerker
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Klik op de bewerk knop om saldo's aan te passen
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Saldo's laden...
              </p>
            </div>
          ) : balanceData && balanceData.employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Medewerker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vakantiedagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ziektedagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Compensatie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Laatste Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {balanceData.employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getEmployeeTypeColor(
                            employee.employeeType
                          )}`}
                        >
                          {getEmployeeTypeLabel(employee.employeeType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {calculateVacationRemaining(
                            employee.leaveBalance.vacationDaysTotal,
                            employee.leaveBalance.vacationDaysUsed
                          )}{" "}
                          / {employee.leaveBalance.vacationDaysTotal} dagen
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {employee.leaveBalance.vacationDaysUsed} gebruikt
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {employee.leaveBalance.sickDaysUsed} dagen
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDuration(
                            employee.leaveBalance.compensationHours -
                              employee.leaveBalance.compensationUsed
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(
                            employee.leaveBalance.compensationUsed
                          )}{" "}
                          gebruikt
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.leaveBalance.lastUpdatedBy || "Nooit"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Bewerk
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Geen medewerkers gevonden
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Er zijn geen medewerkers gevonden voor het geselecteerde jaar.
              </p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          title={`Verlof Saldo Bewerken - ${editingEmployee?.name}`}
          description={`Bewerk het verlof saldo voor ${editingEmployee?.name} voor het jaar ${selectedYear}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Vacation Days */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-4 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Vakantiedagen
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Totaal toegekend"
                  type="number"
                  value={editForm.vacationDaysTotal}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      vacationDaysTotal: parseInt(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
                <Input
                  label="Gebruikt"
                  type="number"
                  value={editForm.vacationDaysUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      vacationDaysUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
              </div>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                Resterend:{" "}
                {calculateVacationRemaining(
                  editForm.vacationDaysTotal,
                  editForm.vacationDaysUsed
                )}{" "}
                dagen
              </div>
            </div>

            {/* Sick Days */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-4 flex items-center">
                <HeartIcon className="h-5 w-5 mr-2" />
                Ziektedagen
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Gebruikt dit jaar"
                  type="number"
                  value={editForm.sickDaysUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      sickDaysUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
                <Input
                  label="Bijzonder verlof gebruikt"
                  type="number"
                  value={editForm.specialLeaveUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      specialLeaveUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
              </div>
            </div>

            {/* Compensation Time */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Compensatie Tijd (Tijd voor Tijd)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Beschikbare uren"
                  type="number"
                  step="0.25"
                  value={editForm.compensationHours}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      compensationHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
                <Input
                  label="Gebruikte uren"
                  type="number"
                  step="0.25"
                  value={editForm.compensationUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      compensationUsed: parseFloat(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
              </div>
              <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                Saldo:{" "}
                {formatDuration(
                  editForm.compensationHours - editForm.compensationUsed
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Notities
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Eventuele opmerkingen over dit verlof saldo..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmployee(null);
                }}
                disabled={saving}
              >
                Annuleren
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveBalance}
                disabled={saving}
                loading={saving}
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Import Modal */}
        <Modal
          isOpen={showBulkModal}
          onClose={() => {
            setShowBulkModal(false);
          }}
          title={`Bulk Verlof Saldo Instellen voor ${selectedYear}`}
          description={`Stel verlof saldo's in voor alle medewerkers tegelijk voor het jaar ${selectedYear}`}
          size="md"
        >
          <div className="space-y-6">
            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                    Let op!
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Dit overschrijft bestaande verlof saldo's voor alle
                    medewerkers. Vakantiedagen worden automatisch aangepast op
                    basis van contracttype:
                    <br />• Oproepkrachten: 60% van standaard
                    <br />• Freelancers: 0 dagen
                  </p>
                </div>
              </div>
            </div>

            {/* Default Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Standaard Instellingen
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Standaard vakantiedagen (voltijd)"
                  type="number"
                  value={bulkForm.vacationDaysTotal}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      vacationDaysTotal: parseInt(e.target.value) || 25,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                  max="50"
                />
                <Input
                  label="Compensatie uren (startwaarde)"
                  type="number"
                  step="0.25"
                  value={bulkForm.compensationHours}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      compensationHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  variant="outlined"
                  inputSize="md"
                  min="0"
                />
              </div>

              {balanceData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Preview
                  </h5>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>
                      • {balanceData.totalEmployees} medewerkers worden verwerkt
                    </p>
                    <p>
                      • Vaste medewerkers: {bulkForm.vacationDaysTotal}{" "}
                      vakantiedagen
                    </p>
                    <p>
                      • Oproepkrachten:{" "}
                      {Math.round(bulkForm.vacationDaysTotal * 0.6)}{" "}
                      vakantiedagen
                    </p>
                    <p>• Freelancers: 0 vakantiedagen</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowBulkModal(false)}
                disabled={saving}
              >
                Annuleren
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkImport}
                disabled={saving}
                loading={saving}
              >
                {saving ? "Bezig..." : "Instellen voor Alle Medewerkers"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
