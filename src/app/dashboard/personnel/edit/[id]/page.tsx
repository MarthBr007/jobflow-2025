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
  email: string;
  role: string;
  employeeType?: string;
  status: "active" | "inactive";
  company: string;
  phone?: string;
  address?: string;
  bsnNumber?: string;
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
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const { ConfirmModal, confirm } = useConfirm();

  // Existing state
  const [employee, setEmployee] = useState<Employee>({
    id: "",
    name: "",
    email: "",
    role: "EMPLOYEE",
    status: "active",
    company: "",
  });

  const [activeTab, setActiveTab] = useState("algemeen");
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

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" as "success" | "error" | "info",
  });

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
    try {
      if (params?.id) {
        fetchEmployee(params.id as string);
        fetchWorkTypes();
        fetchWorkPatterns();
        fetchWorkPatternAssignments(params.id as string);
      }
    } catch (error) {
      handleError(error, "useEffect initialization");
    }
  }, [params?.id]);

  const fetchEmployee = async (id: string) => {
    try {
      const response = await fetch("/api/personnel");
      const data = await response.json();
      if (response.ok) {
        const foundEmployee = data.find((emp: Employee) => emp.id === id);
        if (foundEmployee) {
          setEmployee(foundEmployee);
        } else {
          router.push("/dashboard/personnel");
        }
      } else {
        console.error("Error fetching employee:", data.error);
        router.push("/dashboard/personnel");
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      router.push("/dashboard/personnel");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch("/api/work-types");
      const data = await response.json();
      if (response.ok) {
        setWorkTypes(data.filter((wt: WorkType) => wt.isActive));
      } else {
        console.error("Error fetching work types:", data.error);
      }
    } catch (error) {
      console.error("Error fetching work types:", error);
    }
  };

  const fetchWorkPatterns = async () => {
    try {
      const response = await fetch("/api/work-patterns");
      const data = await response.json();
      if (response.ok) {
        setWorkPatterns(data.filter((wp: WorkPattern) => wp.isActive));
      } else {
        console.error("Error fetching work patterns:", data.error);
      }
    } catch (error) {
      console.error("Error fetching work patterns:", error);
    }
  };

  const fetchWorkPatternAssignments = async (userId: string) => {
    try {
      console.log(`Fetching work pattern assignments for user: ${userId}`);
      const response = await fetch(`/api/personnel/${userId}/work-patterns`);

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();

      console.log("Raw API response:", data);

      if (response.ok) {
        // Map the response to match our interface
        const validAssignments = (data.currentAssignments || [])
          .map((assignment: any) => ({
            ...assignment,
            workPattern: assignment.pattern, // Map pattern to workPattern for consistency
          }))
          .filter((assignment: any) => {
            try {
              console.log("Processing assignment:", assignment);
              // Check if workDays exists and is valid
              if (assignment.workPattern && assignment.workPattern.workDays) {
                console.log("WorkDays found:", assignment.workPattern.workDays);
                return Array.isArray(assignment.workPattern.workDays);
              }
              return true;
            } catch (assignmentError) {
              console.error("Error processing assignment:", assignmentError);
              return false;
            }
          });

        console.log("Valid assignments count:", validAssignments.length);
        setWorkPatternAssignments(validAssignments);
        console.log("Successfully set work pattern assignments");
        return;
      } else {
        console.error("API response not ok:", data);
        throw new Error(data.error || "Failed to fetch work patterns");
      }
    } catch (error) {
      console.error("Error in fetchWorkPatternAssignments:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setToast({
        show: true,
        message: `Error loading work patterns: ${errorMessage}`,
        type: "error",
      });
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

      // Load attendance and compensation data when switching to aanwezigheid tab
      if (tabId === "aanwezigheid" && employee) {
        console.log(
          "Loading attendance and compensation data for aanwezigheid tab"
        );
        fetchAttendanceData(employee.id);
        fetchCompensationData(employee.id);
        fetchLeaveBalance(employee.id, selectedLeaveYear);
      }
    } catch (error) {
      console.error("Error in handleTabChange:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setToast({
        show: true,
        message: `Error switching tabs: ${errorMessage}`,
        type: "error",
      });
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
  const fetchLeaveBalance = async (
    userId: string,
    year: number = new Date().getFullYear()
  ) => {
    try {
      setLeaveBalanceLoading(true);
      const response = await fetch(`/api/admin/leave-balances?year=${year}`);
      const data = await response.json();

      if (data.success) {
        // Find the employee's balance from the returned data
        const employeeBalance = data.data.employees.find(
          (emp: any) => emp.id === userId
        );
        if (employeeBalance) {
          setLeaveBalance(employeeBalance.leaveBalance);
          setLeaveBalanceForm({
            vacationDaysTotal: employeeBalance.leaveBalance.vacationDaysTotal,
            vacationDaysUsed: employeeBalance.leaveBalance.vacationDaysUsed,
            sickDaysUsed: employeeBalance.leaveBalance.sickDaysUsed,
            compensationHours: employeeBalance.leaveBalance.compensationHours,
            compensationUsed: employeeBalance.leaveBalance.compensationUsed,
            specialLeaveUsed: employeeBalance.leaveBalance.specialLeaveUsed,
            notes: employeeBalance.leaveBalance.notes || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      showToast("Fout bij ophalen verlof saldo", "error");
    } finally {
      setLeaveBalanceLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">
          Medewerker niet gevonden
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "algemeen",
      name: "Algemeen",
      icon: UserGroupIcon,
      description: "Basis- en contactgegevens",
    },
    {
      id: "werk",
      name: "Werk",
      icon: CalendarDaysIcon,
      description: "Werkzaamheden en roosters",
    },
    {
      id: "financieel",
      name: "Financieel",
      icon: CurrencyEuroIcon,
      description: "Salaris en bedrijfsgegevens",
    },
    {
      id: "contracten",
      name: "Contracten",
      icon: DocumentTextIcon,
      description: "Contractbeheer",
    },
    {
      id: "aanwezigheid",
      name: "Aan- en Afwezigheid",
      icon: ClipboardDocumentCheckIcon,
      description: "Aanwezigheid, verlof en compensatie overzicht",
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
            {/* Algemeen Tab */}
            {activeTab === "algemeen" && (
              <div className="space-y-8">
                {/* Basisinformatie */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Basisinformatie
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Input
                        label="Volledige Naam"
                        value={employee.name}
                        onChange={(e) =>
                          setEmployee({ ...employee, name: e.target.value })
                        }
                        leftIcon={<UserGroupIcon className="h-5 w-5" />}
                        variant="outlined"
                        inputSize="md"
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={employee.email}
                        onChange={(e) =>
                          setEmployee({ ...employee, email: e.target.value })
                        }
                        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                        variant="outlined"
                        inputSize="md"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Rol
                        </label>
                        <select
                          id="role"
                          value={employee.role}
                          onChange={(e) =>
                            setEmployee({ ...employee, role: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        <label
                          htmlFor="employeeType"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Type Medewerker
                        </label>
                        <select
                          id="employeeType"
                          value={employee.employeeType || "PERMANENT"}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              employeeType: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="PERMANENT">Vaste Medewerker</option>
                          <option value="FREELANCER">Freelancer</option>
                          <option value="FLEX_WORKER">Oproepkracht</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Bedrijf
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <select
                          id="company"
                          value={employee.company}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              company: e.target.value,
                            })
                          }
                          className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

                {/* Contactgegevens */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Contactgegevens
                  </h3>
                  <div className="space-y-6">
                    <Input
                      label="Telefoonnummer"
                      type="tel"
                      value={employee.phone || ""}
                      onChange={(e) =>
                        setEmployee({ ...employee, phone: e.target.value })
                      }
                      leftIcon={<PhoneIcon className="h-5 w-5" />}
                      variant="outlined"
                      inputSize="md"
                      placeholder="+31 6 12345678"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Woonadres
                      </label>
                      <div className="space-y-4">
                        <Input
                          label="Straat en huisnummer"
                          value={employee.address?.split(",")[0]?.trim() || ""}
                          onChange={(e) => {
                            const addressParts = employee.address?.split(
                              ","
                            ) || ["", "", ""];
                            const newAddress = [
                              e.target.value,
                              addressParts[1]?.trim() || "",
                              addressParts[2]?.trim() || "",
                            ]
                              .filter((part) => part)
                              .join(", ");
                            setEmployee({ ...employee, address: newAddress });
                          }}
                          leftIcon={<HomeIcon className="h-5 w-5" />}
                          variant="outlined"
                          inputSize="md"
                          placeholder="Hoofdstraat 123"
                        />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="Postcode"
                            value={
                              employee.address?.split(",")[1]?.trim() || ""
                            }
                            onChange={(e) => {
                              const addressParts = employee.address?.split(
                                ","
                              ) || ["", "", ""];
                              const newAddress = [
                                addressParts[0]?.trim() || "",
                                e.target.value,
                                addressParts[2]?.trim() || "",
                              ]
                                .filter((part) => part)
                                .join(", ");
                              setEmployee({ ...employee, address: newAddress });
                            }}
                            variant="outlined"
                            inputSize="md"
                            placeholder="1234AB"
                          />
                          <Input
                            label="Plaats"
                            value={
                              employee.address?.split(",")[2]?.trim() || ""
                            }
                            onChange={(e) => {
                              const addressParts = employee.address?.split(
                                ","
                              ) || ["", "", ""];
                              const newAddress = [
                                addressParts[0]?.trim() || "",
                                addressParts[1]?.trim() || "",
                                e.target.value,
                              ]
                                .filter((part) => part)
                                .join(", ");
                              setEmployee({ ...employee, address: newAddress });
                            }}
                            variant="outlined"
                            inputSize="md"
                            placeholder="Amsterdam"
                          />
                        </div>
                      </div>
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

            {/* Financieel Tab */}
            {activeTab === "financieel" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Financiële gegevens
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {employee.employeeType === "FREELANCER" ? (
                        <Input
                          label="Uurtarief (€)"
                          type="number"
                          step="0.01"
                          value={employee.hourlyRate || ""}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              hourlyRate: e.target.value,
                            })
                          }
                          leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                          variant="outlined"
                          inputSize="md"
                          placeholder="25.00"
                          helperText="Uurtarief in euro's voor freelance werk"
                        />
                      ) : employee.employeeType === "FLEX_WORKER" ? (
                        <Input
                          label="Bruto Uurloon (€)"
                          type="number"
                          step="0.01"
                          value={employee.hourlyWage || ""}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              hourlyWage: e.target.value,
                            })
                          }
                          leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                          variant="outlined"
                          inputSize="md"
                          placeholder="15.50"
                          helperText="Bruto uurloon in euro's voor oproepkrachten"
                        />
                      ) : (
                        <Input
                          label="Bruto Maandloon (€)"
                          type="number"
                          step="0.01"
                          value={employee.monthlySalary || ""}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              monthlySalary: e.target.value,
                            })
                          }
                          leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                          variant="outlined"
                          inputSize="md"
                          placeholder="3500.00"
                          helperText="Bruto maandloon in euro's voor vaste medewerkers"
                        />
                      )}
                      <Input
                        label="IBAN"
                        value={employee.iban || ""}
                        onChange={(e) =>
                          setEmployee({ ...employee, iban: e.target.value })
                        }
                        leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                        variant="outlined"
                        inputSize="md"
                        placeholder="NL91ABNA0417164300"
                        helperText="Bankrekeningnummer voor uitbetalingen"
                      />

                      {/* BSN nummer voor vaste medewerkers, parttimers en oproepkrachten */}
                      {employee.employeeType !== "FREELANCER" && (
                        <Input
                          label="BSN Nummer"
                          value={employee.bsnNumber || ""}
                          onChange={(e) =>
                            setEmployee({
                              ...employee,
                              bsnNumber: e.target.value,
                            })
                          }
                          leftIcon={<UserIcon className="h-5 w-5" />}
                          variant="outlined"
                          inputSize="md"
                          placeholder="123456789"
                          helperText="Burgerservicenummer (verplicht voor werknemers)"
                        />
                      )}
                    </div>

                    {/* Bedrijfsgegevens voor freelancers */}
                    {employee.employeeType === "FREELANCER" && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                          Bedrijfsgegevens
                        </h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <Input
                            label="KVK Nummer"
                            value={employee.kvkNumber || ""}
                            onChange={(e) =>
                              setEmployee({
                                ...employee,
                                kvkNumber: e.target.value,
                              })
                            }
                            variant="outlined"
                            inputSize="md"
                            placeholder="12345678"
                          />
                          <Input
                            label="BTW Nummer"
                            value={employee.btwNumber || ""}
                            onChange={(e) =>
                              setEmployee({
                                ...employee,
                                btwNumber: e.target.value,
                              })
                            }
                            variant="outlined"
                            inputSize="md"
                            placeholder="NL123456789B01"
                          />
                        </div>

                        {/* Contract Status */}
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                Contract Status
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Wet DBA compliance status
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {employee.hasContract ? (
                                <>
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                  <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                                    Actief Contract
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                                  <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                    Geen Contract
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {!employee.hasContract && (
                            <div className="mt-3">
                              <div className="flex space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  leftIcon={
                                    <DocumentTextIcon className="h-4 w-4" />
                                  }
                                  onClick={() =>
                                    router.push(
                                      "/dashboard/contracts/freelance"
                                    )
                                  }
                                >
                                  Uitgebreid Contract
                                </Button>
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  leftIcon={
                                    <DocumentTextIcon className="h-4 w-4" />
                                  }
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/contracts?userId=${
                                        employee.id
                                      }&userName=${encodeURIComponent(
                                        employee.name
                                      )}&userEmail=${encodeURIComponent(
                                        employee.email
                                      )}&template=basic`
                                    )
                                  }
                                >
                                  Basis Template
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add contract status for non-freelancers */}
                    {employee.employeeType !== "FREELANCER" && (
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              Contract Status
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {employee.employeeType === "FLEX_WORKER"
                                ? "Oproepovereenkomst status"
                                : "Arbeidsovereenkomst status"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {employee.hasContract ? (
                              <>
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                                  Actief Contract
                                </span>
                              </>
                            ) : (
                              <>
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                                <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                  Geen Contract
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {!employee.hasContract && (
                          <div className="mt-3">
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                leftIcon={
                                  <DocumentTextIcon className="h-4 w-4" />
                                }
                                onClick={() =>
                                  router.push(
                                    `/dashboard/contracts?userId=${
                                      employee.id
                                    }&userName=${encodeURIComponent(
                                      employee.name
                                    )}&userEmail=${encodeURIComponent(
                                      employee.email
                                    )}&template=basic`
                                  )
                                }
                              >
                                {employee.employeeType === "FLEX_WORKER"
                                  ? "Uitgebreide Oproepovereenkomst"
                                  : "Uitgebreid Contract"}
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                leftIcon={
                                  <DocumentTextIcon className="h-4 w-4" />
                                }
                                onClick={() =>
                                  router.push(
                                    `/dashboard/contracts?userId=${
                                      employee.id
                                    }&userName=${encodeURIComponent(
                                      employee.name
                                    )}&userEmail=${encodeURIComponent(
                                      employee.email
                                    )}&template=advanced`
                                  )
                                }
                              >
                                Basis Template
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contracten Tab */}
            {activeTab === "contracten" && (
              <div className="space-y-8">
                {employee.employeeType === "FREELANCER" ? (
                  // Freelancer Contract Management
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-start space-x-4">
                        <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Wet DBA Compliance voor Freelancers
                          </h3>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                            Voor freelancers is het belangrijk om Wet
                            DBA-conforme overeenkomsten te hebben. JobFlow helpt
                            je automatisch compliant contracten genereren.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              ✓ Specifieke werkzaamheden
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              ✓ Onafhankelijkheid
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              ✓ Vervangingsmogelijkheid
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              ✓ Prestatiegerichte betaling
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Generate New Contract */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="text-center">
                          <DocumentTextIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Nieuwe Raamovereenkomst
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Genereer automatisch een Wet DBA-conforme freelance
                            overeenkomst
                          </p>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="md"
                              leftIcon={
                                <DocumentTextIcon className="h-4 w-4" />
                              }
                              onClick={() =>
                                router.push(
                                  `/dashboard/contracts?userId=${
                                    employee.id
                                  }&userName=${encodeURIComponent(
                                    employee.name
                                  )}&userEmail=${encodeURIComponent(
                                    employee.email
                                  )}&template=basic`
                                )
                              }
                              className="w-full"
                            >
                              Basis Template
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="md"
                              leftIcon={
                                <DocumentTextIcon className="h-4 w-4" />
                              }
                              onClick={() =>
                                router.push(
                                  `/dashboard/contracts?userId=${
                                    employee.id
                                  }&userName=${encodeURIComponent(
                                    employee.name
                                  )}&userEmail=${encodeURIComponent(
                                    employee.email
                                  )}&template=advanced`
                                )
                              }
                              className="w-full"
                            >
                              Uitgebreid Contract
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Manage Existing Contracts */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="text-center">
                          <CheckCircleIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Contractbeheer voor {employee.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Beheer alle contracten voor deze medewerker, upload
                            documenten en track handtekeningen
                          </p>
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                            onClick={() =>
                              setShowPersonnelContractManagement(true)
                            }
                            className="w-full"
                          >
                            Contracten Beheren
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Belangrijk voor Freelancers
                          </h4>
                          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                            Zorg ervoor dat alle freelance overeenkomsten
                            voldoen aan de Wet DBA om problemen met de
                            Belastingdienst te voorkomen. Gebruik altijd
                            project-specifieke contracten in plaats van algemene
                            overeenkomsten.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Employee Contract Management
                  <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-start space-x-4">
                        <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
                            {employee.employeeType === "FLEX_WORKER"
                              ? "Oproepovereenkomsten voor Flexwerkers"
                              : "Arbeidsovereenkomsten voor Medewerkers"}
                          </h3>
                          <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                            {employee.employeeType === "FLEX_WORKER"
                              ? "Voor flexwerkers genereer je oproepovereenkomsten conform artikel 7:628a BW. Deze bieden flexibiliteit en bescherming voor beide partijen."
                              : "Voor vaste medewerkers en oproepkrachten kun je standaard arbeidsovereenkomsten genereren die voldoen aan de Nederlandse arbeidsrechtgeving."}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {employee.employeeType === "FLEX_WORKER" ? (
                              <>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Artikel 7:628a BW
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Flexibele oproepen
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Recht op weigering
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Uurloon basis
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Nederlandse arbeidswetgeving
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Standaard arbeidsvoorwaarden
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  ✓ Proeftijd & opzegging
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Generate New Contract */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="text-center">
                          <DocumentTextIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            {employee.employeeType === "FLEX_WORKER"
                              ? "Nieuwe Oproepovereenkomst"
                              : "Nieuwe Arbeidsovereenkomst"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {employee.employeeType === "FLEX_WORKER"
                              ? "Genereer automatisch een professionele oproepovereenkomst conform artikel 7:628a BW"
                              : "Genereer automatisch een professionele arbeidsovereenkomst"}
                          </p>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="md"
                              leftIcon={
                                <DocumentTextIcon className="h-4 w-4" />
                              }
                              onClick={() =>
                                router.push(
                                  `/dashboard/contracts?userId=${
                                    employee.id
                                  }&userName=${encodeURIComponent(
                                    employee.name
                                  )}&userEmail=${encodeURIComponent(
                                    employee.email
                                  )}&template=basic`
                                )
                              }
                              className="w-full"
                            >
                              Basis Template
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="md"
                              leftIcon={
                                <DocumentTextIcon className="h-4 w-4" />
                              }
                              onClick={() =>
                                router.push(
                                  `/dashboard/contracts?userId=${
                                    employee.id
                                  }&userName=${encodeURIComponent(
                                    employee.name
                                  )}&userEmail=${encodeURIComponent(
                                    employee.email
                                  )}&template=advanced`
                                )
                              }
                              className="w-full"
                            >
                              {employee.employeeType === "FLEX_WORKER"
                                ? "Uitgebreide Oproepovereenkomst"
                                : "Uitgebreid Contract"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Manage Existing Contracts */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="text-center">
                          <CheckCircleIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Contractbeheer voor {employee.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Beheer alle contracten voor deze medewerker, upload
                            documenten en track handtekeningen
                          </p>
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                            onClick={() =>
                              setShowPersonnelContractManagement(true)
                            }
                            className="w-full"
                          >
                            Contracten Beheren
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-start space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {employee.employeeType === "FLEX_WORKER"
                              ? "Oproepkracht Contracten"
                              : "Vaste Medewerker Contracten"}
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            {employee.employeeType === "FLEX_WORKER"
                              ? "Voor oproepkrachten gelden specifieke regelingen omtrent oproepen, weigeringsrecht en minimale voorbereidingstijd conform artikel 7:628a BW."
                              : "Arbeidsovereenkomsten voor vaste medewerkers bevatten standaard arbeidsrechtelijke bescherming."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aanwezigheid Tab */}
            {activeTab === "aanwezigheid" && (
              <div className="space-y-6">
                {/* Tab Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Aan- en Afwezigheid Overzicht
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Bekijk aanwezigheid, werkuren, verlofgegevens en
                      compensatie uren van {employee.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedAttendancePeriod}
                      onChange={(e) => {
                        setSelectedAttendancePeriod(e.target.value);
                        fetchAttendanceData(employee.id);
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="current_week">Deze week</option>
                      <option value="current_month">Deze maand</option>
                      <option value="last_month">Vorige maand</option>
                      <option value="last_3_months">Laatste 3 maanden</option>
                      <option value="current_year">Dit jaar</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchAttendanceData(employee.id);
                        fetchCompensationData(employee.id);
                      }}
                      disabled={attendanceLoading || compensationLoading}
                    >
                      {attendanceLoading || compensationLoading
                        ? "Laden..."
                        : "Vernieuwen"}
                    </Button>
                  </div>
                </div>

                {attendanceLoading || compensationLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                      Gegevens laden...
                    </p>
                  </div>
                ) : attendanceData ? (
                  <>
                    {/* Current Status and Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Current Status */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                          <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Huidige Status
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getAttendanceStatusColor(
                                  attendanceData.currentStatus || "OFFLINE"
                                )}`}
                              >
                                {getAttendanceStatusText(
                                  attendanceData.currentStatus || "OFFLINE"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hours Today */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Vandaag
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatDuration(
                                attendanceData.workingHoursToday || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hours This Week */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                          <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Deze Week
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatDuration(
                                attendanceData.workingHoursWeek || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Absent Days */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Afwezig Dagen
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {attendanceData.absentDays || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Compensation Balance */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Tijd voor Tijd
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                (attendanceData.leaveBalance?.compensationTime
                                  ?.available || 0) > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {formatDuration(
                                attendanceData.leaveBalance?.compensationTime
                                  ?.available || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verlof Saldo Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Verlof Saldo & Balansen
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Overzicht van vakantiedagen, ziektedagen en
                              compensatie uren
                            </p>
                          </div>
                          {/* Admin Edit Button */}
                          {(session?.user?.role === "ADMIN" ||
                            session?.user?.role === "MANAGER") && (
                            <div className="flex items-center space-x-3">
                              <select
                                value={selectedLeaveYear}
                                onChange={(e) => {
                                  setSelectedLeaveYear(
                                    parseInt(e.target.value)
                                  );
                                  fetchLeaveBalance(
                                    employee.id,
                                    parseInt(e.target.value)
                                  );
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  fetchLeaveBalance(
                                    employee.id,
                                    selectedLeaveYear
                                  );
                                  setShowLeaveBalanceModal(true);
                                }}
                                disabled={leaveBalanceLoading}
                                leftIcon={<PencilIcon className="h-4 w-4" />}
                              >
                                Saldo Bewerken
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Vakantiedagen */}
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <CalendarDaysIcon className="h-6 w-6 text-green-600" />
                                <div>
                                  <h5 className="font-medium text-green-900 dark:text-green-100">
                                    Vakantiedagen
                                  </h5>
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    {new Date().getFullYear()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                  {attendanceData.leaveBalance?.vacationDays
                                    ?.remaining || 0}
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300">
                                  van{" "}
                                  {attendanceData.leaveBalance?.vacationDays
                                    ?.entitled || 25}{" "}
                                  dagen
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((attendanceData.leaveBalance
                                        ?.vacationDays?.remaining || 0) /
                                        (attendanceData.leaveBalance
                                          ?.vacationDays?.entitled || 25)) *
                                        100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-green-700 dark:text-green-300 mt-1">
                                <span>
                                  Gebruikt:{" "}
                                  {attendanceData.leaveBalance?.vacationDays
                                    ?.used || 0}
                                </span>
                                <span>
                                  Resterend:{" "}
                                  {attendanceData.leaveBalance?.vacationDays
                                    ?.remaining || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Ziektedagen */}
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                <div>
                                  <h5 className="font-medium text-red-900 dark:text-red-100">
                                    Ziektedagen
                                  </h5>
                                  <p className="text-sm text-red-700 dark:text-red-300">
                                    Dit jaar
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                  {attendanceData.leaveBalance?.sickDays
                                    ?.used || 0}
                                </div>
                                <div className="text-sm text-red-700 dark:text-red-300">
                                  dagen gebruikt
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Compensatie Tijd */}
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <ClockIcon className="h-6 w-6 text-purple-600" />
                                <div>
                                  <h5 className="font-medium text-purple-900 dark:text-purple-100">
                                    Compensatie Tijd
                                  </h5>
                                  <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Beschikbaar
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                                  {formatDuration(
                                    attendanceData.leaveBalance
                                      ?.compensationTime?.available || 0
                                  )}
                                </div>
                                <div className="text-sm text-purple-700 dark:text-purple-300">
                                  tijd voor tijd
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              <div className="flex justify-between">
                                <span>
                                  Gebruikt:{" "}
                                  {formatDuration(
                                    attendanceData.leaveBalance
                                      ?.compensationTime?.used || 0
                                  )}
                                </span>
                                <span>
                                  In behandeling:{" "}
                                  {formatDuration(
                                    attendanceData.leaveBalance
                                      ?.compensationTime?.pending || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin: Verlof Saldo Beheer - Only show for admins/managers */}
                    {(session?.user?.role === "ADMIN" ||
                      session?.user?.role === "MANAGER") && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                Verlof Saldo Beheer
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Bewerk verlof saldo&apos;s en balansen voor{" "}
                                {employee.name}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <select
                                value={selectedLeaveYear}
                                onChange={(e) => {
                                  setSelectedLeaveYear(
                                    parseInt(e.target.value)
                                  );
                                  fetchLeaveBalance(
                                    employee.id,
                                    parseInt(e.target.value)
                                  );
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  fetchLeaveBalance(
                                    employee.id,
                                    selectedLeaveYear
                                  );
                                  setShowLeaveBalanceModal(true);
                                }}
                                disabled={leaveBalanceLoading}
                                leftIcon={<PencilIcon className="h-4 w-4" />}
                              >
                                Saldo Bewerken
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          {leaveBalanceLoading ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="mt-2 text-gray-500 dark:text-gray-400">
                                Verlof saldo laden...
                              </p>
                            </div>
                          ) : leaveBalance ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <div className="text-center">
                                  <CalendarDaysIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {leaveBalance.vacationDaysRemaining}
                                  </div>
                                  <div className="text-sm text-green-700 dark:text-green-300">
                                    van {leaveBalance.vacationDaysTotal}{" "}
                                    vakantiedagen
                                  </div>
                                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {leaveBalance.vacationDaysUsed} gebruikt
                                  </div>
                                </div>
                              </div>
                              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                                <div className="text-center">
                                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                    {leaveBalance.sickDaysUsed}
                                  </div>
                                  <div className="text-sm text-red-700 dark:text-red-300">
                                    ziektedagen gebruikt
                                  </div>
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {leaveBalance.specialLeaveUsed} bijzonder
                                    verlof
                                  </div>
                                </div>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <div className="text-center">
                                  <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {formatDuration(
                                      leaveBalance.compensationHours -
                                        leaveBalance.compensationUsed
                                    )}
                                  </div>
                                  <div className="text-sm text-purple-700 dark:text-purple-300">
                                    compensatie tijd
                                  </div>
                                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                    {formatDuration(
                                      leaveBalance.compensationUsed
                                    )}{" "}
                                    gebruikt
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <CalendarDaysIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                Geen verlof saldo gevonden voor{" "}
                                {selectedLeaveYear}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowLeaveBalanceModal(true)}
                              >
                                Saldo Instellen
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Totalen per Periode */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Uren Overzicht per Periode
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Gewerkte uren, overwerk en compensatie per
                          tijdsperiode
                        </p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Deze Week */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                            <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                              Deze Week
                            </h6>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                  Reguliere uren:
                                </span>
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentWeek
                                      ?.regularHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                  Overwerk:
                                </span>
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentWeek
                                      ?.overtimeHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                  Compensatie:
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  +
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentWeek
                                      ?.compensationEarned || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Deze Maand */}
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <h6 className="font-medium text-green-900 dark:text-green-100 mb-3">
                              Deze Maand
                            </h6>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-green-700 dark:text-green-300">
                                  Reguliere uren:
                                </span>
                                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentMonth
                                      ?.regularHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-green-700 dark:text-green-300">
                                  Overwerk:
                                </span>
                                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentMonth
                                      ?.overtimeHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-green-700 dark:text-green-300">
                                  Compensatie:
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  +
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentMonth
                                      ?.compensationEarned || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Vorige Maand */}
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                            <h6 className="font-medium text-purple-900 dark:text-purple-100 mb-3">
                              Vorige Maand
                            </h6>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Reguliere uren:
                                </span>
                                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.lastMonth
                                      ?.regularHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Overwerk:
                                </span>
                                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.lastMonth
                                      ?.overtimeHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  Compensatie:
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  +
                                  {formatDuration(
                                    attendanceData.periodTotals?.lastMonth
                                      ?.compensationEarned || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Dit Jaar */}
                          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                            <h6 className="font-medium text-orange-900 dark:text-orange-100 mb-3">
                              Dit Jaar
                            </h6>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-orange-700 dark:text-orange-300">
                                  Reguliere uren:
                                </span>
                                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentYear
                                      ?.regularHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-orange-700 dark:text-orange-300">
                                  Overwerk:
                                </span>
                                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentYear
                                      ?.overtimeHours || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-orange-700 dark:text-orange-300">
                                  Compensatie:
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  +
                                  {formatDuration(
                                    attendanceData.periodTotals?.currentYear
                                      ?.compensationEarned || 0
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recente Tijdregistraties */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Recente Tijdregistraties
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Overzicht van recente in- en uitkloktijden
                        </p>
                      </div>
                      <div className="p-6">
                        {attendanceData.recentEntries &&
                        attendanceData.recentEntries.length > 0 ? (
                          <div className="space-y-3">
                            {attendanceData.recentEntries
                              .slice(0, 10)
                              .map((entry: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div
                                      className={`h-3 w-3 rounded-full ${
                                        entry.endTime
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                      }`}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(
                                          entry.date
                                        ).toLocaleDateString("nl-NL", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {entry.startTime}{" "}
                                        {entry.endTime
                                          ? `- ${entry.endTime}`
                                          : "(nog actief)"}
                                        {entry.isOvertime && (
                                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                            Overwerk
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {formatDuration(entry.totalHours || 0)}
                                    </p>
                                    {entry.workType && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {entry.workType}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Geen recente tijdregistraties
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verlofaanvragen */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Verlofaanvragen
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Overzicht van vakantie, ziekte en compensatie verlof
                        </p>
                      </div>
                      <div className="p-6">
                        {attendanceData.leaveRequests &&
                        attendanceData.leaveRequests.length > 0 ? (
                          <div className="space-y-3">
                            {attendanceData.leaveRequests.map(
                              (leave: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div
                                      className={`h-3 w-3 rounded-full ${
                                        leave.type === "VACATION"
                                          ? "bg-green-500"
                                          : leave.type === "SICK"
                                          ? "bg-red-500"
                                          : leave.type === "COMPENSATION"
                                          ? "bg-purple-500"
                                          : "bg-gray-500"
                                      }`}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {leave.type === "VACATION"
                                          ? "Vakantie"
                                          : leave.type === "SICK"
                                          ? "Ziekte"
                                          : leave.type === "COMPENSATION"
                                          ? "Compensatie verlof"
                                          : leave.type}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(
                                          leave.startDate
                                        ).toLocaleDateString("nl-NL")}
                                        {leave.endDate &&
                                          leave.endDate !== leave.startDate &&
                                          ` - ${new Date(
                                            leave.endDate
                                          ).toLocaleDateString("nl-NL")}`}
                                        {leave.reason && (
                                          <span className="ml-2 text-gray-400">
                                            • {leave.reason}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {leave.duration
                                        ? formatDuration(leave.duration)
                                        : "1 dag"}
                                    </p>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        leave.status === "APPROVED"
                                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                                          : leave.status === "PENDING"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
                                          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
                                      }`}
                                    >
                                      {leave.status === "APPROVED"
                                        ? "Goedgekeurd"
                                        : leave.status === "PENDING"
                                        ? "In behandeling"
                                        : "Afgewezen"}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <CalendarDaysIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Geen verlofaanvragen in deze periode
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Aanwezigheid en Verlof Beheer
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Beheer verlofaanvragen, pas verlof saldo&apos;s aan
                            en bekijk gedetailleerde rapporten voor{" "}
                            {employee.name.split(" ")[0]}
                          </p>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              fetchAttendanceData(employee.id);
                              fetchCompensationData(employee.id);
                            }}
                          >
                            Vernieuwen
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              window.open(`/dashboard/time-tracking`, "_blank")
                            }
                          >
                            Volledig Rapport
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Geen aanwezigheidsgegevens
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Er zijn nog geen aanwezigheidsgegevens beschikbaar voor
                      deze medewerker.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        fetchAttendanceData(employee.id);
                        fetchCompensationData(employee.id);
                      }}
                    >
                      Gegevens Laden
                    </Button>
                  </div>
                )}
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
