"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  CheckIcon,
  UserIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { format, startOfWeek, addDays, isSameDay, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";

interface Availability {
  id: string;
  date: Date;
  status: "AVAILABLE" | "UNAVAILABLE" | "PARTIAL";
  hours?: number;
  notes?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  workTypes?: string[];
  skills?: string[];
}

// Dienst types voor filtering
const SERVICE_TYPES = [
  { value: "WASSTRAAT", label: "Wasstraat" },
  { value: "ORDERPICKER", label: "Orderpicker" },
  { value: "CHAUFFEUR", label: "Chauffeur" },
  { value: "OPBOUW", label: "Op- en Afbouw" },
  { value: "MONTAGE", label: "Montage" },
  { value: "SCHOONMAAK", label: "Schoonmaak" },
  { value: "ADMINISTRATIE", label: "Administratie" },
  { value: "TECHNIEK", label: "Techniek" },
];

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<
    "AVAILABLE" | "UNAVAILABLE" | "PARTIAL"
  >("AVAILABLE");
  const [hours, setHours] = useState<string>("8");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    company: "",
    serviceType: "",
  });

  // Check if user is admin or manager
  const isAdminOrManager =
    session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      if (isAdminOrManager) {
        fetchAllAvailability();
        fetchEmployees();
      } else {
        fetchAvailability();
      }
    }
  }, [session, isAdminOrManager]);

  useEffect(() => {
    filterEmployees();
  }, [employees, filters]);

  // Load existing availability when date changes
  useEffect(() => {
    if (!isAdminOrManager) {
      const existingAvailability = getAvailabilityForDate(selectedDate);
      if (existingAvailability) {
        setSelectedStatus(existingAvailability.status);
        setHours(existingAvailability.hours?.toString() || "8");
        setNotes(existingAvailability.notes || "");
      } else {
        // Reset form for new date
        setSelectedStatus("AVAILABLE");
        setHours("8");
        setNotes("");
      }
    }
  }, [selectedDate, availability, isAdminOrManager]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/availability");
      if (response.ok) {
        const data = await response.json();
        setAvailability(
          data.map((item: any) => ({
            ...item,
            date: new Date(item.date),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAvailability = async () => {
    try {
      const response = await fetch("/api/availability/all");
      if (response.ok) {
        const data = await response.json();
        setAvailability(
          data.map((item: any) => ({
            ...item,
            date: new Date(item.date),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching all availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/personnel");
      if (response.ok) {
        const data = await response.json();
        // Toon alle medewerkers behalve admins (tenzij je ook admins wilt zien)
        setEmployees(data.filter((emp: any) => emp.role !== "ADMIN"));
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          emp.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter((emp) => emp.role === filters.role);
    }

    // Company filter
    if (filters.company) {
      filtered = filtered.filter((emp) => emp.company === filters.company);
    }

    // Service type filter (based on work types or skills)
    if (filters.serviceType) {
      filtered = filtered.filter((emp) => {
        const workTypes = emp.workTypes || [];
        return workTypes.includes(filters.serviceType);
      });
    }

    setFilteredEmployees(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          status: selectedStatus,
          hours: selectedStatus === "PARTIAL" ? parseFloat(hours) : undefined,
          notes,
        }),
      });

      if (response.ok) {
        await fetchAvailability();
        // Don't reset form after successful update, keep current values
      }
    } catch (error) {
      console.error("Error saving availability:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const existingAvailability = getAvailabilityForDate(selectedDate);
    if (!existingAvailability) return;

    if (
      !confirm(
        `Weet je zeker dat je de beschikbaarheid voor ${format(
          selectedDate,
          "d MMMM yyyy",
          { locale: nl }
        )} wilt verwijderen?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/availability/${existingAvailability.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchAvailability();
        // Reset form after deletion
        setSelectedStatus("AVAILABLE");
        setHours("8");
        setNotes("");
      }
    } catch (error) {
      console.error("Error deleting availability:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getAvailabilityForDate = (date: Date) => {
    return availability.find((a) => isSameDay(new Date(a.date), date));
  };

  const getAvailabilityForEmployeeAndDate = (
    employeeId: string,
    date: Date
  ) => {
    return availability.find(
      (a) => a.user?.id === employeeId && isSameDay(new Date(a.date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500";
      case "UNAVAILABLE":
        return "bg-red-500";
      case "PARTIAL":
        return "bg-yellow-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Beschikbaar";
      case "UNAVAILABLE":
        return "Niet beschikbaar";
      case "PARTIAL":
        return "Gedeeltelijk";
      default:
        return status;
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(newDate);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <div className="p-8">Niet ingelogd</div>;
  }

  if (isAdminOrManager) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Beschikbaarheid" },
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Beschikbaarheid Overzicht
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Bekijk de beschikbaarheid van alle medewerkers
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Zoek medewerkers..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              variant="outlined"
              inputSize="md"
            />

            <div>
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                style={{ fontSize: "16px" }}
              >
                <option value="">Alle rollen</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Medewerker</option>
                <option value="FREELANCER">Freelancer</option>
              </select>
            </div>

            <div>
              <select
                value={filters.company}
                onChange={(e) =>
                  setFilters({ ...filters, company: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                style={{ fontSize: "16px" }}
              >
                <option value="">Alle bedrijven</option>
                <option value="Broers Verhuur">Broers Verhuur</option>
                <option value="DCRT Event Decorations">
                  DCRT Event Decorations
                </option>
                <option value="DCRT in Building">DCRT in Building</option>
              </select>
            </div>

            <div>
              <select
                value={filters.serviceType}
                onChange={(e) =>
                  setFilters({ ...filters, serviceType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                style={{ fontSize: "16px" }}
              >
                <option value="">Alle diensten</option>
                {SERVICE_TYPES.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FunnelIcon className="h-4 w-4 mr-2" />
              {filteredEmployees.length} van {employees.length} medewerkers
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Week van{" "}
                {format(
                  startOfWeek(selectedDate, { weekStartsOn: 1 }),
                  "d MMMM",
                  { locale: nl }
                )}
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigateWeek("prev")}
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                >
                  Vorige week
                </Button>
                <Button
                  onClick={() => setSelectedDate(new Date())}
                  variant="outline"
                  size="sm"
                >
                  Vandaag
                </Button>
                <Button
                  onClick={() => navigateWeek("next")}
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRightIcon className="h-4 w-4" />}
                >
                  Volgende week
                </Button>
              </div>
            </div>
          </div>

          {/* Employee Availability Grid */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Medewerker
                    </th>
                    {getWeekDays().map((day) => (
                      <th
                        key={day.toISOString()}
                        className="text-center py-3 px-2 font-medium text-gray-900 dark:text-white"
                      >
                        <div className="text-sm">
                          {format(day, "EEE", { locale: nl })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(day, "d/M")}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.email}
                            </div>
                            <div className="flex items-center mt-1 space-x-2">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  employee.role === "MANAGER"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : employee.role === "EMPLOYEE"
                                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                    : employee.role === "FREELANCER"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                }`}
                              >
                                {employee.role === "MANAGER"
                                  ? "Manager"
                                  : employee.role === "EMPLOYEE"
                                  ? "Medewerker"
                                  : employee.role === "FREELANCER"
                                  ? "Freelancer"
                                  : "Medewerker"}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                {employee.company}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {getWeekDays().map((day) => {
                        const dayAvailability =
                          getAvailabilityForEmployeeAndDate(employee.id, day);

                        return (
                          <td
                            key={day.toISOString()}
                            className="text-center py-4 px-2"
                          >
                            {dayAvailability ? (
                              <div
                                className={`w-6 h-6 rounded-full mx-auto cursor-pointer ${getStatusColor(
                                  dayAvailability.status
                                )}`}
                                title={`${getStatusText(
                                  dayAvailability.status
                                )}${
                                  dayAvailability.hours
                                    ? ` - ${dayAvailability.hours} uur`
                                    : ""
                                }${
                                  dayAvailability.notes
                                    ? ` - ${dayAvailability.notes}`
                                    : ""
                                }`}
                              >
                                {dayAvailability.status === "PARTIAL" &&
                                  dayAvailability.hours && (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
                                      {dayAvailability.hours}
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 mx-auto cursor-pointer"
                                title="Geen informatie beschikbaar"
                              ></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {employees.length === 0
                    ? "Geen medewerkers gevonden"
                    : "Geen medewerkers voldoen aan de filters"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {employees.length === 0
                    ? "Er zijn geen medewerkers om beschikbaarheid voor te tonen."
                    : "Probeer de filters aan te passen om meer resultaten te zien."}
                </p>
                {employees.length > 0 && (
                  <div className="mt-6">
                    <Button
                      onClick={() =>
                        setFilters({
                          search: "",
                          role: "",
                          company: "",
                          serviceType: "",
                        })
                      }
                      variant="outline"
                      size="sm"
                    >
                      Filters Wissen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Legenda
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Beschikbaar
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Gedeeltelijk beschikbaar
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Niet beschikbaar
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Geen informatie
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Employee/Freelancer view
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Beschikbaarheid" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Mijn Beschikbaarheid
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Beheer je beschikbaarheid voor werkdagen
          </p>
        </div>
      </div>

      {/* Availability Form */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {getAvailabilityForDate(selectedDate)
              ? "Beschikbaarheid Bewerken"
              : "Beschikbaarheid Instellen"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {getAvailabilityForDate(selectedDate)
              ? `Bewerk je beschikbaarheid voor ${format(
                  selectedDate,
                  "d MMMM yyyy",
                  { locale: nl }
                )}`
              : "Geef aan wanneer je beschikbaar bent om te werken"}
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Datum"
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                leftIcon={<CalendarIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="AVAILABLE">Beschikbaar</option>
                  <option value="PARTIAL">Gedeeltelijk beschikbaar</option>
                  <option value="UNAVAILABLE">Niet beschikbaar</option>
                </select>
              </div>
            </div>

            {selectedStatus === "PARTIAL" && (
              <Input
                label="Aantal uren"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                leftIcon={<ClockIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                placeholder="8"
                helperText="Hoeveel uren ben je beschikbaar?"
              />
            )}

            <Input
              label="Notities (optioneel)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              leftIcon={<DocumentTextIcon className="h-5 w-5" />}
              variant="outlined"
              inputSize="md"
              placeholder="Eventuele opmerkingen..."
            />

            <div className="flex justify-end space-x-3">
              {getAvailabilityForDate(selectedDate) && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Verwijderen
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Opslaan..."
                  : getAvailabilityForDate(selectedDate)
                  ? "Beschikbaarheid Bijwerken"
                  : "Beschikbaarheid Opslaan"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Current Week Overview */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              Deze Week
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigateWeek("prev")}
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                className="rounded-xl touch-manipulation"
              >
                <span className="hidden sm:inline">Vorige</span>
                <span className="sm:hidden">←</span>
              </Button>
              <Button
                onClick={() => navigateWeek("next")}
                variant="outline"
                size="sm"
                rightIcon={<ChevronRightIcon className="h-4 w-4" />}
                className="rounded-xl touch-manipulation"
              >
                <span className="hidden sm:inline">Volgende</span>
                <span className="sm:hidden">→</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-7">
            {getWeekDays().map((day) => {
              const dayAvailability = getAvailabilityForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.div
                  key={day.toISOString()}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 touch-manipulation ${
                    isSameDay(day, selectedDate)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                      : dayAvailability
                      ? "border-green-300 bg-green-50 hover:border-green-400 dark:border-green-600 dark:bg-green-900/20 dark:hover:border-green-500"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(day, "EEE", { locale: nl })}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {format(day, "d")}
                    </div>
                    <div className="mt-3">
                      {dayAvailability ? (
                        <div className="space-y-2">
                          <div
                            className={`w-8 h-8 rounded-full ${getStatusColor(
                              dayAvailability.status
                            )} mx-auto flex items-center justify-center relative`}
                          >
                            {dayAvailability.status === "AVAILABLE" && (
                              <CheckIcon className="h-4 w-4 text-white" />
                            )}
                            {dayAvailability.status === "PARTIAL" && (
                              <ClockIcon className="h-4 w-4 text-white" />
                            )}
                            {dayAvailability.status === "UNAVAILABLE" && (
                              <XMarkIcon className="h-4 w-4 text-white" />
                            )}
                            {/* Edit indicator */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {getStatusText(dayAvailability.status)}
                          </div>
                          {dayAvailability.hours && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {dayAvailability.hours} uren
                            </div>
                          )}
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Klik om te bewerken
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 mx-auto flex items-center justify-center">
                            <PlusIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Niet ingesteld
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Klik om in te stellen
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
