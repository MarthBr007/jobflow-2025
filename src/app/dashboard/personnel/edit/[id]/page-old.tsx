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
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ContractManagement from "@/components/ui/ContractManagement";

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

export default function EditEmployee() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [activeTab, setActiveTab] = useState<string>("algemeen");

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
      console.log("Fetched schedule templates:", data);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setSaving(true);
    try {
      // Ensure employeeType has a default value
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

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-indigo-100 text-indigo-800";
      case "freelancer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleText = (role: string) => {
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

  const handleAddScheduleAssignment = async () => {
    if (!selectedTemplate || selectedDays.length === 0 || !employee) {
      alert("Selecteer een template en minimaal één dag");
      return;
    }

    // Validate custom times if they are being used
    if (useCustomTimes && (!customStartTime || !customEndTime)) {
      alert("Vul zowel start- als eindtijd in bij aangepaste tijden");
      return;
    }

    try {
      for (const dayOfWeek of selectedDays) {
        const assignmentData: any = {
          userId: employee.id,
          templateId: selectedTemplate,
          dayOfWeek,
        };

        // Add custom times if specified
        if (useCustomTimes && customStartTime && customEndTime) {
          assignmentData.customStartTime = customStartTime + ":00";
          assignmentData.customEndTime = customEndTime + ":00";
        }

        // Add notes if provided
        if (assignmentNotes.trim()) {
          assignmentData.notes = assignmentNotes.trim();
        }

        const response = await fetch("/api/user-schedule-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignmentData),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("Error creating assignment:", data.error);
        }
      }

      // Refresh assignments
      await fetchScheduleAssignments(employee.id);

      // Reset modal state
      setShowAssignmentModal(false);
      setSelectedTemplate("");
      setSelectedDays([]);
      setCustomStartTime("");
      setCustomEndTime("");
      setUseCustomTimes(false);
      setAssignmentNotes("");
    } catch (error) {
      console.error("Error adding schedule assignment:", error);
      alert("Er is een fout opgetreden bij het toewijzen van het rooster");
    }
  };

  const handleRemoveScheduleAssignment = async (assignmentId: string) => {
    if (
      !confirm("Weet je zeker dat je deze rooster toewijzing wilt verwijderen?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/user-schedule-assignments?id=${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok && employee) {
        await fetchScheduleAssignments(employee.id);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error removing schedule assignment:", error);
      alert("Er is een fout opgetreden bij het verwijderen");
    }
  };

  const getDayName = (dayOfWeek: number) => {
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

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const createTestTemplate = async () => {
    try {
      const testTemplate = {
        name: "Standaard Werkdag",
        description: "Basis template voor normale werkdagen",
        category: "DAILY",
        shifts: [
          {
            role: "Algemeen Medewerker",
            startTime: "09:00:00",
            endTime: "17:00:00",
            breaks: [
              {
                startTime: "10:15",
                endTime: "10:30",
                type: "morning",
                duration: 15,
              },
              {
                startTime: "12:00",
                endTime: "12:30",
                type: "lunch",
                duration: 30,
              },
              {
                startTime: "15:00",
                endTime: "15:15",
                type: "afternoon",
                duration: 15,
              },
            ],
            totalBreakDuration: 60,
            minPersons: 1,
            requirements: [],
            notes: "",
          },
        ],
      };

      const response = await fetch("/api/schedule-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testTemplate),
      });

      if (response.ok) {
        // Refresh templates
        await fetchScheduleTemplates();
        alert("Test template succesvol aangemaakt!");
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating test template:", error);
      alert("Er is een fout opgetreden bij het aanmaken van de test template");
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

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Nav Tabs */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
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
              ].map((tab) => {
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

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
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
                            <option value="Broers Verhuur">
                              Broers Verhuur
                            </option>
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
                </div>

                {/* Contactgegevens */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Contactgegevens
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    </div>

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
                {/* Work Information */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Werkinformatie
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Selecteer beschikbare dagen en werkzaamheden
                    </p>
                  </div>
                  <div className="px-6 py-4 space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Beschikbare dagen
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Werkzaamheden
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Assignments */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                          <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600" />
                          Vaste Rooster Toewijzingen
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Wijs vaste roosters toe die automatisch worden
                          toegepast
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<PlusIcon className="h-4 w-4" />}
                        onClick={() => setShowAssignmentModal(true)}
                      >
                        Rooster Toewijzen
                      </Button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    {scheduleAssignments.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          Geen vaste roosters toegewezen
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Wijs een rooster template toe aan deze medewerker om
                          automatisch diensten te plannen.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scheduleAssignments
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {getDayName(assignment.dayOfWeek)} -{" "}
                                    {assignment.template.name}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    {assignment.customStartTime &&
                                    assignment.customEndTime ? (
                                      <div className="flex items-center">
                                        <ClockIcon className="h-4 w-4 mr-1" />
                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                                          {formatTime(
                                            assignment.customStartTime
                                          )}{" "}
                                          -{" "}
                                          {formatTime(assignment.customEndTime)}
                                        </span>
                                        <span className="ml-1 text-xs">
                                          (aangepast)
                                        </span>
                                      </div>
                                    ) : (
                                      assignment.template.shifts.length > 0 && (
                                        <div className="flex items-center">
                                          <ClockIcon className="h-4 w-4 mr-1" />
                                          {formatTime(
                                            assignment.template.shifts[0]
                                              .startTime
                                          )}{" "}
                                          -{" "}
                                          {formatTime(
                                            assignment.template.shifts[0]
                                              .endTime
                                          )}
                                        </div>
                                      )
                                    )}
                                    <div className="flex items-center">
                                      <UserGroupIcon className="h-4 w-4 mr-1" />
                                      {assignment.template.shifts.length}{" "}
                                      rol(len)
                                    </div>
                                  </div>
                                  {assignment.template.description && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {assignment.template.description}
                                    </p>
                                  )}
                                  {assignment.notes && (
                                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                      �� {assignment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
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
                                  leftIcon={<TrashIcon className="h-4 w-4" />}
                                  onClick={() =>
                                    handleRemoveScheduleAssignment(
                                      assignment.id
                                    )
                                  }
                                  className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                                >
                                  Verwijderen
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Financieel Tab */}
            {activeTab === "financieel" && (
              <div className="space-y-8">
                {/* Financial Information */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Financiële gegevens
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {employee.employeeType === "FREELANCER"
                        ? "Uurtarief en bankinformatie voor freelancers"
                        : employee.employeeType === "FLEX_WORKER"
                        ? "Bruto uurloon en bankinformatie voor oproepkrachten"
                        : "Brutoloon en bankinformatie voor medewerkers in dienst"}
                    </p>
                  </div>
                  <div className="px-6 py-4 space-y-6">
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

                    {/* Show cost calculation */}
                    {employee.employeeType === "FREELANCER" &&
                      employee.hourlyRate && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            💡 Kostenberekening per dag (8 uur)
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            €{(parseFloat(employee.hourlyRate) * 8).toFixed(2)}{" "}
                            per dag
                          </p>
                        </div>
                      )}

                    {employee.employeeType === "FLEX_WORKER" &&
                      employee.hourlyWage && (
                        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                          <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                            💡 Kostenberekening per dag (8 uur)
                          </h4>
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            €{(parseFloat(employee.hourlyWage) * 8).toFixed(2)}{" "}
                            per dag (bruto loon)
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Werkgeverslasten (ca. 25-30%) komen hier nog bovenop
                          </p>
                        </div>
                      )}

                    {employee.employeeType === "PERMANENT" &&
                      employee.monthlySalary && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            💡 Kostenberekening per dag (o.b.v. 22 werkdagen)
                          </h4>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            €
                            {(parseFloat(employee.monthlySalary) / 22).toFixed(
                              2
                            )}{" "}
                            per dag (alleen loon, excl. werkgeverslasten)
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Werkgeverslasten (ca. 25-30%) komen hier nog bovenop
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Contracten Tab */}
            {activeTab === "contracten" && (
              <div className="space-y-8">
                {/* Contracts Section */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          📄 Contractbeheer
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Beheer alle contracten voor deze medewerker
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                        onClick={() => setShowContractManagement(true)}
                      >
                        Contracten Beheren
                      </Button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Klik op "Contracten Beheren" om contracten voor{" "}
                        {employee?.name} te bekijken, toe te voegen of te
                        bewerken.
                      </p>
                      <div className="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                          <span>Contract toevoegen</span>
                        </div>
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-1 text-blue-500" />
                          <span>Bestanden uploaden</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1 text-orange-500" />
                          <span>Datums beheren</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
            disabled={saving}
            loading={saving}
            size="lg"
          >
            {saving ? "Opslaan..." : "Wijzigingen Opslaan"}
          </Button>
        </div>
      </form>

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
        title="Rooster Template Toewijzen"
        size="xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selecteer Rooster Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Kies een template...</option>
              {scheduleTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.category}
                  {template.shifts.length > 0 &&
                    ` (${formatTime(template.shifts[0].startTime)}-${formatTime(
                      template.shifts[0].endTime
                    )})`}
                </option>
              ))}
            </select>

            {scheduleTemplates.length === 0 && (
              <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  ⚠️ Geen rooster templates beschikbaar. Maak eerst een template
                  aan via
                  <strong> Dashboard → Admin → Rooster Templates</strong>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={createTestTemplate}
                  className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                >
                  Test Template Aanmaken
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selecteer Dagen van de Week
            </label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              {[
                { value: 1, label: "Maandag", short: "Ma" },
                { value: 2, label: "Dinsdag", short: "Di" },
                { value: 3, label: "Woensdag", short: "Wo" },
                { value: 4, label: "Donderdag", short: "Do" },
                { value: 5, label: "Vrijdag", short: "Vr" },
                { value: 6, label: "Zaterdag", short: "Za" },
                { value: 0, label: "Zondag", short: "Zo" },
              ].map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
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
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {day.short}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {day.label}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom Times Option */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Aangepaste Tijden
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useCustomTimes}
                  onChange={(e) => setUseCustomTimes(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Gebruik aangepaste tijden (voor parttimers)
                </span>
              </label>
            </div>

            {useCustomTimes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Tijd
                    </label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Eind Tijd
                    </label>
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Deze tijden overschrijven de template tijden voor deze
                  specifieke toewijzing.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Bijv. speciale afspraken, wijzigingen, etc..."
            />
          </div>

          {selectedTemplate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Template Preview
              </h4>
              {(() => {
                const template = scheduleTemplates.find(
                  (t) => t.id === selectedTemplate
                );
                if (!template) return null;

                return (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>{template.name}</strong>
                      {template.description && ` - ${template.description}`}
                    </p>
                    <div className="space-y-1">
                      {template.shifts.map((shift, index) => (
                        <div
                          key={index}
                          className="text-xs text-blue-700 dark:text-blue-300"
                        >
                          • {shift.role}:
                          {useCustomTimes &&
                          customStartTime &&
                          customEndTime ? (
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {" "}
                              {customStartTime} - {customEndTime} (aangepast)
                            </span>
                          ) : (
                            <span>
                              {" "}
                              {formatTime(shift.startTime)} -{" "}
                              {formatTime(shift.endTime)}
                            </span>
                          )}
                          {shift.breaks &&
                            shift.breaks.length > 0 &&
                            ` (${shift.breaks.length} pauze${
                              shift.breaks.length !== 1 ? "s" : ""
                            })`}
                        </div>
                      ))}
                    </div>
                    {useCustomTimes && (customStartTime || customEndTime) && (
                      <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/20 rounded text-xs text-orange-800 dark:text-orange-200">
                        ⚠️ Let op: Aangepaste tijden worden gebruikt in plaats
                        van template tijden
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
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
            <Button
              type="button"
              variant="primary"
              onClick={handleAddScheduleAssignment}
              disabled={
                !selectedTemplate ||
                selectedDays.length === 0 ||
                (useCustomTimes && (!customStartTime || !customEndTime))
              }
            >
              Toewijzen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contract Management Modal */}
      {employee && (
        <ContractManagement
          userId={employee.id}
          userName={employee.name}
          userEmail={employee.email}
          isOpen={showContractManagement}
          onClose={() => setShowContractManagement(false)}
        />
      )}
    </div>
  );
}
