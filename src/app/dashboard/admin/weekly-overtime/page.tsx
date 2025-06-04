"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import PermissionGuard from "@/components/ui/PermissionGuard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/useToast";

interface WeeklyOvertimeData {
  userId: string;
  userName: string;
  email: string;
  workPattern: string;
  timeForTimeSettings: any;
  weekPeriod: {
    start: Date;
    end: Date;
    formatted: string;
  };
  summary: {
    totalWorkedHours: number;
    weeklyOvertimeThreshold: number;
    weeklyOvertime: number;
    dailyOvertimeTotal: number;
    compensationEarned: number;
  };
  dailyBreakdown: any[];
  needsApproval: boolean;
  autoApprovalEligible: boolean;
}

interface WeeklyOvertimeResponse {
  weekPeriod: {
    start: Date;
    end: Date;
    formatted: string;
  };
  totalUsers: number;
  usersNeedingApproval: number;
  autoApprovalEligible: number;
  data: WeeklyOvertimeData[];
}

export default function WeeklyOvertimePage() {
  return (
    <PermissionGuard permission="canManageShifts">
      <WeeklyOvertimeContent />
    </PermissionGuard>
  );
}

function WeeklyOvertimeContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [overtimeData, setOvertimeData] = useState<WeeklyOvertimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedApprovals, setSelectedApprovals] = useState<Record<string, {
    approve: boolean;
    compensationHours: number;
    notes: string;
  }>>({});

  useEffect(() => {
    fetchWeeklyOvertimeData();
  }, [currentWeek]);

  const fetchWeeklyOvertimeData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/time-tracking/weekly-overtime?weekStart=${currentWeek.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setOvertimeData(data);
        
        // Initialize approval selections
        const initialApprovals: Record<string, any> = {};
        data.data.forEach((user: WeeklyOvertimeData) => {
          initialApprovals[user.userId] = {
            approve: user.autoApprovalEligible,
            compensationHours: user.summary.compensationEarned,
            notes: ""
          };
        });
        setSelectedApprovals(initialApprovals);
      } else {
        showToast("Fout bij ophalen overuren data", "error");
      }
    } catch (error) {
      console.error("Error fetching overtime data:", error);
      showToast("Er is een fout opgetreden", "error");
    } finally {
      setLoading(false);
    }
  };

  const processApprovals = async () => {
    if (!overtimeData) return;

    setProcessing(true);
    try {
      const approvals = Object.entries(selectedApprovals).map(([userId, approval]) => ({
        userId,
        approve: approval.approve,
        compensationHours: approval.approve ? approval.compensationHours : 0,
        notes: approval.notes
      }));

      const response = await fetch("/api/time-tracking/weekly-overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvals,
          weekStart: currentWeek.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        showToast(
          `✅ ${result.successful} goedkeuringen verwerkt, ${result.totalCompensationAwarded}u compensatie toegekend`,
          "success"
        );
        fetchWeeklyOvertimeData(); // Refresh data
      } else {
        showToast("Fout bij verwerken goedkeuringen", "error");
      }
    } catch (error) {
      console.error("Error processing approvals:", error);
      showToast("Er is een fout opgetreden", "error");
    } finally {
      setProcessing(false);
    }
  };

  const updateApproval = (userId: string, field: string, value: any) => {
    setSelectedApprovals(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const autoApproveAll = () => {
    const autoApprovals: Record<string, any> = {};
    overtimeData?.data.forEach(user => {
      autoApprovals[user.userId] = {
        approve: user.autoApprovalEligible,
        compensationHours: user.autoApprovalEligible ? user.summary.compensationEarned : 0,
        notes: user.autoApprovalEligible ? "Automatisch goedgekeurd" : ""
      };
    });
    setSelectedApprovals(autoApprovals);
    showToast("Auto-goedkeuring toegepast voor alle eligible gebruikers", "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Wekelijkse Overuren" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ⏰ Wekelijkse Overuren Goedkeuring
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Verwerk tijd-voor-tijd compensatie en overuren per week
                </p>
              </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Vorige Week
              </Button>
              
              <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {overtimeData?.weekPeriod.formatted}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Week {format(currentWeek, 'ww', { locale: nl })} - {format(currentWeek, 'yyyy')}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Volgende Week
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {overtimeData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Totaal Gebruikers"
            value={overtimeData.totalUsers}
            icon={<UserGroupIcon className="w-8 h-8" />}
            color="blue"
            subtitle="Met tijd-voor-tijd ingeschakeld"
          />

          <MetricCard
            title="Goedkeuring Nodig"
            value={overtimeData.usersNeedingApproval}
            icon={<ExclamationTriangleIcon className="w-8 h-8" />}
            color="orange"
            subtitle="Gebruikers met overuren"
          />

          <MetricCard
            title="Auto-Goedkeuring"
            value={overtimeData.autoApprovalEligible}
            icon={<CheckCircleIcon className="w-8 h-8" />}
            color="green"
            subtitle="Automatisch goedgekeurd"
          />

          <MetricCard
            title="Totaal Compensatie"
            value={`${Math.round(
              overtimeData.data.reduce((total, user) => 
                total + (selectedApprovals[user.userId]?.approve ? user.summary.compensationEarned : 0), 0
              ) * 10
            ) / 10}u`}
            icon={<ChartBarIcon className="w-8 h-8" />}
            color="purple"
            subtitle="Tijd-voor-tijd uren"
          />
        </div>
      )}

      {/* Overtime Data Table */}
      {overtimeData && overtimeData.data.length > 0 ? (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Overuren Overzicht
              </h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoApproveAll}
                  leftIcon={<DocumentCheckIcon className="h-4 w-4" />}
                >
                  Auto-Goedkeuring
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={processApprovals}
                  disabled={processing}
                  leftIcon={processing ? undefined : <CheckCircleIcon className="h-4 w-4" />}
                >
                  {processing ? "Verwerken..." : "Goedkeuringen Verwerken"}
                </Button>
              </div>
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
                    Werkpatroon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Gewerkte Uren
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Overwerk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Compensatie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Goedkeuring
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {overtimeData.data.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Employee */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.userName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Work Pattern */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                        {user.workPattern}
                      </span>
                    </td>

                    {/* Worked Hours */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="font-semibold">{user.summary.totalWorkedHours}u</div>
                        <div className="text-xs text-gray-500">
                          van {user.summary.weeklyOvertimeThreshold}u verwacht
                        </div>
                      </div>
                    </td>

                    {/* Overtime */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {user.summary.weeklyOvertime > 0 ? (
                          <div className="text-orange-600 dark:text-orange-400 font-semibold">
                            +{user.summary.weeklyOvertime}u
                          </div>
                        ) : (
                          <div className="text-gray-400">Geen overwerk</div>
                        )}
                        {user.summary.dailyOvertimeTotal > 0 && (
                          <div className="text-xs text-gray-500">
                            {user.summary.dailyOvertimeTotal}u dagelijks
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Compensation */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {user.summary.compensationEarned > 0 ? (
                          <div className="text-green-600 dark:text-green-400 font-semibold">
                            {user.summary.compensationEarned}u
                          </div>
                        ) : (
                          <div className="text-gray-400">Geen compensatie</div>
                        )}
                        {user.autoApprovalEligible && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 mt-1">
                            Auto-eligible
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Approval */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedApprovals[user.userId]?.approve || false}
                            onChange={(e) => updateApproval(user.userId, 'approve', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            Goedkeuren
                          </span>
                        </label>
                        
                        {selectedApprovals[user.userId]?.approve && (
                          <input
                            type="number"
                            value={selectedApprovals[user.userId]?.compensationHours || 0}
                            onChange={(e) => updateApproval(user.userId, 'compensationHours', parseFloat(e.target.value) || 0)}
                            min="0"
                            max={user.timeForTimeSettings.maxAccrualHours}
                            step="0.5"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="0.0"
                          />
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/personnel/edit/${user.userId}`)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Geen Overuren Deze Week
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Er zijn geen medewerkers met overuren voor deze week gevonden.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
} 