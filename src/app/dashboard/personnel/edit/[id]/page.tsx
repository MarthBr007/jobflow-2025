"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  UserGroupIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  HomeIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ContractViewer from "@/components/ui/ContractViewer";
import FreelanceContractGenerator from "@/components/ui/FreelanceContractGenerator";
import EmployeeContractGenerator from "@/components/ui/EmployeeContractGenerator";
import QuickContractGenerator from "@/components/ui/QuickContractGenerator";

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
}

interface WorkType {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  isActive: boolean;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  shifts: Array<{
    id: string;
    role: string;
    startTime: string;
    endTime: string;
    breaks?: any[];
  }>;
}

interface ScheduleAssignment {
  id: string;
  userId: string;
  templateId: string;
  dayOfWeek: number;
  isActive: boolean;
  customStartTime?: string;
  customEndTime?: string;
  notes?: string;
  template: ScheduleTemplate;
}

export default function EditEmployeeTabs() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("algemeen");

  const [scheduleTemplates, setScheduleTemplates] = useState<
    ScheduleTemplate[]
  >([]);
  const [scheduleAssignments, setScheduleAssignments] = useState<
    ScheduleAssignment[]
  >([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [customStartTime, setCustomStartTime] = useState<string>("");
  const [customEndTime, setCustomEndTime] = useState<string>("");
  const [useCustomTimes, setUseCustomTimes] = useState<boolean>(false);
  const [assignmentNotes, setAssignmentNotes] = useState<string>("");
  const [showContractManagement, setShowContractManagement] = useState(false);
  const [showFreelanceContractGenerator, setShowFreelanceContractGenerator] =
    useState(false);
  const [showEmployeeContractGenerator, setShowEmployeeContractGenerator] =
    useState(false);
  const [showQuickContractGenerator, setShowQuickContractGenerator] =
    useState(false);
  const [showContractViewer, setShowContractViewer] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchEmployee(params.id as string);
      fetchWorkTypes();
      fetchScheduleTemplates();
      fetchScheduleAssignments(params.id as string);
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

  const fetchScheduleTemplates = async () => {
    try {
      const response = await fetch("/api/schedule-templates?active=true");
      const data = await response.json();
      if (response.ok) {
        setScheduleTemplates(data);
      } else {
        console.error("Error fetching schedule templates:", data.error);
      }
    } catch (error) {
      console.error("Error fetching schedule templates:", error);
    }
  };

  const fetchScheduleAssignments = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/user-schedule-assignments?userId=${userId}`
      );
      const data = await response.json();
      if (response.ok) {
        setScheduleAssignments(data);
      } else {
        console.error("Error fetching schedule assignments:", data.error);
      }
    } catch (error) {
      console.error("Error fetching schedule assignments:", error);
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

  const handleRemoveScheduleAssignment = async (assignmentId: string) => {
    if (
      !confirm("Weet je zeker dat je deze rooster toewijzing wilt verwijderen?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/user-schedule-assignments/${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh the assignments
        if (employee?.id) {
          fetchScheduleAssignments(employee.id);
        }
      } else {
        const data = await response.json();
        console.error("Error removing schedule assignment:", data.error);
        alert(`Fout bij verwijderen: ${data.error}`);
      }
    } catch (error) {
      console.error("Error removing schedule assignment:", error);
      alert("Er is een fout opgetreden bij het verwijderen");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setSaving(true);
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
        alert(`Er is een fout opgetreden bij het opslaan: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Er is een fout opgetreden bij het opslaan");
    } finally {
      setSaving(false);
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
  ];

  return (
    <div className="space-y-6">
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
                    onClick={() => setActiveTab(tab.id)}
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
                          <option value="ADMIN">Administrator</option>
                          <option value="MANAGER">Manager</option>
                          <option value="EMPLOYEE">Medewerker</option>
                          <option value="FREELANCER">Freelancer</option>
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
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Beschikbare dagen
                  </h3>
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
                      const isChecked = availableDays.includes(day.short);

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
                                : currentDays.filter((d) => d !== day.short);
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

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Werkzaamheden
                  </h3>
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
                              const updatedWorkTypes = e.target.checked
                                ? [...(employee.workTypes || []), workType.name]
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
                                <span className="mr-2">{workType.emoji}</span>
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
                </div>

                {/* Werkrooster Sectie */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Werkrooster
                    </h3>
                    {(employee.employeeType === "PERMANENT" ||
                      employee.employeeType === "FLEX_WORKER") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssignmentModal(true)}
                        leftIcon={<PlusIcon className="h-4 w-4" />}
                      >
                        Rooster Toekennen
                      </Button>
                    )}
                  </div>

                  {employee.employeeType === "FREELANCER" ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CalendarDaysIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 Voor freelancers wordt het werkrooster bepaald op
                            basis van hun beschikbaarheid en
                            projecttoewijzingen.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : scheduleAssignments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Geen werkrooster toegekend
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {employee.employeeType === "FLEX_WORKER"
                          ? "Voor oproepkrachten wordt het rooster bepaald op basis van beschikbaarheid wanneer er geen vast rooster is toegekend."
                          : "Ken een werkrooster toe om de werkdagen en tijden vast te leggen."}
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setShowAssignmentModal(true)}
                        leftIcon={<PlusIcon className="h-4 w-4" />}
                      >
                        Eerste Rooster Toekennen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduleAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {assignment.template.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getDayName(assignment.dayOfWeek)} -{" "}
                                  {assignment.template.category}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  assignment.isActive
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {assignment.isActive ? "Actief" : "Inactief"}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRemoveScheduleAssignment(assignment.id)
                                }
                                leftIcon={<TrashIcon className="h-3 w-3" />}
                              >
                                Verwijderen
                              </Button>
                            </div>
                          </div>

                          {assignment.template.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {assignment.template.description}
                            </p>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Starttijd:
                              </span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {assignment.customStartTime ||
                                  assignment.template.shifts[0]?.startTime ||
                                  "Niet ingesteld"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Eindtijd:
                              </span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {assignment.customEndTime ||
                                  assignment.template.shifts[0]?.endTime ||
                                  "Niet ingesteld"}
                              </span>
                            </div>
                          </div>

                          {assignment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-md">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <strong>Notities:</strong> {assignment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                                    setShowFreelanceContractGenerator(true)
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
                                    setShowQuickContractGenerator(true)
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
                                  setShowEmployeeContractGenerator(true)
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
                                  setShowQuickContractGenerator(true)
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
                                setShowQuickContractGenerator(true)
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
                                setShowFreelanceContractGenerator(true)
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
                            Contractbeheer
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Beheer bestaande contracten, upload documenten en
                            track handtekeningen
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="md"
                            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                            onClick={() => setShowContractViewer(true)}
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
                                setShowQuickContractGenerator(true)
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
                                setShowEmployeeContractGenerator(true)
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
                            Contractbeheer
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Beheer bestaande contracten, upload documenten en
                            track handtekeningen
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="md"
                            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                            onClick={() => setShowContractViewer(true)}
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
            disabled={saving}
            loading={saving}
            size="lg"
          >
            {saving ? "Opslaan..." : "Wijzigingen Opslaan"}
          </Button>
        </div>
      </form>

      {/* Contract Management Modal */}
      {employee && (
        <ContractViewer
          userId={employee.id}
          userName={employee.name}
          isOpen={showContractViewer}
          onClose={() => setShowContractViewer(false)}
        />
      )}

      {/* Freelance Contract Generator Modal */}
      {employee && employee.employeeType === "FREELANCER" && (
        <FreelanceContractGenerator
          isOpen={showFreelanceContractGenerator}
          onClose={() => setShowFreelanceContractGenerator(false)}
          employeeData={{
            name: employee.name,
            email: employee.email,
            kvkNumber: employee.kvkNumber,
            btwNumber: employee.btwNumber,
            address: employee.address,
          }}
          onContractGenerated={(contractData) => {
            console.log("Contract generated:", contractData);
            // Here you could save the contract data to your database
          }}
        />
      )}

      {/* Employee Contract Generator Modal */}
      {employee &&
        (employee.employeeType === "PERMANENT" ||
          employee.employeeType === "FLEX_WORKER") && (
          <EmployeeContractGenerator
            isOpen={showEmployeeContractGenerator}
            onClose={() => setShowEmployeeContractGenerator(false)}
            employeeData={{
              name: employee.name,
              email: employee.email,
              address: employee.address,
              monthlySalary: employee.monthlySalary,
              hourlyWage: employee.hourlyWage,
              employeeType: employee.employeeType,
            }}
            onContractGenerated={(contractData) => {
              console.log("Contract generated:", contractData);
              // Here you could save the contract data to your database
            }}
          />
        )}

      {/* Quick Contract Generator Modal */}
      {employee && (
        <QuickContractGenerator
          isOpen={showQuickContractGenerator}
          onClose={() => setShowQuickContractGenerator(false)}
          employeeData={{
            name: employee.name,
            email: employee.email,
            address: employee.address,
            employeeType: employee.employeeType,
            monthlySalary: employee.monthlySalary,
            hourlyWage: employee.hourlyWage,
            kvkNumber: employee.kvkNumber,
            btwNumber: employee.btwNumber,
          }}
          onContractGenerated={(contractData) => {
            console.log("Quick contract generated:", contractData);
            // Here you could save the contract data to your database
          }}
        />
      )}

      {/* Schedule Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
          setSelectedTemplate("");
          setSelectedDays([]);
          setCustomStartTime("");
          setCustomEndTime("");
          setUseCustomTimes(false);
          setAssignmentNotes("");
        }}
        title="Werkrooster Toekennen"
        description="Ken een werkrooster template toe aan deze medewerker"
        size="lg"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedTemplate || selectedDays.length === 0) {
              alert("Selecteer een template en minimaal één dag");
              return;
            }

            try {
              const assignments = selectedDays.map((dayOfWeek) => ({
                userId: employee?.id,
                templateId: selectedTemplate,
                dayOfWeek,
                isActive: true,
                customStartTime: useCustomTimes ? customStartTime : null,
                customEndTime: useCustomTimes ? customEndTime : null,
                notes: assignmentNotes || null,
              }));

              for (const assignment of assignments) {
                const response = await fetch("/api/user-schedule-assignments", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(assignment),
                });

                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || "Fout bij toekennen rooster");
                }
              }

              // Refresh assignments and close modal
              if (employee?.id) {
                fetchScheduleAssignments(employee.id);
              }
              setShowAssignmentModal(false);
              setSelectedTemplate("");
              setSelectedDays([]);
              setCustomStartTime("");
              setCustomEndTime("");
              setUseCustomTimes(false);
              setAssignmentNotes("");
            } catch (error) {
              console.error("Error assigning schedule:", error);
              alert(`Fout bij toekennen rooster: ${error}`);
            }
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rooster Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Selecteer een template...</option>
              {scheduleTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Werkdagen
            </label>
            <div className="grid grid-cols-7 gap-2">
              {[
                { value: 1, label: "Ma" },
                { value: 2, label: "Di" },
                { value: 3, label: "Wo" },
                { value: 4, label: "Do" },
                { value: 5, label: "Vr" },
                { value: 6, label: "Za" },
                { value: 0, label: "Zo" },
              ].map((day) => (
                <label
                  key={day.value}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedDays.includes(day.value)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDays([...selectedDays, day.value]);
                      } else {
                        setSelectedDays(
                          selectedDays.filter((d) => d !== day.value)
                        );
                      }
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {day.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={useCustomTimes}
                onChange={(e) => setUseCustomTimes(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Aangepaste tijden gebruiken
              </span>
            </label>

            {useCustomTimes && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Starttijd
                  </label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Eindtijd
                  </label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Eventuele opmerkingen over dit rooster..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAssignmentModal(false);
                setSelectedTemplate("");
                setSelectedDays([]);
                setCustomStartTime("");
                setCustomEndTime("");
                setUseCustomTimes(false);
                setAssignmentNotes("");
              }}
            >
              Annuleren
            </Button>
            <Button type="submit" variant="primary">
              Rooster Toekennen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
