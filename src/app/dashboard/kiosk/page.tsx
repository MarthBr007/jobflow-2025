"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  JobFlow 2025
                </h1>
                <p className="text-lg text-gray-600">Aanwezigheid Dashboard</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                {format(currentTime, "HH:mm:ss")}
              </div>
              <div className="text-lg text-gray-600">
                {format(currentTime, "EEEE d MMMM yyyy", { locale: nl })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalEmployees}
            </div>
            <div className="text-sm text-gray-600 mt-1">Totaal Personeel</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">
              {stats.present}
            </div>
            <div className="text-sm text-gray-600 mt-1">Aanwezig</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-orange-600">
              {stats.absent}
            </div>
            <div className="text-sm text-gray-600 mt-1">Afwezig</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-600">{stats.sick}</div>
            <div className="text-sm text-gray-600 mt-1">Ziek</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600">
              {stats.vacation}
            </div>
            <div className="text-sm text-gray-600 mt-1">Verlof</div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <UserPlusIcon className="h-8 w-8 mr-3 text-blue-600" />
            Personeel - Klik om in/uit te klokken
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {employees.map((employee) => {
              const attendanceStatus = getEmployeeAttendanceStatus(employee);

              return (
                <button
                  key={employee.id}
                  onClick={() => handleEmployeeSelect(employee)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                    attendanceStatus.color === "green"
                      ? "border-green-200 bg-green-50 hover:border-green-300"
                      : attendanceStatus.color === "blue"
                      ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                      : attendanceStatus.color === "red"
                      ? "border-red-200 bg-red-50 hover:border-red-300"
                      : attendanceStatus.color === "purple"
                      ? "border-purple-200 bg-purple-50 hover:border-purple-300"
                      : attendanceStatus.color === "orange"
                      ? "border-orange-200 bg-orange-50 hover:border-orange-300"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    {employee.profileImage ? (
                      <img
                        src={employee.profileImage}
                        alt={employee.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-gray-600" />
                      </div>
                    )}

                    <div className="font-semibold text-gray-900 mb-2 text-lg">
                      {employee.name}
                    </div>

                    <div className="flex items-center justify-center mb-2">
                      {getStatusIcon(attendanceStatus.status)}
                    </div>

                    <div className="text-sm text-gray-600 mb-1">
                      {attendanceStatus.status === "CHECKED_IN" && "Ingeklokt"}
                      {attendanceStatus.status === "CHECKED_OUT" &&
                        "Uitgeklokt"}
                      {attendanceStatus.status === "SICK" && "Ziek"}
                      {attendanceStatus.status === "VACATION" && "Verlof"}
                      {attendanceStatus.status === "ABSENT" && "Afwezig"}
                      {attendanceStatus.status === "NOT_CHECKED_IN" &&
                        "Niet ingeklokt"}
                    </div>

                    {attendanceStatus.time && (
                      <div className="text-xs text-gray-500">
                        {format(new Date(attendanceStatus.time), "HH:mm")}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-blue-100 flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedEmployee.name}
              </h3>
              <p className="text-gray-600">
                {checkInType === "in"
                  ? "Inklokken voor vandaag"
                  : "Uitklokken voor vandaag"}
              </p>
            </div>

            {checkInType === "in" ? (
              <div className="space-y-4">
                <button
                  onClick={() => handleCheckIn("PRESENT")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  <CheckCircleIcon className="h-6 w-6 mr-3" />
                  Aanwezig - Inklokken
                </button>

                <button
                  onClick={() => handleCheckIn("SICK")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  <HeartIcon className="h-6 w-6 mr-3" />
                  Ziek melden
                </button>

                <button
                  onClick={() => handleCheckIn("VACATION")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  <CalendarDaysIcon className="h-6 w-6 mr-3" />
                  Verlof
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleCheckIn("PRESENT")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                <ClockIcon className="h-6 w-6 mr-3" />
                Uitklokken
              </button>
            )}

            <button
              onClick={() => {
                setShowCheckInModal(false);
                setSelectedEmployee(null);
              }}
              className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
