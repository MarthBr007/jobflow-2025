"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
  HomeIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ContractViewer from "@/components/ui/ContractViewer";
import FreelanceContractGenerator from "@/components/ui/FreelanceContractGenerator";
import EmployeeContractGenerator from "@/components/ui/EmployeeContractGenerator";
import QuickContractGenerator from "@/components/ui/QuickContractGenerator";
import PersonnelContractManagement from "@/components/ui/PersonnelContractManagement";
import { useConfirm } from "@/hooks/useConfirm";

interface Employee {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  company: string;
  employeeType?: string;
  address?: string;
  hourlyRate?: string;
  hourlyWage?: string;
  monthlySalary?: string;
  iban?: string;
  bsnNumber?: string;
  kvkNumber?: string;
  btwNumber?: string;
  hasContract?: boolean;
  availableDays?: string;
  dateOfBirth?: Date | null;
  bsn?: string;
  zipCode?: string;
  city?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  workTypes?: string[];
}

interface WorkType {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  isActive: boolean;
}

interface WorkPattern {
  id: string;
  name: string;
  description?: string;
  type?: string;
  isActive: boolean;
  workDays: Array<{
    dayOfWeek: number; // 0=Sundag, 1=Monday, etc.
    isWorkingDay: boolean;
    startTime?: string;
    endTime?: string;
    breakDuration?: number;
  }>;
  totalHoursPerWeek?: number;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkPatternAssignment {
  id: string;
  userId: string;
  workPatternId: string;
  isActive: boolean;
  notes?: string;
  startDate?: string;
  endDate?: string;
  assignedBy?: {
    id: string;
    name: string;
    email: string;
  };
  workPattern: {
    id: string;
    name: string;
    description?: string;
    type?: string;
    totalHoursPerWeek?: number;
    workDays: Array<{
      dayOfWeek: number;
      isWorkingDay: boolean;
      startTime?: string;
      endTime?: string;
      breakDuration?: number;
    }>;
    color?: string;
    icon?: string;
  };
}

// Toast Component
const Toast = ({
  show,
  message,
  type,
  onClose,
}: {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    try {
      if (show) {
        setIsVisible(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, 4000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Toast error:", error);
      // Fallback - just close the toast
      onClose();
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500 border-green-600";
      case "error":
        return "bg-red-500 border-red-600";
      case "info":
        return "bg-blue-500 border-blue-600";
      default:
        return "bg-gray-500 border-gray-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5" />;
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case "info":
        return <DocumentTextIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center px-4 py-3 rounded-lg shadow-lg border text-white transition-all duration-300 transform ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        } ${getToastStyles()}`}
      >
        <div className="flex-shrink-0 mr-3">{getIcon()}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-3 inline-flex text-white hover:text-gray-200 focus:outline-none"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default function EditEmployeeTabs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ConfirmModal, confirm } = useConfirm();

  // Existing state
  const [employee, setEmployee] = useState<Employee>({
    id: "",
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "EMPLOYEE",
    company: "",
    employeeType: "PERMANENT",
    address: "",
    hourlyRate: "",
    hourlyWage: "",
    monthlySalary: "",
    iban: "",
    bsnNumber: "",
    kvkNumber: "",
    btwNumber: "",
    hasContract: false,
    availableDays: "",
    dateOfBirth: null,
    bsn: "",
    zipCode: "",
    city: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    workTypes: [],
  });

  const [activeTab, setActiveTab] = useState("profiel");
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [workPatterns, setWorkPatterns] = useState<WorkPattern[]>([]);
  const [workPatternAssignments, setWorkPatternAssignments] = useState<
    WorkPatternAssignment[]
  >([]);
  const [showWorkPatternModal, setShowWorkPatternModal] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState("");
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [compensationData, setCompensationData] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [compensationLoading, setCompensationLoading] = useState(false);
  const [selectedAttendancePeriod, setSelectedAttendancePeriod] =
    useState("current_month");
  const [showPersonnelContractManagement, setShowPersonnelContractManagement] =
    useState(false);

  // New state for leave balance editing
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(false);
  const [selectedLeaveYear, setSelectedLeaveYear] = useState(
    new Date().getFullYear()
  );
  const [leaveBalanceForm, setLeaveBalanceForm] = useState({
    vacationDaysTotal: 25,
    vacationDaysUsed: 0,
    sickDaysUsed: 0,
    compensationHours: 0,
    compensationUsed: 0,
    specialLeaveUsed: 0,
    notes: "",
  });

  // New state for vacation accrual
  const [vacationAccrualData, setVacationAccrualData] = useState<any>(null);
  const [vacationAccrualLoading, setVacationAccrualLoading] = useState(false);
  const [selectedAccrualYear, setSelectedAccrualYear] = useState(
    new Date().getFullYear()
  );
  const [showAccrualDetailsModal, setShowAccrualDetailsModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  // Check authentication first
  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (!session?.user) {
      setError("Geen geldige sessie gevonden");
      setLoading(false);
      return;
    }

    // Check if user has permission to edit personnel
    if (!["ADMIN", "MANAGER", "HR_MANAGER"].includes(session.user.role || "")) {
      setError("Geen toegang - alleen beheerders kunnen personeel bewerken");
      setLoading(false);
      return;
    }

    // If we get here, user is authenticated and has permission
    if (id) {
      fetchEmployee(id);
      fetchWorkTypes();
      fetchWorkPatterns();
      fetchWorkPatternAssignments(id);
    }
  }, [status, session, id, router]);

  // Error boundary function
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    setToast({
      show: true,
      message: `Er is een fout opgetreden: ${errorMessage}`,
      type: "error",
    });
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({
      show: true,
      message,
      type,
    });
  };

  const fetchCompensationData = async (userId: string) => {
    try {
      setCompensationLoading(true);
      const response = await fetch(
        `/api/personnel/${userId}/compensation?period=current_month`
      );
      const data = await response.json();

      if (data.success) {
        setCompensationData(data.data);
      } else {
        console.error("Failed to fetch compensation data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching compensation data:", error);
    } finally {
      setCompensationLoading(false);
    }
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(Math.abs(hours));
    const m = Math.round((Math.abs(hours) - h) * 60);
    const sign = hours < 0 ? "-" : "";
    return `${sign}${h}u ${m}m`;
  };

  const fetchAttendanceData = async (userId: string) => {
    try {
      setAttendanceLoading(true);
      const response = await fetch(
        `/api/personnel/${userId}/attendance?period=${selectedAttendancePeriod}`
      );
      const data = await response.json();

      if (data.success) {
        setAttendanceData(data.data);
      } else {
        console.error("Failed to fetch attendance data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case "WORKING":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_LEAVE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SICK":
        return "bg-red-100 text-red-800 border-red-200";
      case "OFFLINE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case "WORKING":
        return "Aan het werk";
      case "ON_LEAVE":
        return "Met verlof";
      case "SICK":
        return "Ziek";
      case "OFFLINE":
        return "Offline";
      default:
        return "Onbekend";
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee(id);
      fetchWorkTypes();
      fetchWorkPatterns();
      fetchWorkPatternAssignments(id);
    }
  }, [id]);

  useEffect(() => {
    if (employee.id && activeTab === "verlof-aanwezigheid") {
      fetchAttendanceData(employee.id);
      fetchCompensationData(employee.id);
      fetchLeaveBalance(employee.id, selectedLeaveYear);
      fetchVacationAccrual(employee.id, selectedAccrualYear);
    }
  }, [
    employee.id,
    activeTab,
    selectedAttendancePeriod,
    selectedLeaveYear,
    selectedAccrualYear,
  ]);

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/personnel");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Niet geautoriseerd - log opnieuw in");
          router.push("/auth/login");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Onverwacht data formaat ontvangen");
      }

      const foundEmployee = data.find((emp: Employee) => emp.id === id);

      if (!foundEmployee) {
        setError("Medewerker niet gevonden");
        setTimeout(() => router.push("/dashboard/personnel"), 2000);
        return;
      }

      // Ensure all required fields have default values
      const processedEmployee = {
        ...foundEmployee,
        firstName: foundEmployee.firstName || "",
        lastName: foundEmployee.lastName || "",
        name:
          foundEmployee.name ||
          `${foundEmployee.firstName || ""} ${
            foundEmployee.lastName || ""
          }`.trim(),
        email: foundEmployee.email || "",
        phone: foundEmployee.phone || "",
        role: foundEmployee.role || "EMPLOYEE",
        company: foundEmployee.company || "",
        employeeType: foundEmployee.employeeType || "PERMANENT",
        address: foundEmployee.address || "",
        workTypes: foundEmployee.workTypes || [],
        dateOfBirth: foundEmployee.dateOfBirth
          ? new Date(foundEmployee.dateOfBirth)
          : null,
      };

      setEmployee(processedEmployee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Onbekende fout bij laden medewerker";
      setError(errorMessage);
      handleError(error, "fetchEmployee");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch("/api/work-types");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch work types`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setWorkTypes(data.filter((wt: WorkType) => wt.isActive));
      } else {
        console.warn("Unexpected data format for work types");
        setWorkTypes([]);
      }
    } catch (error) {
      console.error("Error fetching work types:", error);
      setWorkTypes([]); // Set empty array on error
      showToast("Error loading work types", "error");
    }
  };

  const fetchWorkPatterns = async () => {
    try {
      const response = await fetch("/api/work-patterns");

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: Failed to fetch work patterns`
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setWorkPatterns(data.filter((wp: WorkPattern) => wp.isActive));
      } else {
        console.warn("Unexpected data format for work patterns");
        setWorkPatterns([]);
      }
    } catch (error) {
      console.error("Error fetching work patterns:", error);
      setWorkPatterns([]); // Set empty array on error
      showToast("Error loading work patterns", "error");
    }
  };

  const fetchWorkPatternAssignments = async (userId: string) => {
    try {
      console.log(`Fetching work pattern assignments for user: ${userId}`);
      const response = await fetch(`/api/personnel/${userId}/work-patterns`);

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          // No assignments found is not an error
          setWorkPatternAssignments([]);
          return;
        }
        throw new Error(
          `HTTP ${response.status}: Failed to fetch work patterns`
        );
      }

      const data = await response.json();
      console.log("Raw API response:", data);

      // Handle different response formats
      const assignments =
        data.currentAssignments || data.assignments || data || [];

      if (!Array.isArray(assignments)) {
        console.warn("Unexpected data format for work pattern assignments");
        setWorkPatternAssignments([]);
        return;
      }

      // Map and validate the response
      const validAssignments = assignments
        .map((assignment: any) => ({
          ...assignment,
          workPattern: assignment.pattern || assignment.workPattern, // Handle different property names
        }))
        .filter((assignment: any) => {
          try {
            // Basic validation
            if (!assignment.id || !assignment.workPattern) {
              console.warn("Assignment missing required fields:", assignment);
              return false;
            }

            // Validate workDays if present
            if (
              assignment.workPattern.workDays &&
              !Array.isArray(assignment.workPattern.workDays)
            ) {
              console.warn(
                "Invalid workDays format:",
                assignment.workPattern.workDays
              );
              return false;
            }

            return true;
          } catch (assignmentError) {
            console.error("Error validating assignment:", assignmentError);
            return false;
          }
        });

      console.log("Valid assignments count:", validAssignments.length);
      setWorkPatternAssignments(validAssignments);
    } catch (error) {
      console.error("Error in fetchWorkPatternAssignments:", error);
      setWorkPatternAssignments([]); // Set empty array instead of keeping loading state

      // Only show toast for actual errors, not missing data
      if (error instanceof Error && !error.message.includes("404")) {
        showToast(`Error loading work patterns: ${error.message}`, "error");
      }
    }
  };

  const handleAssignWorkPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Handling work pattern assignment");
    console.log("Selected pattern:", selectedPatternId);
    console.log("Employee ID:", employee?.id);

    if (!selectedPatternId || !employee) {
      console.error("Missing required data for assignment");
      showToast("Selecteer een werkpatroon", "error");
      return;
    }

    try {
      setCompensationLoading(true);
      const response = await fetch(
        `/api/personnel/${employee.id}/work-patterns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patternId: selectedPatternId,
            notes: "",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Pattern assigned successfully:", data);
        showToast("Werkpatroon succesvol toegekend", "success");
        setShowWorkPatternModal(false);
        // Refresh assignments
        await fetchWorkPatternAssignments(employee.id);
      } else {
        console.error("Assignment failed:", data);
        showToast(data.error || "Fout bij toekennen werkpatroon", "error");
      }
    } catch (error) {
      console.error("Error assigning work pattern:", error);
      showToast("Fout bij toekennen werkpatroon", "error");
    } finally {
      setCompensationLoading(false);
    }
  };

