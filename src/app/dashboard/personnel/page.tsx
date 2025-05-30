"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  PlusIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  HomeIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BriefcaseIcon,
  DocumentArrowUpIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Input from "@/components/ui/Input";
import ExcelImport from "@/components/ui/ExcelImport";
import AdvancedFilters, {
  FilterCriteria,
} from "@/components/ui/AdvancedFilters";
import ContractViewer from "@/components/ui/ContractViewer";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType?: string;
  status: "active" | "inactive";
  company: string;
  phone?: string;
  address?: string;
  hourlyRate?: string;
  monthlySalary?: string;
  hourlyWage?: string;
  workTypes?: string[];
  kvkNumber?: string;
  btwNumber?: string;
  hasContract?: boolean;
  firstName?: string;
  lastName?: string;
  iban?: string;
  availableDays?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  archived: boolean;
}

interface WorkType {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  isActive: boolean;
}

const defaultFilters: FilterCriteria = {
  search: "",
  role: "",
  employeeType: "",
  company: "",
  workTypes: [],
  salaryRange: {
    min: null,
    max: null,
    type: "all",
  },
  dateRanges: {
    hiredDate: { startDate: null, endDate: null },
    lastActivity: { startDate: null, endDate: null },
  },
  quickFilters: [],
  status: "",
};

