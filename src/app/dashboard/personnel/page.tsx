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
  ArchiveBoxIcon,
  ClipboardDocumentIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Input from "@/components/ui/Input";
import ExcelImport from "@/components/ui/ExcelImport";
import AdvancedFilters, {
  FilterCriteria,
} from "@/components/ui/AdvancedFilters";
import PermissionGuard from "@/components/ui/PermissionGuard";
import { ExportUtils } from "@/utils/exportUtils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import MetricCard from "@/components/ui/MetricCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

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
  hireDate?: string;
  phoneNumber?: string;
  isActive?: boolean;
  workPatternAssignments?: any[];
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
  return (
    <PermissionGuard permission="canViewAllUsers">
      <PersonnelContent />
    </PermissionGuard>
  );
}

function PersonnelContent() {
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
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleDeleteEmployee = (id: string) => {
    const employee = employees.find((emp) => emp.id === id);
    if (employee) {
      setEmployeeToArchive(employee);
      setShowArchiveModal(true);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  const archiveEmployee = (id: string) => {
    const employee = employees.find((emp) => emp.id === id);
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
    console.log(
      "🚀 Personnel: Starting import of",
      importedEmployees.length,
      "employees"
    );

    try {
      const response = await fetch("/api/personnel/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employees: importedEmployees,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Personnel: Import failed:", data);
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      console.log("✅ Personnel: Import successful:", data);

      // Show success message
      alert(
        `Import succesvol! ${data.results.success} medewerkers geïmporteerd${
          data.results.failed > 0 ? `, ${data.results.failed} gefaald` : ""
        }.`
      );

      // Refresh the employee list
      await fetchEmployees();
    } catch (error) {
      console.error("💥 Personnel: Import error:", error);

      // Show user-friendly error message
      let errorMessage = "Er is een fout opgetreden bij het importeren";

      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage = "Je hebt geen rechten om medewerkers te importeren";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "De import duurde te lang. Probeer het opnieuw met minder medewerkers";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage = "Netwerkfout. Controleer je internetverbinding";
        } else {
          errorMessage = error.message;
        }
      }

      alert(`Import gefaald: ${errorMessage}`);
      throw error; // Re-throw so the ExcelImport component can handle it
    }
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

  const getRoleBadgeColor = (role: string): string => {
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

  const getRoleDisplayName = (role: string): string => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "👑 Administrator";
      case "manager":
        return "👔 Manager";
      case "employee":
        return "👷 Medewerker";
      case "freelancer":
        return "💼 Freelancer";
      default:
        return role || "Onbekend";
    }
  };

  const tableColumns = [
    // Implementation of tableColumns function
  ];

  // CSV Export functionality
  const createCSVExport = () => {
    const headers = [
      "Naam",
      "Email",
      "Rol",
      "Type",
      "Bedrijf",
      "Telefoon",
      "Adres",
      "Uurloon",
      "Status",
      "Werksoorten",
    ];

    const csvData = filteredEmployees.map((emp) => [
      emp.name,
      emp.email,
      getRoleDisplayName(emp.role),
      getEmployeeTypeText(emp.employeeType || ""),
      emp.company,
      emp.phone || "",
      emp.address || "",
      emp.hourlyRate || emp.hourlyWage || "",
      emp.status === "active" ? "Actief" : "Inactief",
      emp.workTypes?.join("; ") || "",
    ]);

    return [headers, ...csvData]
      .map((row) =>
        row
          .map((cell) => `"${(cell || "").toString().replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contract Generation Function
  const generateContract = (employee: Employee) => {
    try {
      ExportUtils.generateEmployeeContract(employee);
    } catch (error) {
      console.error("Error generating contract:", error);
      setError("Fout bij het genereren van het contract");
    }
  };

  const handleGenerateContract = (employee: Employee) => {
    setEmployeeForContract(employee);
    setShowContractModal(true);
  };

  const confirmGenerateContract = () => {
    if (employeeForContract) {
      generateContract(employeeForContract);
      setShowContractModal(false);
      setEmployeeForContract(null);
      console.log("Contract gegenereerd voor:", employeeForContract.name);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Personeel Beheer" },
        ]}
        className="mb-4"
      />

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Totaal Medewerkers"
          value={employees.filter((e) => !e.archived).length}
          icon={<UserGroupIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Actieve personeelsleden"
          trend={{
            value: 2,
            isPositive: true,
            label: "deze maand",
          }}
        />

        <MetricCard
          title="Vaste Medewerkers"
          value={
            employees.filter((e) => e.role === "EMPLOYEE" && !e.archived).length
          }
          icon={<BriefcaseIcon className="w-8 h-8" />}
          color="green"
          subtitle="In vaste dienst"
          trend={{
            value: 3,
            isPositive: true,
            label: "vs vorige maand",
          }}
        />

        <MetricCard
          title="Freelancers"
          value={
            employees.filter((e) => e.role === "FREELANCER" && !e.archived)
              .length
          }
          icon={<BuildingOfficeIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Externe medewerkers"
          trend={{
            value: 4,
            isPositive: true,
            label: "actieve projecten",
          }}
        />

        <MetricCard
          title="Contracten"
          value={employees.filter((e) => e.hasContract && !e.archived).length}
          icon={<DocumentTextIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Ondertekende contracten"
          trend={{
            value: 95,
            isPositive: true,
            label: "% compleet",
          }}
        />
      </div>

      {/* Action Bar */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700 mb-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 dark:border-gray-600">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  Personeel Beheer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Beheer en organiseer je team effectief
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedEmployees.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="md"
                  leftIcon={<TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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
                leftIcon={
                  <DocumentArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                }
                variant="outline"
                size="md"
                className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-900/30 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <span className="sm:hidden">Excel Import</span>
                <span className="hidden sm:inline">Excel Import</span>
              </Button>
              <Button
                onClick={() => {
                  const csvContent = createCSVExport();
                  downloadCSV(
                    csvContent,
                    `personnel-export-${format(new Date(), "yyyy-MM-dd")}.csv`
                  );
                }}
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                variant="outline"
                size="md"
                className="bg-gradient-to-r from-green-50 to-emerald-100 text-emerald-700 border-emerald-300 hover:from-emerald-100 hover:to-emerald-200 hover:border-emerald-400 dark:from-emerald-900/20 dark:to-emerald-800/20 dark:text-emerald-300 dark:border-emerald-600 dark:hover:bg-emerald-900/30 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <span className="sm:hidden">Export CSV</span>
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                variant="primary"
                size="md"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-bold"
              >
                <span className="sm:hidden">Nieuwe Medewerker</span>
                <span className="hidden sm:inline">Nieuwe Medewerker</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
              {selectedEmployees.length > 0 && (
                <span className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>
                    <strong>{selectedEmployees.length}</strong> geselecteerd
                  </span>
                </span>
              )}
            </div>
            <label className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-sm"
              />
              <span className="text-sm font-semibold">Toon gearchiveerd</span>
              <ArchiveBoxIcon className="h-4 w-4" />
            </label>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 shadow-lg"></div>
              <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Laden van personeel...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Even geduld, we halen de laatste gegevens op
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
                Fout bij laden van personeel
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                Opnieuw proberen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEmployees.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <UserGroupIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Geen medewerkers gevonden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {filters.search || filters.role || filters.company
                ? "Geen medewerkers voldoen aan de huidige filterinstellingen. Pas je zoekopdracht aan of verwijder filters."
                : "Er zijn nog geen medewerkers toegevoegd aan het systeem. Voeg je eerste medewerker toe om te beginnen."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(filters.search || filters.role || filters.company) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters(defaultFilters)}
                  leftIcon={<FunnelIcon className="h-4 w-4" />}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Filters wissen
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                {filteredEmployees.length === 0 && !filters.search
                  ? "Eerste Medewerker Toevoegen"
                  : "Nieuwe Medewerker"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredEmployees.length > 0 && (
        <div className="space-y-8">
          {/* Active Employees Section */}
          {filteredEmployees.filter((emp) => !emp.archived).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Actieve Medewerkers
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {
                          filteredEmployees.filter((emp) => !emp.archived)
                            .length
                        }{" "}
                        medewerkers beschikbaar voor projecten
                      </p>
                    </div>
                  </div>

                  {/* Employee Type Statistics */}
                  <div className="hidden sm:flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {
                          filteredEmployees.filter(
                            (emp) =>
                              emp.employeeType === "PERMANENT" && !emp.archived
                          ).length
                        }
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Vast
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {
                          filteredEmployees.filter(
                            (emp) =>
                              emp.employeeType === "FREELANCER" && !emp.archived
                          ).length
                        }
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Freelancers
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {
                          filteredEmployees.filter(
                            (emp) =>
                              emp.employeeType === "FLEX_WORKER" &&
                              !emp.archived
                          ).length
                        }
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Oproep
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Grid */}
              <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEmployees
                    .filter((emp) => !emp.archived)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1 flex flex-col h-full"
                      >
                        {/* Fixed Header Section */}
                        <div className="p-6 flex-shrink-0">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                <span className="text-white font-bold text-xl">
                                  {employee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {employee.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content Section - Flexible */}
                        <div className="px-6 flex-1 space-y-4">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-3 py-1.5 text-xs font-bold rounded-full ${getRoleColor(
                                employee.role
                              )} shadow-sm`}
                            >
                              {getRoleText(employee.role)}
                            </span>
                            <span
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getEmployeeTypeColor(
                                employee.employeeType || ""
                              )} shadow-sm`}
                            >
                              {getEmployeeTypeText(employee.employeeType || "")}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                              <BuildingOfficeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <span className="truncate font-medium">
                                {employee.company}
                              </span>
                            </div>

                            {employee.phone && (
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="font-medium">
                                  {employee.phone}
                                </span>
                              </div>
                            )}

                            {(employee.hourlyRate || employee.hourlyWage) && (
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                <BanknotesIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  €{employee.hourlyRate || employee.hourlyWage}
                                  /uur
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Work Types */}
                          {employee.workTypes &&
                            employee.workTypes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {employee.workTypes
                                    .slice(0, 3)
                                    .map((workType, index) => (
                                      <span
                                        key={index}
                                        className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-700/50"
                                      >
                                        {workType}
                                      </span>
                                    ))}
                                  {employee.workTypes.length > 3 && (
                                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600">
                                      +{employee.workTypes.length - 3} meer
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              📧 {employee.email}
                            </p>
                            {employee.phone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                📞 {employee.phone}
                              </p>
                            )}
                            {employee.company && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                🏢 {employee.company}
                              </p>
                            )}
                          </div>

                          {/* Work Pattern Indicator */}
                          {employee.workPatternAssignments &&
                            employee.workPatternAssignments.length > 0 && (
                              <div className="mb-4">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Werkpatroon:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {employee.workPatternAssignments
                                    .slice(0, 2)
                                    .map((assignment: any, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                      >
                                        {assignment.icon} {assignment.name}
                                      </span>
                                    ))}
                                  {employee.workPatternAssignments.length >
                                    2 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                      +
                                      {employee.workPatternAssignments.length -
                                        2}{" "}
                                      meer
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Fixed Footer Section */}
                        <div className="px-6 py-4 mt-auto border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/personnel/edit/${employee.id}`
                                );
                              }}
                              variant="primary"
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1 max-w-[140px] font-semibold"
                              title="Medewerker beheren"
                            >
                              <UserGroupIcon className="h-4 w-4 mr-2" />
                              Beheren
                            </Button>

                            <div className="flex flex-col items-end text-right ml-3">
                              {employee.hireDate && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Sinds{" "}
                                  {format(
                                    new Date(employee.hireDate),
                                    "MMM yyyy",
                                    { locale: nl }
                                  )}
                                </div>
                              )}
                              <div className="flex items-center space-x-1 mt-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                  Actief
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Archived Employees Section */}
          {includeArchived &&
            filteredEmployees.filter((emp) => emp.archived).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
                        <ArchiveBoxIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Gearchiveerde Medewerkers
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {
                            filteredEmployees.filter((emp) => emp.archived)
                              .length
                          }{" "}
                          medewerkers in archief
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                          {
                            filteredEmployees.filter((emp) => emp.archived)
                              .length
                          }
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Gearchiveerd
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50/30 dark:bg-gray-800/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees
                      .filter((emp) => emp.archived)
                      .map((employee) => (
                        <div
                          key={employee.id}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-300 dark:border-gray-600 opacity-80 hover:opacity-100 transition-opacity duration-200 flex flex-col h-full"
                        >
                          {/* Fixed Header Section */}
                          <div className="p-6 flex-shrink-0">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-md">
                                  <span className="text-white font-bold text-xl">
                                    {employee.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 truncate">
                                  {employee.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Content Section - Flexible */}
                          <div className="px-6 flex-1">
                            <div className="flex items-center justify-center">
                              <span className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl shadow-sm border border-gray-300 dark:border-gray-600">
                                <ArchiveBoxIcon className="h-4 w-4 inline mr-2" />
                                Gearchiveerd
                              </span>
                            </div>
                          </div>

                          {/* Fixed Footer Section */}
                          <div className="px-6 py-4 mt-auto border-t border-gray-200 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-600/30 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/personnel/edit/${employee.id}`
                                  )
                                }
                                variant="primary"
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1 font-semibold"
                                title="Medewerker beheren"
                              >
                                <UserGroupIcon className="h-4 w-4 mr-2" />
                                Beheren
                              </Button>
                              <Button
                                onClick={() =>
                                  handleUnarchiveEmployee(employee)
                                }
                                variant="primary"
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1 font-semibold"
                                title="Medewerker herstellen"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Herstel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Advanced Filters Section */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FunnelIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Geavanceerde Filters
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Verfijn je zoekopdracht met geavanceerde filteropties
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50/30 dark:bg-gray-800/30">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableWorkTypes={availableWorkTypes}
            availableCompanies={availableCompanies}
          />
        </div>
      </div>
    </div>
  );
}
