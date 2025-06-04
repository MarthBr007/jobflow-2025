"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserGroupIcon,
  PlayIcon,
  StopIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { motion } from "framer-motion";
import MetricCard from "@/components/ui/MetricCard";
import Button from "@/components/ui/Button";

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeType: string;
  company: string;
  profileImage?: string;
  status: "AVAILABLE" | "WORKING" | "UNAVAILABLE";
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "PRESENT" | "ABSENT" | "SICK" | "VACATION" | "HOLIDAY";
  notes?: string;
  user: Employee;
}

interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  sick: number;
  vacation: number;
}

export default function KioskDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    sick: 0,
    vacation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInType, setCheckInType] = useState<"in" | "out">("in");

  // Redirect non-admin users to kiosk login page
  useEffect(() => {
    if (
      session &&
      session.user?.role !== "ADMIN" &&
      session.user?.role !== "MANAGER"
    ) {
      router.push("/dashboard/kiosk/login");
    }
  }, [session, router]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchEmployees();
      fetchTodayAttendance();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/personnel?active=true");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/attendance/today?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);

    // Check if employee already checked in today
    const todayRecord = attendance.find(
      (record) => record.userId === employee.id
    );
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      setCheckInType("out");
    } else {
      setCheckInType("in");
    }

    setShowCheckInModal(true);
  };

  const handleCheckIn = async (status: "PRESENT" | "SICK" | "VACATION") => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedEmployee.id,
          type: checkInType,
          status: status,
          location: "Kiosk Dashboard",
        }),
      });

      if (response.ok) {
        setShowCheckInModal(false);
        setSelectedEmployee(null);
        // Refresh data
        fetchTodayAttendance();
      }
    } catch (error) {
      console.error("Error checking in/out:", error);
    }
  };

  const getEmployeeAttendanceStatus = (employee: Employee) => {
    const record = attendance.find((a) => a.userId === employee.id);
    if (!record) return { status: "NOT_CHECKED_IN", color: "gray" };

    if (record.checkIn && !record.checkOut) {
      return { status: "CHECKED_IN", color: "green", time: record.checkIn };
    } else if (record.checkIn && record.checkOut) {
      return { status: "CHECKED_OUT", color: "blue", time: record.checkOut };
    } else if (record.status === "SICK") {
      return { status: "SICK", color: "red" };
    } else if (record.status === "VACATION") {
      return { status: "VACATION", color: "purple" };
    }

    return { status: "ABSENT", color: "orange" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case "CHECKED_OUT":
        return <ClockIcon className="h-8 w-8 text-blue-500" />;
      case "SICK":
        return <HeartIcon className="h-8 w-8 text-red-500" />;
      case "VACATION":
        return <CalendarDaysIcon className="h-8 w-8 text-purple-500" />;
      case "ABSENT":
        return <XCircleIcon className="h-8 w-8 text-orange-500" />;
      default:
        return <UserIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100";
      case "CHECKED_OUT":
        return "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100";
      case "SICK":
        return "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100";
      case "VACATION":
        return "border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100";
      case "ABSENT":
        return "border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100";
      default:
        return "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "Ingeklokt";
      case "CHECKED_OUT":
        return "Uitgeklokt";
      case "SICK":
        return "Ziek";
      case "VACATION":
        return "Verlof";
      case "ABSENT":
        return "Afwezig";
      default:
        return "Niet ingeklokt";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <ClockIcon className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-semibold">
            Gegevens laden...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border-b border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <BuildingOfficeIcon className="text-white h-9 w-9" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    CrewFlow 2025
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Aanwezigheid Dashboard
                  </p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{stats.present} Aanwezig</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>{stats.absent} Afwezig</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>{stats.sick} Ziek</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {format(currentTime, "HH:mm:ss")}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  {format(currentTime, "EEEE d MMMM yyyy", { locale: nl })}
                </div>
                <div className="flex items-center justify-end mt-2 space-x-2">
                  <div className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:text-green-200 dark:border-green-700">
                    <ShieldCheckIcon className="inline w-3 h-3 mr-1" />
                    Live
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Auto-refresh 30s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Totaal Personeel"
            value={stats.totalEmployees}
            icon={<UsersIcon className="w-8 h-8" />}
            color="blue"
            subtitle="Alle medewerkers"
            trend={{
              value: stats.totalEmployees > 0 ? 100 : 0,
              isPositive: true,
              label: "actief vandaag",
            }}
          />

          <MetricCard
            title="Aanwezig"
            value={stats.present}
            icon={<CheckCircleIcon className="w-8 h-8" />}
            color="green"
            subtitle="Ingeklokt"
            trend={{
              value:
                Math.round((stats.present / stats.totalEmployees) * 100) || 0,
              isPositive: true,
              label: "% van totaal",
            }}
          />

          <MetricCard
            title="Afwezig"
            value={stats.absent}
            icon={<ExclamationTriangleIcon className="w-8 h-8" />}
            color="orange"
            subtitle="Niet aanwezig"
            trend={{
              value:
                Math.round((stats.absent / stats.totalEmployees) * 100) || 0,
              isPositive: false,
              label: "% van totaal",
            }}
          />

          <MetricCard
            title="Ziek"
            value={stats.sick}
            icon={<HeartIcon className="w-8 h-8" />}
            color="red"
            subtitle="Ziekmelding"
            trend={{
              value: stats.sick,
              isPositive: false,
              label: "ziekmeldingen",
            }}
          />

          <MetricCard
            title="Verlof"
            value={stats.vacation}
            icon={<CalendarDaysIcon className="w-8 h-8" />}
            color="purple"
            subtitle="Vakantie/verlof"
            trend={{
              value: stats.vacation,
              isPositive: true,
              label: "verlofaanvragen",
            }}
          />
        </div>

        {/* Employee Grid */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="px-6 py-6 border-b border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UserPlusIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
              Personeel - Klik om in/uit te klokken
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Selecteer een medewerker om de klokstatus te wijzigen
            </p>
          </div>

          <div className="p-6">
            {employees.length === 0 ? (
              <div className="py-12 text-center">
                <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Geen medewerkers gevonden
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Er zijn momenteel geen actieve medewerkers beschikbaar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {employees.map((employee) => {
                  const attendanceStatus =
                    getEmployeeAttendanceStatus(employee);

                  return (
                    <motion.button
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-lg ${getStatusColor(
                        attendanceStatus.status
                      )} dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700`}
                    >
                      <div className="text-center">
                        {employee.profileImage ? (
                          <img
                            src={employee.profileImage}
                            alt={employee.name}
                            className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <span className="text-xl font-bold text-white">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        <div className="font-semibold text-gray-900 dark:text-white mb-2 text-lg leading-tight">
                          {employee.name}
                        </div>

                        <div className="flex items-center justify-center mb-3">
                          {getStatusIcon(attendanceStatus.status)}
                        </div>

                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {getStatusLabel(attendanceStatus.status)}
                        </div>

                        {attendanceStatus.time && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {format(new Date(attendanceStatus.time), "HH:mm")}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                          {employee.employeeType}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Check-in Modal */}
      {showCheckInModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="text-center">
                {selectedEmployee.profileImage ? (
                  <img
                    src={selectedEmployee.profileImage}
                    alt={selectedEmployee.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {selectedEmployee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedEmployee.name}
                </h3>
                <p className="text-gray-600 text-lg font-medium">
                  {checkInType === "in"
                    ? "Inklokken voor vandaag"
                    : "Uitklokken voor vandaag"}
                </p>
              </div>
            </div>

            <div className="p-8">
              {checkInType === "in" ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-gray-700 font-medium text-lg">
                      Selecteer uw status:
                    </p>
                  </div>

                  <Button
                    onClick={() => handleCheckIn("PRESENT")}
                    variant="primary"
                    size="lg"
                    leftIcon={<CheckCircleIcon className="h-6 w-6" />}
                    className="w-full text-white bg-green-600 shadow-lg hover:bg-green-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-left">
                      <div className="text-xl font-bold">Aanwezig</div>
                      <div className="text-green-100 text-sm">
                        Normaal inklokken
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleCheckIn("SICK")}
                    variant="primary"
                    size="lg"
                    leftIcon={<HeartIcon className="h-6 w-6" />}
                    className="w-full text-white bg-red-600 shadow-lg hover:bg-red-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-left">
                      <div className="text-xl font-bold">Ziek</div>
                      <div className="text-red-100 text-sm">Ziekmelding</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleCheckIn("VACATION")}
                    variant="primary"
                    size="lg"
                    leftIcon={<CalendarDaysIcon className="h-6 w-6" />}
                    className="w-full text-white bg-purple-600 shadow-lg hover:bg-purple-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-left">
                      <div className="text-xl font-bold">Verlof</div>
                      <div className="text-purple-100 text-sm">
                        Vakantie/verlof
                      </div>
                    </div>
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <ClockIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium text-lg">
                      Bevestig uitklokken
                    </p>
                  </div>

                  <Button
                    onClick={() => handleCheckIn("PRESENT")}
                    variant="primary"
                    size="lg"
                    leftIcon={<ClockIcon className="h-6 w-6" />}
                    className="w-full text-white bg-blue-600 shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-left">
                      <div className="text-2xl font-bold">Uitklokken</div>
                      <div className="text-blue-100 text-sm">
                        Werkdag beëindigen
                      </div>
                    </div>
                  </Button>
                </div>
              )}

              <Button
                onClick={() => {
                  setShowCheckInModal(false);
                  setSelectedEmployee(null);
                }}
                variant="outline"
                size="lg"
                className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border-gray-300 transition-all duration-200"
              >
                Annuleren
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
