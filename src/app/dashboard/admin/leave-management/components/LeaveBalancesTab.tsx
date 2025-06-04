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
  role: string;
  isFreelancer: boolean;
  leaveBalance: LeaveBalance;
}

interface BalanceData {
  year: number;
  employees: Employee[];
  totalEmployees: number;
}

export default function LeaveBalancesTab() {
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
        await fetchBalanceData();
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
        await fetchBalanceData();
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
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      FREELANCER:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      FLEX_WORKER:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return (
      colors[type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Verlof Saldo&apos;s Beheer
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Beheer verlof saldo&apos;s per medewerker voor {selectedYear}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            variant="outline"
            size="sm"
            onClick={() => setShowBulkModal(true)}
            leftIcon={<UserGroupIcon className="h-4 w-4" />}
          >
            Bulk Import
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={fetchBalanceData}
            leftIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
          >
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
          >
            Sluiten
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {balanceData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Totaal Medewerkers
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {balanceData.totalEmployees}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Gem. Vakantiedagen
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {balanceData.employees.length > 0
                    ? Math.round(
                        balanceData.employees.reduce(
                          (acc, emp) =>
                            acc + emp.leaveBalance.vacationDaysRemaining,
                          0
                        ) / balanceData.employees.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Gem. Compensatie
                </p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {balanceData.employees.length > 0
                    ? formatDuration(
                        balanceData.employees.reduce(
                          (acc, emp) =>
                            acc +
                            (emp.leaveBalance.compensationHours -
                              emp.leaveBalance.compensationUsed),
                          0
                        ) / balanceData.employees.length
                      )
                    : "0u 0m"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Balances Table */}
      {balanceData && balanceData.employees.length > 0 ? (
        <div className="space-y-8">
          {/* Regular Employees Section */}
          {balanceData.employees.filter((emp) => !emp.isFreelancer).length >
            0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Werknemers - Verlof Saldo&apos;s
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Volledige verlofregistratie voor vaste werknemers
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Medewerker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vakantiedagen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ziektedagen (Registratie)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Bijzonder Verlof
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Compensatie
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {balanceData.employees
                      .filter((emp) => !emp.isFreelancer)
                      .map((employee) => (
                        <tr
                          key={employee.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {employee.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {employee.email}
                                </div>
                                <span
                                  className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEmployeeTypeColor(
                                    employee.employeeType
                                  )}`}
                                >
                                  {getEmployeeTypeLabel(employee.employeeType)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">
                                {employee.leaveBalance.vacationDaysRemaining}{" "}
                                resterend
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                {employee.leaveBalance.vacationDaysUsed} van{" "}
                                {employee.leaveBalance.vacationDaysTotal}{" "}
                                gebruikt
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">
                                {employee.leaveBalance.sickDaysUsed} dagen
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                📋 Administratieve registratie
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">
                                {employee.leaveBalance.specialLeaveUsed} dagen
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                📋 Administratieve registratie
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">
                                {formatDuration(
                                  employee.leaveBalance.compensationHours -
                                    employee.leaveBalance.compensationUsed
                                )}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                {formatDuration(
                                  employee.leaveBalance.compensationUsed
                                )}{" "}
                                gebruikt
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                              leftIcon={<PencilIcon className="h-4 w-4" />}
                            >
                              Bewerken
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Freelancers Section */}
          {balanceData.employees.filter((emp) => emp.isFreelancer).length >
            0 && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-orange-200 dark:border-orange-700">
                <h4 className="text-lg font-medium text-orange-900 dark:text-orange-100">
                  Freelancers - Ziekte Registraties
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Alleen ziektedagen voor administratieve doeleinden (geen
                  aftrek van balans)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-orange-200 dark:divide-orange-700">
                  <thead className="bg-orange-100 dark:bg-orange-900/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                        Freelancer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                        Geregistreerde Ziektedagen
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-orange-50 dark:bg-orange-900/5 divide-y divide-orange-200 dark:divide-orange-700">
                    {balanceData.employees
                      .filter((emp) => emp.isFreelancer)
                      .map((employee) => (
                        <tr
                          key={employee.id}
                          className="hover:bg-orange-100 dark:hover:bg-orange-900/20"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                  {employee.name}
                                </div>
                                <div className="text-sm text-orange-700 dark:text-orange-300">
                                  {employee.email}
                                </div>
                                <span className="mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                  Freelancer
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-orange-900 dark:text-orange-100">
                              <div className="font-medium text-lg">
                                {employee.leaveBalance.sickDaysUsed} dagen
                              </div>
                              <div className="text-orange-700 dark:text-orange-300 text-xs">
                                📋 Administratieve registratie
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                              leftIcon={<PencilIcon className="h-4 w-4" />}
                              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                            >
                              Bewerken
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Geen verlof saldo&apos;s gevonden
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Er zijn nog geen verlof saldo&apos;s ingesteld voor {selectedYear}.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowBulkModal(true)}
            leftIcon={<UserGroupIcon className="h-4 w-4" />}
          >
            Bulk Import Starten
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEmployee(null);
        }}
        title={`${
          editingEmployee?.isFreelancer
            ? "Ziekte Registratie Bewerken"
            : "Verlof Saldo Bewerken"
        } - ${editingEmployee?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Show different fields based on employee type */}
          {editingEmployee?.isFreelancer ? (
            /* Freelancer form - only sick days */
            <div className="space-y-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                      Freelancer Ziekte Registratie
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Voor freelancers worden alleen ziektedagen geregistreerd
                      voor administratieve doeleinden. Er worden geen dagen
                      afgetrokken van een balans.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Geregistreerde Ziektedagen"
                type="number"
                value={editForm.sickDaysUsed}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    sickDaysUsed: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
          ) : (
            /* Regular employee form - full leave management */
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Totaal Vakantiedagen"
                  type="number"
                  value={editForm.vacationDaysTotal}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      vacationDaysTotal: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <Input
                  label="Gebruikte Vakantiedagen"
                  type="number"
                  value={editForm.vacationDaysUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      vacationDaysUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ziektedagen (Administratieve Registratie)"
                  type="number"
                  value={editForm.sickDaysUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      sickDaysUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <Input
                  label="Bijzonder Verlof"
                  type="number"
                  value={editForm.specialLeaveUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      specialLeaveUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Compensatie Uren"
                  type="number"
                  step="0.25"
                  value={editForm.compensationHours}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      compensationHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <Input
                  label="Gebruikte Compensatie"
                  type="number"
                  step="0.25"
                  value={editForm.compensationUsed}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      compensationUsed: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Ziektedagen Toelichting
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Ziektedagen zijn administratieve registraties. Er wordt
                      geen budget afgetrokken - dit is puur voor
                      verzuimregistratie en rapportage doeleinden.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notities
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  notes: e.target.value,
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Eventuele opmerkingen..."
            />
          </div>

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
        onClose={() => setShowBulkModal(false)}
        title={`Bulk Import Verlof Saldo's - ${selectedYear}`}
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Bulk Import
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Stel standaard verlof saldo&apos;s in voor alle medewerkers
                  die nog geen saldo hebben voor {selectedYear}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Standaard Vakantiedagen"
              type="number"
              value={bulkForm.vacationDaysTotal}
              onChange={(e) =>
                setBulkForm({
                  ...bulkForm,
                  vacationDaysTotal: parseInt(e.target.value) || 0,
                })
              }
              min="0"
              placeholder="25"
            />
            <Input
              label="Standaard Compensatie Uren"
              type="number"
              step="0.25"
              value={bulkForm.compensationHours}
              onChange={(e) =>
                setBulkForm({
                  ...bulkForm,
                  compensationHours: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              placeholder="0"
            />
          </div>

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
              {saving ? "Importeren..." : "Bulk Import Starten"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
