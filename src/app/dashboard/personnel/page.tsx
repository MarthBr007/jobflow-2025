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
      {/* Modern Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Personeel Beheer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Beheer medewerkers, freelancers en hun gegevens
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span>
                      {employees.filter((e) => !e.archived).length} Actief
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    <span>
                      {employees.filter((e) => e.role === "EMPLOYEE").length}{" "}
                      Vast
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-purple-500 rounded-full"></span>
                    <span>
                      {employees.filter((e) => e.role === "FREELANCER").length}{" "}
                      Freelancers
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons with improved spacing */}
            <div className="button-group-loose flex-wrap sm:flex-nowrap">
              {selectedEmployees.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="md"
                  leftIcon={<TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="touch-target-sm"
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
                className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/20 touch-target-sm"
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
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20 touch-target-sm"
              >
                <span className="sm:hidden">Export CSV</span>
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                variant="primary"
                size="md"
                className="touch-target-sm shadow-lg"
              >
                <span className="sm:hidden">Nieuwe Medewerker</span>
                <span className="hidden sm:inline">Nieuwe Medewerker</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Section */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableWorkTypes={availableWorkTypes}
            availableCompanies={availableCompanies}
          />
        </div>

        {/* Quick Stats Bar */}
        <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span>
                  <strong>{filteredEmployees.length}</strong> medewerkers
                  gevonden
                </span>
              </span>
              {selectedEmployees.length > 0 && (
                <span className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>
                    <strong>{selectedEmployees.length}</strong> geselecteerd
                  </span>
                </span>
              )}
            </div>
            <label className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium">Toon gearchiveerd</span>
              <ArchiveBoxIcon className="h-4 w-4" />
            </label>
          </div>
        </div>
      </div>

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
        <div className="space-y-6">
          {/* Active Employees Section */}
          {filteredEmployees.filter((emp) => !emp.archived).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Actieve Medewerkers
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {
                          filteredEmployees.filter((emp) => !emp.archived)
                            .length
                        }{" "}
                        medewerkers actief
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees
                    .filter((emp) => !emp.archived)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group"
                        onClick={() => openEditModal(employee)}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                              <span className="text-white font-bold text-lg">
                                {employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Employee Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {employee.name}
                              </h4>
                              {employee.hasContract && (
                                <div
                                  className="h-2 w-2 bg-green-500 rounded-full"
                                  title="Heeft contract"
                                ></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3">
                              {employee.email}
                            </p>

                            {/* Role and Type Badges */}
                            <div className="flex items-center space-x-2 mb-3">
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeColor(
                                  employee.role
                                )}`}
                              >
                                {getRoleDisplayName(employee.role)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-semibold ${getEmployeeTypeColor(
                                  employee.employeeType || ""
                                )}`}
                              >
                                {getEmployeeTypeText(
                                  employee.employeeType || ""
                                )}
                              </span>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                              {employee.phone && (
                                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                  <PhoneIcon className="h-4 w-4" />
                                  <span className="truncate">
                                    {employee.phone}
                                  </span>
                                </div>
                              )}
                              {employee.company && (
                                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                  <BuildingOfficeIcon className="h-4 w-4" />
                                  <span className="truncate">
                                    {employee.company}
                                  </span>
                                </div>
                              )}
                              {(employee.hourlyRate || employee.hourlyWage) && (
                                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                  <CurrencyEuroIcon className="h-4 w-4" />
                                  <span>
                                    €
                                    {employee.hourlyRate || employee.hourlyWage}
                                    /uur
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Work Types */}
                            {employee.workTypes &&
                              employee.workTypes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                  <div className="flex flex-wrap gap-1">
                                    {employee.workTypes
                                      .slice(0, 2)
                                      .map((workType, index) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                                        >
                                          {workType}
                                        </span>
                                      ))}
                                    {employee.workTypes.length > 2 && (
                                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                        +{employee.workTypes.length - 2} meer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Action Buttons */}
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
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
                                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  title="Medewerker beheren"
                                >
                                  <UserGroupIcon className="h-4 w-4 mr-1" />
                                  Beheren
                                </Button>
                              </div>

                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {employee.hireDate && (
                                  <>
                                    Sinds{" "}
                                    {format(
                                      new Date(employee.hireDate),
                                      "MMM yyyy",
                                      { locale: nl }
                                    )}
                                  </>
                                )}
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
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <ArchiveBoxIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Gearchiveerde Medewerkers
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {
                            filteredEmployees.filter((emp) => emp.archived)
                              .length
                          }{" "}
                          gearchiveerd
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees
                      .filter((emp) => emp.archived)
                      .map((employee) => (
                        <div
                          key={employee.id}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-300 dark:border-gray-600 p-6 opacity-75"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {employee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {employee.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                                {employee.email}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg">
                                  Gearchiveerd
                                </span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/personnel/edit/${employee.id}`
                                      )
                                    }
                                    variant="primary"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    title="Medewerker beheren"
                                  >
                                    <UserGroupIcon className="h-4 w-4 mr-1" />
                                    Beheren
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleUnarchiveEmployee(employee)
                                    }
                                    variant="primary"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    title="Medewerker herstellen"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Herstel
                                  </Button>
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
                Financiële Gegevens
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
                      Kostenberekening per dag (8 uur)
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
                      Kostenberekening per dag (8 uur)
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
                      Kostenberekening per dag (o.b.v. 22 werkdagen)
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
              Annuleren
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleArchiveEmployee}
              leftIcon={<TrashIcon className="h-4 w-4" />}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              Archiveren
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contract Generation Confirmation Modal */}
      <Modal
        isOpen={showContractModal}
        onClose={() => {
          setShowContractModal(false);
          setEmployeeForContract(null);
        }}
        title="📋 Contract Genereren"
        description={`Contract genereren voor ${employeeForContract?.name}`}
        size="md"
        type="info"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClipboardDocumentIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Contract wordt gegenereerd
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Er wordt een professioneel contract aangemaakt voor{" "}
                  <strong>{employeeForContract?.name}</strong> met de volgende
                  gegevens:
                </p>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                  <li>Persoonlijke gegevens en contactinformatie</li>
                  <li>Functieomschrijving en werkzaamheden</li>
                  <li>Salaris en arbeidsvoorwaarden</li>
                  <li>Standaard contractuele bepalingen</li>
                  <li>JobFlow branding en vormgeving</li>
                </ul>
              </div>
            </div>
          </div>

          {employeeForContract && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {employeeForContract.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {employeeForContract.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getRoleColor(
                        employeeForContract.role
                      )}`}
                    >
                      {getRoleText(employeeForContract.role)}
                    </span>
                    {employeeForContract.employeeType && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getEmployeeTypeColor(
                          employeeForContract.employeeType
                        )}`}
                      >
                        {getEmployeeTypeText(employeeForContract.employeeType)}
                      </span>
                    )}
                    {(employeeForContract.hourlyRate ||
                      employeeForContract.hourlyWage) && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        €
                        {employeeForContract.hourlyRate ||
                          employeeForContract.hourlyWage}
                        /uur
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Het contract wordt als PDF bestand gedownload. Controleer de
                  gegevens en laat het contract ondertekenen door beide
                  partijen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowContractModal(false);
                setEmployeeForContract(null);
              }}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={confirmGenerateContract}
              leftIcon={<ClipboardDocumentIcon className="h-4 w-4" />}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Contract Genereren
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