  const handleRemoveWorkPatternAssignment = async (assignmentId: string) => {
    const confirmed = await confirm({
      title: "Werkpatroon verwijderen?",
      message:
        "Weet je zeker dat je dit werkpatroon wilt verwijderen van deze medewerker?",
      confirmText: "Verwijderen",
      cancelText: "Annuleren",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/user-work-pattern-assignments/${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchWorkPatternAssignments(employee!.id);
      } else {
        console.error("Error removing work pattern assignment");
      }
    } catch (error) {
      console.error("Error removing work pattern assignment:", error);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = [
      "Zondag",
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
      "Zaterdag",
    ];
    return days[dayOfWeek] || "Onbekend";
  };

  // Safe render function for work pattern schedules
  const renderWorkPatternSchedule = (workDays: any) => {
    try {
      if (!workDays || !Array.isArray(workDays)) {
        return (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Geen werkdagen gedefinieerd
          </div>
        );
      }

      const dayMapping = [
        { day: "Zo", dayOfWeek: 0 },
        { day: "Ma", dayOfWeek: 1 },
        { day: "Di", dayOfWeek: 2 },
        { day: "Wo", dayOfWeek: 3 },
        { day: "Do", dayOfWeek: 4 },
        { day: "Vr", dayOfWeek: 5 },
        { day: "Za", dayOfWeek: 6 },
      ];

      return (
        <div className="grid grid-cols-7 gap-2 text-xs">
          {dayMapping.map(({ day, dayOfWeek }) => {
            try {
              const workDay = workDays.find(
                (wd: any) => wd.dayOfWeek === dayOfWeek
              );
              const isWorking =
                workDay?.isWorkingDay && workDay?.startTime && workDay?.endTime;

              return (
                <div
                  key={dayOfWeek}
                  className={`p-2 rounded text-center ${
                    isWorking
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                      : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {day}
                  </div>
                  {isWorking ? (
                    <div className="text-gray-600 dark:text-gray-300">
                      {workDay.startTime}-{workDay.endTime}
                    </div>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">Vrij</div>
                  )}
                </div>
              );
            } catch (dayError) {
              console.error("Error rendering day:", dayOfWeek, dayError);
              return (
                <div
                  key={dayOfWeek}
                  className="p-2 rounded text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
                >
                  <div className="font-medium text-red-900 dark:text-red-200">
                    {day}
                  </div>
                  <div className="text-red-600 dark:text-red-400 text-xs">
                    Error
                  </div>
                </div>
              );
            }
          })}
        </div>
      );
    } catch (error) {
      console.error("Error rendering work pattern schedule:", error);
      return (
        <div className="text-center py-4 text-red-500 dark:text-red-400">
          Error bij weergeven werkpatroon
        </div>
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setCompensationLoading(true);
    try {
      const employeeData = {
        ...employee,
        employeeType: employee.employeeType || "PERMANENT",
      };

      const response = await fetch(`/api/personnel/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard/personnel");
      } else {
        console.error("Error updating employee:", data.error);
        setToast({
          show: true,
          message: `Er is een fout opgetreden bij het opslaan: ${data.error}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      setToast({
        show: true,
        message: "Er is een fout opgetreden bij het opslaan",
        type: "error",
      });
    } finally {
      setCompensationLoading(false);
    }
  };

  const getEmployeeTypeText = (employeeType: string) => {
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

  const getEmployeeTypeColor = (employeeType: string) => {
    switch (employeeType?.toLowerCase()) {
      case "permanent":
        return "bg-blue-100 text-blue-800";
      case "freelancer":
        return "bg-green-100 text-green-800";
      case "flex_worker":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleTabChange = (tabId: string) => {
    try {
      console.log(`Switching to tab: ${tabId}`);
      setActiveTab(tabId);

      // Load work patterns when switching to work tab
      if (tabId === "werk" && employee) {
        console.log("Loading work patterns for work tab");
        fetchWorkPatternAssignments(employee.id);
      }

      // Load attendance and compensation data when switching to verlof-aanwezigheid tab
      if (tabId === "verlof-aanwezigheid" && employee) {
        console.log(
          "Loading attendance, compensation, leave balance, and vacation accrual data for verlof-aanwezigheid tab"
        );
        fetchAttendanceData(employee.id);
        fetchCompensationData(employee.id);
        fetchLeaveBalance(employee.id, selectedLeaveYear);
        fetchVacationAccrual(employee.id, selectedAccrualYear);
      }
    } catch (error) {
      console.error("Error switching tabs:", error);
    }
  };

  // Debug function for modal state changes
  const setModalState = (isOpen: boolean, reason: string) => {
    console.log(
      `Modal state change: ${
        isOpen ? "OPENING" : "CLOSING"
      } - Reason: ${reason}`
    );
    console.log("Current modal state:", showWorkPatternModal);
    console.log("New modal state:", isOpen);
    setShowWorkPatternModal(isOpen);
  };

  // New function to fetch leave balance
  const fetchLeaveBalance = async (userId: string, year: number) => {
    try {
      setLeaveBalanceLoading(true);
      const response = await fetch(
        `/api/admin/leave-balances?userId=${userId}&year=${year}`
      );
      const data = await response.json();
      if (response.ok) {
        if (data.length > 0) {
          const balance = data[0];
          setLeaveBalance(balance);
          setLeaveBalanceForm({
            vacationDaysTotal: balance.vacationDaysTotal,
            vacationDaysUsed: balance.vacationDaysUsed,
            sickDaysUsed: balance.sickDaysUsed,
            compensationHours: balance.compensationHours,
            compensationUsed: balance.compensationUsed,
            specialLeaveUsed: balance.specialLeaveUsed,
            notes: balance.notes || "",
          });
        } else {
          setLeaveBalance(null);
          setLeaveBalanceForm({
            vacationDaysTotal: 25,
            vacationDaysUsed: 0,
            sickDaysUsed: 0,
            compensationHours: 0,
            compensationUsed: 0,
            specialLeaveUsed: 0,
            notes: "",
          });
        }
      } else {
        console.error("Error fetching leave balance:", data.error);
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    } finally {
      setLeaveBalanceLoading(false);
    }
  };

  // New function for vacation accrual
  const fetchVacationAccrual = async (userId: string, year: number) => {
    try {
      setVacationAccrualLoading(true);
      const response = await fetch(
        `/api/vacation-accrual/calculate?userId=${userId}&year=${year}`
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setVacationAccrualData(data.data);
      } else {
        setVacationAccrualData(null);
      }
    } catch (error) {
      console.error("Error fetching vacation accrual:", error);
      setVacationAccrualData(null);
    } finally {
      setVacationAccrualLoading(false);
    }
  };

  const calculateVacationAccrual = async (userId: string, year: number) => {
    try {
      setVacationAccrualLoading(true);
      const response = await fetch("/api/vacation-accrual/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, year }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh data after calculation
        await fetchVacationAccrual(userId, year);
        showToast("Vakantie-opbouw succesvol herberekend", "success");
      } else {
        showToast("Fout bij herberekenen vakantie-opbouw", "error");
      }
    } catch (error) {
      console.error("Error calculating vacation accrual:", error);
      showToast("Fout bij herberekenen vakantie-opbouw", "error");
    }
  };

  // New function to update leave balance
  const updateLeaveBalance = async () => {
    try {
      setLeaveBalanceLoading(true);
      const response = await fetch("/api/admin/leave-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: employee.id,
          year: selectedLeaveYear,
          ...leaveBalanceForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Verlof saldo succesvol bijgewerkt", "success");
        setShowLeaveBalanceModal(false);
        // Refresh the leave balance data
        await fetchLeaveBalance(employee.id, selectedLeaveYear);
        // Also refresh attendance data which includes leave balance info
        await fetchAttendanceData(employee.id);
      } else {
        showToast(data.error || "Fout bij bijwerken verlof saldo", "error");
      }
    } catch (error) {
      console.error("Error updating leave balance:", error);
      showToast("Fout bij bijwerken verlof saldo", "error");
    } finally {
      setLeaveBalanceLoading(false);
    }
  };

  // Loading state - show while checking authentication or loading employee
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-900 dark:text-white">
            {status === "loading"
              ? "Authenticatie controleren..."
              : "Medewerker laden..."}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
              Er is een probleem opgetreden
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <div className="space-y-2">
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Probeer opnieuw
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/personnel")}
                className="w-full"
              >
                Terug naar Personeel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication required
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-900 dark:text-white mb-4">
            Inloggen vereist
          </div>
          <Button variant="primary" onClick={() => router.push("/auth/login")}>
            Naar inlogpagina
          </Button>
        </div>
      </div>
    );
  }

  // Employee not found or not loaded
  if (!employee || !employee.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <div className="text-xl text-gray-900 dark:text-white">
            Medewerker niet gevonden
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/personnel")}
            className="mt-4"
          >
            Terug naar Personeel
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "profiel",
      name: "Profiel & Contact",
      icon: UserGroupIcon,
      description: "Persoonlijke gegevens en contactinformatie",
    },
    {
      id: "werk",
      name: "Werk & Planning",
      icon: CalendarDaysIcon,
      description: "Werkzaamheden, roosters en tijdregistratie",
    },
    {
      id: "contract-financieel",
      name: "Contracten & Financieel",
      icon: DocumentTextIcon,
      description: "Contractbeheer, salaris en bedrijfsgegevens",
    },
    {
      id: "verlof-aanwezigheid",
      name: "Verlof & Aanwezigheid",
      icon: CalendarIcon,
      description: "Verlofbalans, vakantie-opbouw en aanwezigheid",
    },
  ];

  return (
    <div className="space-y-6">
      <ConfirmModal />
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Personeel", href: "/dashboard/personnel" },
          { label: `${employee.name} bewerken` },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/personnel")}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            size="md"
          >
            Terug naar Personeel
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Medewerker Bewerken
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bewerk de gegevens van {employee.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-6 w-6 text-gray-400" />
            {employee.employeeType && (
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getEmployeeTypeColor(
                  employee.employeeType
                )}`}
              >
                {getEmployeeTypeText(employee.employeeType)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Form */}
      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {/* Nav Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:z-10 transition-all duration-200 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <Icon
                        className={`h-5 w-5 mb-2 ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-blue-600 dark:text-blue-400" : ""
                        }`}
                      >
                        {tab.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                        {tab.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {/* Profiel & Contact Tab (was Algemeen) */}
            {activeTab === "profiel" && (
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Persoonlijke Gegevens
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal info fields - keeping all existing content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Voornaam *
                      </label>
                      <Input
                        type="text"
                        value={employee.firstName}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="Voornaam"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Achternaam *
                      </label>
                      <Input
                        type="text"
                        value={employee.lastName}
                        onChange={(e) =>
                          setEmployee({ ...employee, lastName: e.target.value })
                        }
                        placeholder="Achternaam"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="email"
                          value={employee.email || ""}
                          onChange={(e) =>
                            setEmployee({ ...employee, email: e.target.value })
                          }
                          placeholder="email@voorbeeld.nl"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefoonnummer
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="tel"
                          value={employee.phone || ""}
                          onChange={(e) =>
                            setEmployee({ ...employee, phone: e.target.value })
                          }
                          placeholder="06-12345678"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Geboortedatum
                      </label>
                      <Input
                        type="date"
                        value={
                          employee.dateOfBirth
                            ? new Date(employee.dateOfBirth)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const dateValue = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          setEmployee({
                            ...employee,
                            dateOfBirth: dateValue,
                          });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        BSN
                      </label>
                      <Input
                        type="text"
                        value={employee.bsn || ""}
                        onChange={(e) =>
                          setEmployee({ ...employee, bsn: e.target.value })
                        }
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <HomeIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Adresgegevens
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Adres
                      </label>
                      <Input
                        type="text"
                        value={employee.address || ""}
                        onChange={(e) =>
                          setEmployee({ ...employee, address: e.target.value })
                        }
                        placeholder="Straatnaam 123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Postcode
                      </label>
                      <Input
                        type="text"
                        value={employee.zipCode || ""}
                        onChange={(e) =>
                          setEmployee({ ...employee, zipCode: e.target.value })
                        }
                        placeholder="1234AB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stad
                      </label>
                      <Input
                        type="text"
                        value={employee.city || ""}
                        onChange={(e) =>
                          setEmployee({ ...employee, city: e.target.value })
                        }
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Contactpersoon bij Noodgevallen
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Naam
                      </label>
                      <Input
                        type="text"
                        value={employee.emergencyContactName || ""}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            emergencyContactName: e.target.value,
                          })
                        }
                        placeholder="Naam contactpersoon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefoonnummer
                      </label>
                      <Input
                        type="tel"
                        value={employee.emergencyContactPhone || ""}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                        placeholder="06-12345678"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Werk Tab */}
            {activeTab === "werk" && (
              <div className="space-y-8">
                {(() => {
                  try {
                    return (
                      <>
                        {/* Current Work Pattern Assignments */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Huidige Werkpatronen
                              </h3>
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Button clicked - opening modal");
                                  // Add small delay to prevent immediate closing
                                  setTimeout(() => {
                                    setModalState(
                                      true,
                                      "Button click - Werkpatroon Toewijzen"
                                    );
                                  }, 10);
                                }}
                                size="sm"
                              >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Werkpatroon Toewijzen
                              </Button>
                            </div>
                          </div>
                          <div className="p-6">
                            {!workPatternAssignments ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  Werkpatronen laden...
                                </p>
                              </div>
                            ) : workPatternAssignments.length === 0 ? (
                              <div className="text-center py-8">
                                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  Geen werkpatronen toegewezen
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                  Deze medewerker heeft nog geen werkpatronen
                                  toegewezen gekregen.
                                </p>
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(
                                      "Button clicked - opening modal (empty state)"
                                    );
                                    // Add small delay to prevent immediate closing
                                    setTimeout(() => {
                                      setModalState(
                                        true,
                                        "Button click - Eerste Werkpatroon"
                                      );
                                    }, 10);
                                  }}
                                  size="sm"
                                >
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  Eerste Werkpatroon Toewijzen
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {workPatternAssignments.map((assignment) => {
                                  try {
                                    return (
                                      <div
                                        key={assignment.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center space-x-3">
                                            <div
                                              className={`w-3 h-3 rounded-full bg-${
                                                assignment.workPattern?.color ||
                                                "blue"
                                              }-500`}
                                            ></div>
                                            <div>
                                              <h4 className="font-medium text-gray-900 dark:text-white">
                                                {assignment.workPattern?.name ||
                                                  "Onbekend patroon"}
                                              </h4>
                                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {assignment.workPattern
                                                  ?.description ||
                                                  "Geen beschrijving"}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                              {assignment.workPattern
                                                ?.totalHoursPerWeek || 0}{" "}
                                              uur/week
                                            </span>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                try {
                                                  // Handle remove assignment
                                                  console.log(
                                                    "Remove assignment:",
                                                    assignment.id
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Error removing assignment:",
                                                    error
                                                  );
                                                }
                                              }}
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Work Schedule Display */}
                                        <div className="mt-4">
                                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Werkschema:
                                          </h5>
                                          {renderWorkPatternSchedule(
                                            assignment.workPattern?.workDays
                                          )}
                                        </div>

                                        {/* Assignment Details */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-500 dark:text-gray-400">
                                                Startdatum:
                                              </span>
                                              <span className="ml-2 text-gray-900 dark:text-white">
                                                {assignment.startDate
                                                  ? new Date(
                                                      assignment.startDate
                                                    ).toLocaleDateString(
                                                      "nl-NL"
                                                    )
                                                  : "Niet gespecificeerd"}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-gray-500 dark:text-gray-400">
                                                Toegewezen door:
                                              </span>
                                              <span className="ml-2 text-gray-900 dark:text-white">
                                                {assignment.assignedBy?.name ||
                                                  "Onbekend"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  } catch (assignmentRenderError) {
                                    console.error(
                                      "Error rendering assignment:",
                                      assignmentRenderError
                                    );
                                    return (
                                      <div
                                        key={assignment.id}
                                        className="border border-red-200 bg-red-50 rounded-lg p-4"
                                      >
                                        <p className="text-red-600 text-sm">
                                          Error loading assignment:{" "}
                                          {assignmentRenderError instanceof
                                          Error
                                            ? assignmentRenderError.message
                                            : "Unknown error"}
                                        </p>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Werkzaamheden Section */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              Werkzaamheden
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Selecteer de werkzaamheden die deze medewerker kan
                              uitvoeren
                            </p>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {workTypes.map((workType) => {
                                const isChecked = employee.workTypes?.includes(
                                  workType.name
                                );

                                return (
                                  <label
                                    key={workType.name}
                                    className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                                      isChecked
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const updatedWorkTypes = e.target
                                          .checked
                                          ? [
                                              ...(employee.workTypes || []),
                                              workType.name,
                                            ]
                                          : (employee.workTypes || []).filter(
                                              (type) => type !== workType.name
                                            );
                                        setEmployee({
                                          ...employee,
                                          workTypes: updatedWorkTypes,
                                        });
                                      }}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1 dark:bg-gray-700"
                                    />
                                    <div className="ml-3 flex flex-col">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {workType.emoji && (
                                          <span className="mr-2">
                                            {workType.emoji}
                                          </span>
                                        )}
                                        {workType.name}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {workType.description ||
                                          "Geen beschrijving beschikbaar"}
                                      </span>
                                    </div>
                                    {isChecked && (
                                      <div className="absolute top-3 right-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      </div>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                            {workTypes.length === 0 && (
                              <div className="text-center py-8">
                                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  Geen werkzaamheden beschikbaar
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                  Er zijn nog geen werkzaamheden gedefinieerd.
                                  Voeg eerst werkzaamheden toe in de admin
                                  sectie.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Beschikbare Dagen Section */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              Beschikbare dagen
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Selecteer de dagen waarop deze medewerker
                              beschikbaar is
                            </p>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
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
                                  employee.availableDays
                                    ?.split(",")
                                    .map((d) => d.trim())
                                    .filter((d) => d) || [];
                                const isChecked = availableDays.includes(
                                  day.short
                                );

                                return (
                                  <label
                                    key={day.short}
                                    className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                                      isChecked
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentDays =
                                          employee.availableDays
                                            ?.split(",")
                                            .map((d) => d.trim())
                                            .filter((d) => d) || [];
                                        const updatedDays = e.target.checked
                                          ? [...currentDays, day.short]
                                          : currentDays.filter(
                                              (d) => d !== day.short
                                            );
                                        setEmployee({
                                          ...employee,
                                          availableDays: updatedDays.join(", "),
                                        });
                                      }}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                                    />
                                    <div className="ml-3 flex flex-col">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {day.short}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                        {day.full}
                                      </span>
                                    </div>
                                    {isChecked && (
                                      <div className="absolute top-2 right-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      </div>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  } catch (workTabError) {
                    console.error("Error in work tab:", workTabError);
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mb-2" />
                        <h3 className="text-lg font-medium text-red-800 mb-2">
                          Error in Work Tab
                        </h3>
                        <p className="text-red-600 text-sm mb-4">
                          {workTabError instanceof Error
                            ? workTabError.message
                            : "Unknown error in work tab"}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.location.reload()}
                          size="sm"
                        >
                          Pagina Herladen
                        </Button>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Contract-Financieel Tab (combines old Financieel + Contracten) */}
            {activeTab === "contract-financieel" && (
              <div className="space-y-6">
                {/* Employee Type and Role Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Functie & Rol
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rol in Systeem
                      </label>
                      <select
                        value={employee.role}
                        onChange={(e) =>
                          setEmployee({ ...employee, role: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="ADMIN">👑 Administrator</option>
                        <option value="MANAGER">👨‍💼 Manager</option>
                        <option value="HR_MANAGER">👥 HR Manager</option>
                        <option value="PLANNER">📅 Planner</option>
                        <option value="EMPLOYEE">👨‍💻 Medewerker</option>
                        <option value="FREELANCER">🎯 Freelancer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type Medewerker
                      </label>
                      <select
                        value={employee.employeeType || "PERMANENT"}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            employeeType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="PERMANENT">Vaste Medewerker</option>
                        <option value="FREELANCER">Freelancer</option>
                        <option value="FLEX_WORKER">Oproepkracht</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bedrijf
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={employee.company}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              company: e.target.value,
                            })
                          }
                          className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="Broers Verhuur">Broers Verhuur</option>
                          <option value="DCRT Event Decorations">
                            DCRT Event Decorations
                          </option>
                          <option value="DCRT in Building">
                            DCRT in Building
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <CurrencyEuroIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Financiële Gegevens
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IBAN Nummer
                      </label>
                      <Input
                        type="text"
                        value={employee.iban || ""}
                        onChange={(e) =>
                          setEmployee({ ...employee, iban: e.target.value })
                        }
                        placeholder="NL91ABNA0417164300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        KvK Nummer
                      </label>
                      <Input
                        type="text"
                        value={employee.kvkNumber || ""}
                        onChange={(e) =>
                          setEmployee({
                            ...employee,
                            kvkNumber: e.target.value,
                          })
                        }
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Contract Management Section - keeping existing contract functionality */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
                      Contractbeheer
                    </h4>
                    <Button
                      onClick={() => {
                        window.open(
                          `/dashboard/contracts?userId=${employee.id}&userName=${employee.name}`,
                          "_blank"
                        );
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      📄 Nieuw Contract
                    </Button>
                  </div>

                  {/* Existing contracts display */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      💡 <strong>Contractbeheer:</strong> Klik op "Nieuw
                      Contract" om contracten aan te maken en te beheren voor
                      deze medewerker.
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      Contractoverzicht en -beheer wordt geopend in een nieuw
                      tabblad.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verlof & Aanwezigheid Tab */}
            {activeTab === "verlof-aanwezigheid" && (
              <div className="space-y-6">
                {/* Tab Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Verlof & Aanwezigheid Overzicht
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Verlofbalans, vakantie-opbouw en aanwezigheidsoverzicht
                      voor {employee.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedAccrualYear}
                      onChange={(e) => {
                        const year = parseInt(e.target.value);
                        setSelectedAccrualYear(year);
                        setSelectedLeaveYear(year);
                        fetchVacationAccrual(employee.id, year);
                        fetchLeaveBalance(employee.id, year);
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      {Array.from({ length: 3 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
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
                      onClick={() => {
                        calculateVacationAccrual(
                          employee.id,
                          selectedAccrualYear
                        );
                        fetchLeaveBalance(employee.id, selectedLeaveYear);
                      }}
                      disabled={vacationAccrualLoading || leaveBalanceLoading}
                      leftIcon={<CalculatorIcon className="h-4 w-4" />}
                    >
                      {vacationAccrualLoading || leaveBalanceLoading
                        ? "Berekenen..."
                        : "Herbereken"}
                    </Button>
                  </div>
                </div>

                {/* Three Section Layout: Vacation Accrual, Leave Balance, Attendance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Section 1: Vacation Accrual */}
                  <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                          <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
                          Vakantie-Opbouw
                        </h4>
                      </div>
                      <div className="p-4">
                        {vacationAccrualLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Berekenen...
                            </p>
                          </div>
                        ) : employee.employeeType === "FREELANCER" ? (
                          <div className="text-center py-8">
                            <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Freelancers bouwen geen vakantie-uren op
                            </p>
                          </div>
                        ) : vacationAccrualData ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Contract Uren
                                </p>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                  {vacationAccrualData.contractHoursPerWeek}u
                                </p>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Gewerkt YTD
                                </p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                  {vacationAccrualData.hoursWorkedYTD?.toFixed(
                                    1
                                  )}
                                  u
                                </p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                  Opgebouwd
                                </p>
                                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                  {vacationAccrualData.vacationHoursAccrued?.toFixed(
                                    1
                                  )}
                                  u
                                </p>
                              </div>
                              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                  Per Uur
                                </p>
                                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                  {(
                                    (vacationAccrualData.accrualPerHour || 0) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAccrualDetailsModal(true)}
                              className="w-full"
                              leftIcon={
                                <DocumentChartBarIcon className="h-4 w-4" />
                              }
                            >
                              Maandelijks Detail
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Geen data beschikbaar
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Leave Balance */}
                  <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                          <CalendarDaysIcon className="h-5 w-5 mr-2 text-green-500" />
                          Verlofbalans {selectedLeaveYear}
                        </h4>
                      </div>
                      <div className="p-4">
                        {leaveBalanceLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Laden...
                            </p>
                          </div>
                        ) : leaveBalance ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <span className="text-sm text-green-600 dark:text-green-400">
                                  Vakantiedagen Totaal
                                </span>
                                <span className="font-medium text-green-700 dark:text-green-300">
                                  {leaveBalance.vacationDaysTotal}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                  Gebruikt
                                </span>
                                <span className="font-medium text-blue-700 dark:text-blue-300">
                                  {leaveBalance.vacationDaysUsed}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <span className="text-sm text-purple-600 dark:text-purple-400">
                                  Resterend
                                </span>
                                <span className="font-medium text-purple-700 dark:text-purple-300">
                                  {leaveBalance.vacationDaysTotal -
                                    leaveBalance.vacationDaysUsed}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <span className="text-sm text-red-600 dark:text-red-400">
                                  Ziektedagen (Reg.)
                                </span>
                                <span className="font-medium text-red-700 dark:text-red-300">
                                  {leaveBalance.sickDaysUsed}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLeaveBalanceModal(true)}
                              className="w-full"
                              leftIcon={
                                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                              }
                            >
                              Balans Aanpassen
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Geen verlofbalans gevonden
                            </p>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShowLeaveBalanceModal(true)}
                              className="mt-2"
                              leftIcon={
                                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                              }
                            >
                              Aanmaken
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Attendance Overview */}
                  <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                          <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-orange-500" />
                          Aanwezigheid
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Deze Maand
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {attendanceData.thisMonth?.totalHours?.toFixed(
                                1
                              ) || "0"}
                              u
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Deze Week
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {attendanceData.thisWeek?.totalHours?.toFixed(
                                1
                              ) || "0"}
                              u
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Compensatie Uren
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {compensationData.currentBalance?.toFixed(1) ||
                                "0"}
                              u
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/dashboard/time-tracking`, "_blank")
                            }
                            className="w-full"
                            leftIcon={<ClockIcon className="h-4 w-4" />}
                          >
                            Tijdregistratie
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      Gedetailleerd Overzicht
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recent Activity */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Recente Activiteit
                        </h5>
                        <div className="space-y-2">
                          {attendanceData.recentEntries
                            ?.slice(0, 5)
                            .map((entry: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {new Date(entry.date).toLocaleDateString(
                                    "nl-NL"
                                  )}
                                </span>
                                <span className="font-medium">
                                  {entry.hours?.toFixed(1)}u
                                </span>
                              </div>
                            ))}
                          {(!attendanceData.recentEntries ||
                            attendanceData.recentEntries.length === 0) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Geen recente tijdregistraties gevonden
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Leave Requests Status */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Verlofaanvragen Status
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                            <span className="text-green-600 dark:text-green-400">
                              Goedgekeurd
                            </span>
                            <span className="font-medium">-</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                            <span className="text-yellow-600 dark:text-yellow-400">
                              In Behandeling
                            </span>
                            <span className="font-medium">-</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            💡 Verlofaanvragen kunnen worden ingediend via het
                            verlofpanel
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={() =>
                      window.open("/dashboard/leave-requests/new", "_blank")
                    }
                    leftIcon={<CalendarDaysIcon className="h-4 w-4" />}
                  >
                    Verlof Aanvragen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open("/dashboard/time-tracking", "_blank")
                    }
                    leftIcon={<ClockIcon className="h-4 w-4" />}
                  >
                    Tijdregistratie
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowLeaveBalanceModal(true)}
                    leftIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
                  >
                    Balans Aanpassen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/personnel")}
            size="lg"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={compensationLoading}
            loading={compensationLoading}
            size="lg"
          >
            {compensationLoading ? "Opslaan..." : "Wijzigingen Opslaan"}
          </Button>
        </div>
      </form>

      {/* Work Pattern Assignment Modal */}
      <Modal
        isOpen={showWorkPatternModal}
        onClose={() => {
          console.log("Modal onClose triggered");
          setModalState(false, "Modal onClose");
          setSelectedPatternId("");
        }}
        title="🗓️ Werkpatroon Toekennen"
        description={`Ken een werkpatroon toe aan ${employee?.name} voor automatische rooster generatie`}
        size="lg"
      >
        <form onSubmit={handleAssignWorkPattern} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Moderne Werkpatroon Toewijzing
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Kies een werkpatroon dat de vaste werktijden per dag
                  definieert. Dit wordt gebruikt voor automatische rooster
                  generatie.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Werkpatroon
            </label>
            <select
              value={selectedPatternId}
              onChange={(e) => setSelectedPatternId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Selecteer een werkpatroon...</option>
              {workPatterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name}
                  {pattern.description && ` - ${pattern.description}`}
                </option>
              ))}
            </select>
            {workPatterns.length === 0 && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Geen actieve werkpatronen beschikbaar. Maak eerst werkpatronen
                aan in de admin sectie.
              </p>
            )}
          </div>

          {/* Preview selected work pattern */}
          {selectedPatternId && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Voorbeeld Werkpatroon
              </h4>
              {renderWorkPatternSchedule(
                workPatterns.find((p) => p.id === selectedPatternId)?.workDays
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Eventuele opmerkingen over dit werkpatroon..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("Cancel button clicked");
                setModalState(false, "Cancel button");
                setSelectedPatternId("");
              }}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedPatternId}
            >
              Werkpatroon Toekennen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Personnel Contract Management Modal */}
      {employee && (
        <PersonnelContractManagement
          userId={employee.id}
          userName={employee.name}
          userEmail={employee.email}
          isOpen={showPersonnelContractManagement}
          onClose={() => setShowPersonnelContractManagement(false)}
        />
      )}

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "info" })}
      />

      {/* Leave Balance Edit Modal */}
      <Modal
        isOpen={showLeaveBalanceModal}
        onClose={() => {
          setShowLeaveBalanceModal(false);
        }}
        title={`Verlof Saldo Bewerken - ${employee.name}`}
        description={`Beheer verlof saldo's voor ${employee.name} voor het jaar ${selectedLeaveYear}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Important Notice for Previous Year Balances */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Saldo's van Vorig Jaar & Overgedragen Balansen
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Bij het opzetten van CrewFlow kun je hier bestaande saldo's
                  invoeren van vorig jaar. Selecteer het juiste jaar hierboven
                  en vul de huidige balansen in inclusief overgedragen
                  vakantiedagen.
                </p>
              </div>
            </div>
          </div>

          {/* Year Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Jaar: {selectedLeaveYear}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Wijzig het jaar hierboven om saldo's voor andere jaren te
                beheren
              </p>
            </div>
          </div>

          {/* Vacation Days */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-4 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              Vakantiedagen {selectedLeaveYear}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Totaal toegekend (incl. overgedragen)"
                type="number"
                value={leaveBalanceForm.vacationDaysTotal}
                onChange={(e) =>
                  setLeaveBalanceForm({
                    ...leaveBalanceForm,
                    vacationDaysTotal: parseInt(e.target.value) || 0,
                  })
                }
                variant="outlined"
                inputSize="md"
                min="0"
                placeholder="Bijv. 25 nieuwe + 5 overgedragen = 30"
              />
              <Input
                label="Al gebruikt dit jaar"
                type="number"
                value={leaveBalanceForm.vacationDaysUsed}
                onChange={(e) =>
                  setLeaveBalanceForm({
                    ...leaveBalanceForm,
                    vacationDaysUsed: parseInt(e.target.value) || 0,
                  })
                }
                variant="outlined"
                inputSize="md"
                min="0"
                placeholder="Aantal al opgenomen dagen"
              />
            </div>
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-800 rounded-lg">
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>Resterend beschikbaar:</strong>{" "}
                {Math.max(
                  0,
                  leaveBalanceForm.vacationDaysTotal -
                    leaveBalanceForm.vacationDaysUsed
                )}{" "}
                dagen
              </div>
            </div>
          </div>

          {/* Sick Days */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Ziektedagen
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Gebruikt dit jaar"
                type="number"
                value={leaveBalanceForm.sickDaysUsed}
                onChange={(e) =>
                  setLeaveBalanceForm({
                    ...leaveBalanceForm,
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
                value={leaveBalanceForm.specialLeaveUsed}
                onChange={(e) =>
                  setLeaveBalanceForm({
                    ...leaveBalanceForm,
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
                value={leaveBalanceForm.compensationHours}
                onChange={(e) =>
                  setLeaveBalanceForm({
                    ...leaveBalanceForm,
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
                value={leaveBalanceForm.compensationUsed}
                onChange={(e) =>
                  setLeaveBalanceForm({
                    ...leaveBalanceForm,
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
                leaveBalanceForm.compensationHours -
                  leaveBalanceForm.compensationUsed
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Notities
            </label>
            <textarea
              value={leaveBalanceForm.notes}
              onChange={(e) =>
                setLeaveBalanceForm({
                  ...leaveBalanceForm,
                  notes: e.target.value,
                })
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
              onClick={() => setShowLeaveBalanceModal(false)}
              disabled={leaveBalanceLoading}
            >
              Annuleren
            </Button>
            <Button
              variant="primary"
              onClick={updateLeaveBalance}
              disabled={leaveBalanceLoading}
              loading={leaveBalanceLoading}
            >
              {leaveBalanceLoading ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