export default function Personnel() {
  const { data: session } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );
  const [employeeToArchive, setEmployeeToArchive] = useState<Employee | null>(
    null
  );
  const [employeeForContract, setEmployeeForContract] =
    useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [newPassword, setNewPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    id: "",
    name: "",
    email: "",
    role: "FREELANCER",
    employeeType: "FREELANCER",
    status: "active",
    company: "",
    phone: "",
    address: "",
    hourlyRate: "",
    monthlySalary: "",
    hourlyWage: "",
    workTypes: [],
    kvkNumber: "",
    btwNumber: "",
    firstName: "",
    lastName: "",
    iban: "",
    availableDays: "",
    archived: false,
  });
  const [filters, setFilters] = useState<FilterCriteria>(defaultFilters);
  const [availableWorkTypes, setAvailableWorkTypes] = useState<
    Array<{ id: string; name: string; emoji?: string }>
  >([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchEmployees();
    fetchWorkTypes();
  }, [filters, includeArchived]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      // Build query parameters from filters
      const params = new URLSearchParams();

      if (filters.search) params.set("search", filters.search);
      if (filters.role) params.set("role", filters.role);
      if (filters.employeeType)
        params.set("employeeType", filters.employeeType);
      if (filters.company) params.set("company", filters.company);
      if (filters.status) params.set("status", filters.status);
      if (filters.workTypes.length > 0)
        params.set("workTypes", filters.workTypes.join(","));
      if (filters.quickFilters.length > 0)
        params.set("quickFilters", filters.quickFilters.join(","));

      // Include archived employees if requested
      if (includeArchived) params.set("includeArchived", "true");

      // Salary range parameters
      if (filters.salaryRange.type !== "all")
        params.set("salaryType", filters.salaryRange.type);
      if (filters.salaryRange.min !== null)
        params.set("salaryMin", String(filters.salaryRange.min));
      if (filters.salaryRange.max !== null)
        params.set("salaryMax", String(filters.salaryRange.max));

      // Date range parameters
      if (filters.dateRanges.hiredDate.startDate) {
        params.set(
          "hiredStartDate",
          filters.dateRanges.hiredDate.startDate.toISOString()
        );
      }
      if (filters.dateRanges.hiredDate.endDate) {
        params.set(
          "hiredEndDate",
          filters.dateRanges.hiredDate.endDate.toISOString()
        );
      }
      if (filters.dateRanges.lastActivity.startDate) {
        params.set(
          "lastActivityStartDate",
          filters.dateRanges.lastActivity.startDate.toISOString()
        );
      }
      if (filters.dateRanges.lastActivity.endDate) {
        params.set(
          "lastActivityEndDate",
          filters.dateRanges.lastActivity.endDate.toISOString()
        );
      }

      const response = await fetch(`/api/personnel?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch personnel");
      }

      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);

      // Extract unique companies for filter dropdown
      const companies = Array.from(
        new Set(data.map((emp: Employee) => emp.company).filter(Boolean))
      ) as string[];
      setAvailableCompanies(companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch("/api/work-types");
      if (response.ok) {
        const workTypes = await response.json();
        setWorkTypes(workTypes);
        setAvailableWorkTypes(workTypes);
      }
    } catch (error) {
      console.error("Error fetching work types:", error);
    }
  };

  const handleSort = (key: string) => {
    // Implementation of handleSort function
  };

  const handleSelectRow = (id: string) => {
    // Implementation of handleSelectRow function
  };

  const handleSelectAll = (selected: boolean) => {
    // Implementation of handleSelectAll function
  };

  const handleBulkDelete = async () => {
    // Implementation of handleBulkDelete function
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation of handleAddEmployee function
  };

  const handleDeleteEmployee = async (employeeId: string): Promise<void> => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee) {
      setEmployeeToArchive(employee);
      setShowArchiveModal(true);
    }
  };

  const handleArchiveEmployee = async (): Promise<void> => {
    if (!employeeToArchive) return;

    try {
      const response = await fetch(`/api/personnel/${employeeToArchive.id}`, {
        method: "DELETE", // This now archives instead of deletes
      });

      if (response.ok) {
        setShowArchiveModal(false);
        setEmployeeToArchive(null);
        await fetchEmployees();
      } else {
        const data = await response.json();
        setError(`Fout bij archiveren: ${data.error}`);
      }
    } catch (error) {
      console.error("Error archiving employee:", error);
      setError("Er is een fout opgetreden bij het archiveren");
    }
  };

  const handleUnarchiveEmployee = async (employee: Employee): Promise<void> => {
    try {
      const response = await fetch(`/api/personnel/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...employee,
          archived: false,
        }),
      });

      if (response.ok) {
        await fetchEmployees();
      } else {
        const data = await response.json();
        setError(`Fout bij dearchiveren: ${data.error}`);
      }
    } catch (error) {
      console.error("Error unarchiving employee:", error);
      setError("Er is een fout opgetreden bij het dearchiveren");
    }
  };

  const confirmDeleteEmployee = async () => {
    await handleArchiveEmployee();
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation of handlePasswordReset function
  };

  const handlePermissionsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation of handlePermissionsUpdate function
  };

  const handleImport = async (importedEmployees: any[]): Promise<void> => {
    // Implementation of handleImport function
  };

  const getRoleColor = (role: string): string => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "employee":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "freelancer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRoleText = (role: string): string => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "employee":
        return "Medewerker";
      case "freelancer":
        return "Freelancer";
      default:
        return role || "Onbekend";
    }
  };

  const getEmployeeTypeColor = (employeeType: string): string => {
    switch (employeeType?.toLowerCase()) {
      case "permanent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "freelancer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "flex_worker":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getEmployeeTypeText = (employeeType: string): string => {
    switch (employeeType?.toLowerCase()) {
      case "permanent":
        return "Vast";
      case "freelancer":
        return "Freelancer";
      case "flex_worker":
        return "Oproep";
      default:
        return employeeType || "Onbekend";
    }
  };

  const tableColumns = [
    // Implementation of tableColumns function
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            👥 Personeel Beheer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Beheer medewerkers, freelancers en hun gegevens
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {selectedEmployees.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              size="md"
              leftIcon={<TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              className="w-full sm:w-auto touch-manipulation"
            >
              <span className="sm:hidden">
                {selectedEmployees.length} verwijderen
              </span>
              <span className="hidden sm:inline">
                {selectedEmployees.length} verwijderen
              </span>
            </Button>
          )}
          <Button
            onClick={() => setShowImportModal(true)}
            leftIcon={<DocumentArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
            variant="outline"
            size="md"
            className="w-full sm:w-auto touch-manipulation"
          >
            <span className="sm:hidden">Import</span>
            <span className="hidden sm:inline">Excel Import</span>
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
            variant="primary"
            size="md"
            className="w-full sm:w-auto touch-manipulation"
          >
            <span className="sm:hidden">Toevoegen</span>
            <span className="hidden sm:inline">Nieuwe Medewerker</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableWorkTypes={availableWorkTypes}
        availableCompanies={availableCompanies}
        className="mb-6"
      />

      {/* Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">
                {filteredEmployees.length}
              </strong>{" "}
              medewerkers gevonden
            </span>
            {filters.search && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Zoekt naar: "{filters.search}"
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex space-x-6 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <strong className="text-gray-900 dark:text-white">
                {
                  filteredEmployees.filter(
                    (emp) => emp.employeeType === "PERMANENT" && !emp.archived
                  ).length
                }
              </strong>{" "}
              Vast
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">
                {
                  filteredEmployees.filter(
                    (emp) => emp.employeeType === "FREELANCER" && !emp.archived
                  ).length
                }
              </strong>{" "}
              Freelancers
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">
                {
                  filteredEmployees.filter(
                    (emp) => emp.employeeType === "FLEX_WORKER" && !emp.archived
                  ).length
                }
              </strong>{" "}
              Oproep
            </span>
            {includeArchived && (
              <span>
                <strong className="text-gray-900 dark:text-white">
                  {filteredEmployees.filter((emp) => emp.archived).length}
                </strong>{" "}
                Gearchiveerd
              </span>
            )}
          </div>
        </div>

        {/* Archive Toggle */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span>Toon gearchiveerd</span>
          </label>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Laden van personeel...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Fout bij laden van personeel
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personnel List */}
      {!loading && !error && filteredEmployees.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Geen medewerkers gevonden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Pas je filters aan of voeg een nieuwe medewerker toe.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Eerste Medewerker Toevoegen
          </Button>
        </div>
      )}

      {!loading && !error && filteredEmployees.length > 0 && (
        <div className="space-y-8">
          {/* Active Employees Section */}
          {filteredEmployees.filter((emp) => !emp.archived).length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
                    Actieve Medewerkers (
                    {filteredEmployees.filter((emp) => !emp.archived).length})
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Medewerker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Bedrijf
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmployees
                      .filter((emp) => !emp.archived)
                      .map((employee) => (
                        <tr
                          key={employee.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {employee.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {employee.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${getEmployeeTypeColor(
                                employee.employeeType || ""
                              )}`}
                            >
                              {getEmployeeTypeText(employee.employeeType || "")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {employee.company || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/personnel/edit/${employee.id}`
                                  )
                                }
                                leftIcon={<PencilIcon className="h-4 w-4" />}
                              >
                                Bewerken
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteEmployee(employee.id)
                                }
                                leftIcon={<TrashIcon className="h-4 w-4" />}
                                className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                              >
                                Uit Dienst
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Archived Employees Section */}
          {filteredEmployees.filter((emp) => emp.archived).length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <TrashIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Oud Medewerkers (
                    {filteredEmployees.filter((emp) => emp.archived).length})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Medewerkers die uit dienst zijn
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Medewerker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Bedrijf
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmployees
                      .filter((emp) => emp.archived)
                      .map((employee) => (
                        <tr
                          key={employee.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 opacity-75"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
                                  {employee.name}
                                  <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                                    Gearchiveerd
                                  </span>
                                </div>
                                <div className="text-sm text-gray-400 dark:text-gray-500">
                                  {employee.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium opacity-60 ${getEmployeeTypeColor(
                                employee.employeeType || ""
                              )}`}
                            >
                              {getEmployeeTypeText(employee.employeeType || "")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {employee.company || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUnarchiveEmployee(employee)
                                }
                                leftIcon={
                                  <CheckCircleIcon className="h-4 w-4" />
                                }
                                className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                              >
                                Terugzetten
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="👤 Medewerker Toevoegen"
        description="Voeg een nieuwe medewerker toe aan het systeem"
        size="xl"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleAddEmployee} className="space-y-6 sm:space-y-8">
            {/* Personal Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Persoonlijke Gegevens
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <Input
                  label="Volledige Naam"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  leftIcon={<UserGroupIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="Voor- en achternaam"
                  required
                  className="w-full"
                />

                <Input
                  label="E-mailadres"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                  leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="naam@bedrijf.nl"
                  required
                  className="w-full"
                />

                <Input
                  label="Telefoonnummer"
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      phone: e.target.value,
                    })
                  }
                  leftIcon={<PhoneIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="+31 6 12345678"
                  className="w-full"
                />

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📍 Woonadres
                  </label>
                  <div className="space-y-4">
                    <Input
                      label="Straat en huisnummer"
                      value={newEmployee.street}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          street: e.target.value,
                        })
                      }
                      leftIcon={<HomeIcon className="h-5 w-5" />}
                      variant="outlined"
                      inputSize="md"
                      placeholder="Hoofdstraat 123"
                      className="w-full"
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label="Postcode"
                        value={newEmployee.postalCode}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            postalCode: e.target.value,
                          })
                        }
                        variant="outlined"
                        inputSize="md"
                        placeholder="1234AB"
                        className="w-full"
                      />
                      <Input
                        label="Plaats"
                        value={newEmployee.city}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            city: e.target.value,
                          })
                        }
                        variant="outlined"
                        inputSize="md"
                        placeholder="Amsterdam"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CurrencyEuroIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                💰 Financiële Gegevens
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {newEmployee.employeeType === "FREELANCER" ? (
                  <Input
                    label="Uurtarief (€)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newEmployee.hourlyRate}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        hourlyRate: e.target.value,
                      })
                    }
                    leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="25.00"
                    helperText="Uurtarief in euro's voor freelance werk"
                    className="w-full"
                  />
                ) : newEmployee.employeeType === "FLEX_WORKER" ? (
                  <Input
                    label="Bruto Uurloon (€)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newEmployee.hourlyWage}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        hourlyWage: e.target.value,
                      })
                    }
                    leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="15.50"
                    helperText="Bruto uurloon in euro's voor oproepkrachten"
                    className="w-full"
                  />
                ) : (
                  <Input
                    label="Bruto Maandloon (€)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newEmployee.monthlySalary}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        monthlySalary: e.target.value,
                      })
                    }
                    leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="3500.00"
                    helperText="Bruto maandloon in euro's voor vaste medewerkers"
                    className="w-full"
                  />
                )}

                <Input
                  label="IBAN Bankrekeningnummer"
                  value={newEmployee.iban}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, iban: e.target.value })
                  }
                  leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="NL91ABNA0417164300"
                  helperText="Voor uitbetalingen"
                  className="w-full"
                />
              </div>

              {/* Show cost calculation */}
              {newEmployee.employeeType === "FREELANCER" &&
                newEmployee.hourlyRate && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      💡 Kostenberekening per dag (8 uur)
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      €{(parseFloat(newEmployee.hourlyRate) * 8).toFixed(2)} per
                      dag
                    </p>
                  </div>
                )}

              {newEmployee.employeeType === "FLEX_WORKER" &&
                newEmployee.hourlyWage && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                    <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                      💡 Kostenberekening per dag (8 uur)
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      €{(parseFloat(newEmployee.hourlyWage) * 8).toFixed(2)} per
                      dag (bruto loon)
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      Werkgeverslasten (ca. 25-30%) komen hier nog bovenop
                    </p>
                  </div>
                )}

              {newEmployee.employeeType === "PERMANENT" &&
                newEmployee.monthlySalary && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                      💡 Kostenberekening per dag (o.b.v. 22 werkdagen)
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      €{(parseFloat(newEmployee.monthlySalary) / 22).toFixed(2)}{" "}
                      per dag (alleen loon, excl. werkgeverslasten)
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Werkgeverslasten (ca. 25-30%) komen hier nog bovenop
                    </p>
                  </div>
                )}
            </div>

            {/* Work Information Section */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                🗓️ Werk Informatie
              </h3>

              {/* Available Days */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Beschikbare dagen
                </label>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    {[
                      { short: "Ma", full: "Maandag" },
                      { short: "Di", full: "Dinsdag" },
                      { short: "Wo", full: "Woensdag" },
                      { short: "Do", full: "Donderdag" },
                      { short: "Vr", full: "Vrijdag" },
                      { short: "Za", full: "Zaterdag" },
                      { short: "Zo", full: "Zondag" },
                    ].map((day) => {
                      const availableDays =
                        newEmployee.availableDays
                          ?.split(",")
                          .map((d) => d.trim())
                          .filter((d) => d) || [];
                      const isChecked = availableDays.includes(day.short);

                      return (
                        <label
                          key={day.short}
                          className={`relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                            isChecked
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm"
                              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentDays =
                                newEmployee.availableDays
                                  ?.split(",")
                                  .map((d) => d.trim())
                                  .filter((d) => d) || [];
                              const updatedDays = e.target.checked
                                ? [...currentDays, day.short]
                                : currentDays.filter((d) => d !== day.short);
                              setNewEmployee({
                                ...newEmployee,
                                availableDays: updatedDays.join(", "),
                              });
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded mb-2 dark:bg-gray-700"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {day.short}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                            {day.full}
                          </span>
                          {isChecked && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Work Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Werkzaamheden
                </label>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {workTypes.map((workType) => {
                      const isChecked = newEmployee.workTypes?.includes(
                        workType.name
                      );

                      return (
                        <label
                          key={workType.name}
                          className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                            isChecked
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm"
                              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updatedWorkTypes = e.target.checked
                                ? [
                                    ...(newEmployee.workTypes || []),
                                    workType.name,
                                  ]
                                : (newEmployee.workTypes || []).filter(
                                    (type) => type !== workType.name
                                  );
                              setNewEmployee({
                                ...newEmployee,
                                workTypes: updatedWorkTypes,
                              });
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded mt-1 dark:bg-gray-700"
                          />
                          <div className="ml-3 flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {workType.emoji} {workType.name}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {workType.description}
                            </span>
                          </div>
                          {isChecked && (
                            <div className="absolute top-3 right-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information Section - Role and Company */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                👔 Rol & Bedrijf
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Rol
                  </label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setNewEmployee({
                        ...newEmployee,
                        role: newRole,
                        // Reset KvK and BTW when not freelancer
                        kvkNumber:
                          newRole === "FREELANCER" ? newEmployee.kvkNumber : "",
                        btwNumber:
                          newRole === "FREELANCER" ? newEmployee.btwNumber : "",
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Selecteer rol</option>
                    <option value="ADMIN">👑 Administrator</option>
                    <option value="MANAGER">👔 Manager</option>
                    <option value="EMPLOYEE">👷 Medewerker</option>
                    <option value="FREELANCER">💼 Freelancer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Bedrijf
                  </label>
                  <select
                    value={newEmployee.company}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        company: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Selecteer bedrijf</option>
                    <option value="Broers Verhuur">🚛 Broers Verhuur</option>
                    <option value="DCRT Event Decorations">
                      🎉 DCRT Event Decorations
                    </option>
                    <option value="DCRT in Building">
                      🏢 DCRT in Building
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Type Medewerker
                  </label>
                  <select
                    value={newEmployee.employeeType}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        employeeType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Selecteer type</option>
                    <option value="PERMANENT">🏢 Vast personeel</option>
                    <option value="FREELANCER">💼 Freelancer</option>
                    <option value="FLEX_WORKER">📞 Oproepkracht</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Bepaalt het type arbeidsrelatie
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        readOnly
                      />
                      <span className="ml-2 text-sm font-medium text-green-700">
                        ✅ Actief
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nieuwe medewerkers worden standaard als actief aangemaakt
                  </p>
                </div>
              </div>
            </div>

            {/* Freelancer Information Section - Only for freelancers */}
            {newEmployee.role === "FREELANCER" && (
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  💼 Freelancer Gegevens
                </h3>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                  <Input
                    label="KvK Nummer"
                    value={newEmployee.kvkNumber || ""}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        kvkNumber: e.target.value,
                      })
                    }
                    leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="12345678"
                    helperText="Verplicht voor freelancers"
                    className="w-full"
                    required
                  />

                  <Input
                    label="BTW Nummer"
                    value={newEmployee.btwNumber || ""}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        btwNumber: e.target.value,
                      })
                    }
                    leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="NL123456789B01"
                    helperText="Optioneel voor freelancers"
                    className="w-full"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 Contracten kunnen na aanmaken van de medewerker
                        worden gegenereerd via het bewerkingsscherm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowAddModal(false)}
                className="px-6"
              >
                ❌ Annuleren
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="px-6"
              >
                ✅ Medewerker Toevoegen
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Wachtwoord Resetten"
        description={`Stel een nieuw wachtwoord in voor ${selectedEmployee?.name}`}
        size="sm"
        type="warning"
      >
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <KeyIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Het nieuwe wachtwoord wordt direct actief en de gebruiker
                  ontvangt een e-mail met de wijziging.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Nieuw Wachtwoord"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<KeyIcon className="h-5 w-5" />}
            variant="outlined"
            inputSize="md"
            required
            placeholder="Voer nieuw wachtwoord in"
            helperText="Minimaal 6 karakters"
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" variant="primary">
              Wachtwoord Resetten
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title="Gebruikersrechten Wijzigen"
        description={`Wijzig de rol en rechten voor ${selectedEmployee?.name}`}
        size="sm"
        type="info"
      >
        <form onSubmit={handlePermissionsUpdate} className="space-y-6">
          {selectedEmployee?.id === session?.user?.id && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Je kunt je eigen rol niet wijzigen om veiligheidsredenen.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nieuwe Rol
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={selectedEmployee?.id === session?.user?.id}
            >
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Medewerker</option>
              <option value="FREELANCER">Freelancer</option>
            </select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Rol Beschrijvingen:
                </h4>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>
                    <strong>Administrator:</strong> Volledige toegang tot alle
                    functies
                  </li>
                  <li>
                    <strong>Manager:</strong> Kan personeel en projecten beheren
                  </li>
                  <li>
                    <strong>Medewerker:</strong> Kan tijd registreren en
                    projecten bekijken
                  </li>
                  <li>
                    <strong>Freelancer:</strong> Beperkte toegang, eigen
                    projecten
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPermissionsModal(false)}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={selectedEmployee?.id === session?.user?.id}
            >
              Rechten Wijzigen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setEmployeeToArchive(null);
        }}
        title="📁 Medewerker Archiveren"
        description={`Weet je zeker dat je ${employeeToArchive?.name} wilt archiveren?`}
        size="sm"
        type="warning"
      >
        <div className="space-y-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <TrashIcon className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                  💡 De medewerker wordt gearchiveerd
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <strong>{employeeToArchive?.name}</strong> wordt gearchiveerd
                  maar niet verwijderd:
                </p>
                <ul className="mt-2 text-sm text-orange-700 dark:text-orange-300 list-disc list-inside space-y-1">
                  <li>Alle gegevens blijven bewaard</li>
                  <li>Historie en tijdregistratie blijven beschikbaar</li>
                  <li>Kan later weer geactiveerd worden</li>
                  <li>Verschijnt niet meer in actieve lijsten</li>
                  <li>Kan niet meer inloggen</li>
                </ul>
              </div>
            </div>
          </div>

          {employeeToArchive && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {employeeToArchive.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {employeeToArchive.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getRoleColor(
                        employeeToArchive.role
                      )}`}
                    >
                      {getRoleText(employeeToArchive.role)}
                    </span>
                    {employeeToArchive.employeeType && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getEmployeeTypeColor(
                          employeeToArchive.employeeType
                        )}`}
                      >
                        {getEmployeeTypeText(employeeToArchive.employeeType)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowArchiveModal(false);
                setEmployeeToArchive(null);
              }}
            >
              ❌ Annuleren
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleArchiveEmployee}
              leftIcon={<TrashIcon className="h-4 w-4" />}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              📁 Archiveren
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contract Management Modal */}
      {employeeForContract && (
        <ContractViewer
          userId={employeeForContract.id}
          userName={employeeForContract.name}
          isOpen={showContractModal}
          onClose={() => {
            setShowContractModal(false);
            setEmployeeForContract(null);
            // Refresh employees to get updated contract status
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
}
