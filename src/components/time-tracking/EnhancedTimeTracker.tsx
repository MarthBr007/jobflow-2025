"use client";

import React, { useState, useEffect } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Coffee,
  Calendar,
  Users,
  Target,
  Award,
  Timer,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  Bell,
  Plus,
  Zap,
  Moon,
  Sun,
  CalendarDays,
  Gift,
} from "lucide-react";

interface TimeBalance {
  userId: string;
  regularHours: number;
  overtimeHours: number;
  compensationHours: number;
  usedCompensationHours: number;
  shortageHours: number;
  expectedHours: number;
  actualHours: number;
  breakHours: number;
  weekendHours: number;
  eveningHours: number;
  nightHours: number;
  holidayHours: number;
  autoBreakDeducted: number;
  period: {
    start: Date;
    end: Date;
  };
}

interface ShortageAlert {
  userId: string;
  userName: string;
  expectedHours: number;
  actualHours: number;
  shortageHours: number;
  period: string;
  severity: "WARNING" | "CRITICAL";
  notified: boolean;
  formattedShortage: string;
  consecutiveWeeksShort: number;
  suggestedActions: string[];
  autoNotificationSent: boolean;
  managerNotified: boolean;
  actionRequired: boolean;
  escalationLevel: "LOW" | "MEDIUM" | "HIGH";
}

interface CompensationData {
  compensationBalance: {
    earned: number;
    used: number;
    current: number;
    formatted: {
      earned: string;
      used: string;
      current: string;
    };
  };
  breakdown: {
    weekendHours: {
      hours: number;
      formatted: string;
      compensation: number;
    };
    eveningHours: {
      hours: number;
      formatted: string;
      compensation: number;
    };
  };
  recentEntries: Array<{
    id: string;
    date: string;
    hours: string;
    type: string;
    description: string;
    location: string;
    approved: boolean;
  }>;
  canUseCompensation: boolean;
  maxUsableHours: number;
  recommendations: string[];
}

interface BulkCompensationForm {
  dates: string[];
  hoursPerDay: number;
  type: "VACATION" | "PERSONAL" | "SICK" | "FLEX";
  reason: string;
}

export default function EnhancedTimeTracker() {
  const [timeBalance, setTimeBalance] = useState<TimeBalance | null>(null);
  const [shortageAlerts, setShortageAlerts] = useState<ShortageAlert[]>([]);
  const [compensationData, setCompensationData] =
    useState<CompensationData | null>(null);
  const [teamReport, setTeamReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [activeTab, setActiveTab] = useState("balance");
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkCompensationForm>({
    dates: [],
    hoursPerDay: 8,
    type: "VACATION",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch personal balance
      const balanceResponse = await fetch(
        `/api/time-tracking/enhanced?action=balance&period=${selectedPeriod}`
      );
      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        setTimeBalance(balanceData.data.balance);
      }

      // Fetch shortage alerts
      const shortageResponse = await fetch(
        `/api/time-tracking/enhanced?action=shortages&period=${selectedPeriod}`
      );
      const shortageData = await shortageResponse.json();
      if (shortageData.success) {
        setShortageAlerts(shortageData.data.alerts);
      }

      // Fetch compensation overview
      const compensationResponse = await fetch(
        `/api/time-tracking/enhanced?action=compensation`
      );
      const compensationDataResult = await compensationResponse.json();
      if (compensationDataResult.success) {
        setCompensationData(compensationDataResult.data);
      }

      // Fetch team report
      const reportResponse = await fetch(
        `/api/time-tracking/enhanced?action=report&period=${selectedPeriod}`
      );
      const reportData = await reportResponse.json();
      if (reportData.success) {
        setTeamReport(reportData.data);
      }
    } catch (error) {
      console.error("Error fetching enhanced time tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompensationTime = async (
    hours: number,
    date: string,
    type: string
  ) => {
    try {
      const response = await fetch("/api/time-tracking/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "use_compensation",
          hours,
          date,
          type,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchData(); // Refresh data
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error using compensation time:", error);
      alert("Er is een fout opgetreden");
    }
  };

  const submitBulkCompensation = async () => {
    if (bulkForm.dates.length === 0 || !bulkForm.reason) {
      alert("Vul alle velden in");
      return;
    }

    const totalHours = bulkForm.dates.length * bulkForm.hoursPerDay;

    try {
      const response = await fetch("/api/time-tracking/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_compensation",
          bulkAction: {
            userId: "current", // Will be set by API
            dates: bulkForm.dates,
            hoursPerDay: bulkForm.hoursPerDay,
            type: bulkForm.type,
            reason: bulkForm.reason,
            totalHours,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setShowBulkForm(false);
        setBulkForm({
          dates: [],
          hoursPerDay: 8,
          type: "VACATION",
          reason: "",
        });
        fetchData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error submitting bulk compensation:", error);
      alert("Er is een fout opgetreden");
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(
        `/api/time-tracking/enhanced?action=export&period=${selectedPeriod}`
      );
      const result = await response.json();

      if (result.success) {
        // Convert to CSV and download
        const csvContent = convertToCSV(result.data.exportData);
        downloadCSV(csvContent, `timetracking-${selectedPeriod}.csv`);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Export mislukt");
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ];

    return csvRows.join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerAutoNotifications = async () => {
    try {
      const response = await fetch(
        `/api/time-tracking/enhanced?action=auto_notifications`
      );
      const result = await response.json();

      if (result.success) {
        alert(result.data.message);
      }
    } catch (error) {
      console.error("Error triggering notifications:", error);
      alert("Notificaties versturen mislukt");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Enhanced Uren Registratie
        </h1>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="current_week">Deze week</option>
            <option value="current_month">Deze maand</option>
            <option value="last_month">Vorige maand</option>
            <option value="last_3_months">Laatste 3 maanden</option>
          </select>
          <Button onClick={exportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={triggerAutoNotifications}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notificaties
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "balance", label: "Tijd Balans", icon: Clock },
            { id: "compensation", label: "Compensatie", icon: Gift },
            { id: "shortages", label: "Tekorten", icon: AlertTriangle },
            { id: "team", label: "Team Rapport", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "balance" && timeBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Balance Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tijd Balans Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      (timeBalance.actualHours / timeBalance.expectedHours) *
                        100
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Productiviteit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(timeBalance.actualHours)}h
                  </div>
                  <div className="text-sm text-gray-600">Gewerkt</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(timeBalance.overtimeHours)}h
                  </div>
                  <div className="text-sm text-gray-600">Overtime</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      timeBalance.shortageHours > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {timeBalance.shortageHours > 0
                      ? `-${Math.round(timeBalance.shortageHours)}h`
                      : "✓"}
                  </div>
                  <div className="text-sm text-gray-600">Tekort</div>
                </div>
              </div>

              {/* Enhanced Hours Breakdown */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Sun className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">
                      {Math.round(timeBalance.regularHours)}h
                    </div>
                    <div className="text-xs text-gray-600">Regulier</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">
                      {Math.round(timeBalance.weekendHours)}h
                    </div>
                    <div className="text-xs text-gray-600">Weekend (+50%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Sun className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium">
                      {Math.round(timeBalance.eveningHours)}h
                    </div>
                    <div className="text-xs text-gray-600">Avond (+25%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-medium">
                      {Math.round(timeBalance.nightHours)}h
                    </div>
                    <div className="text-xs text-gray-600">Nacht (+50%)</div>
                  </div>
                </div>
              </div>

              {timeBalance.autoBreakDeducted > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">
                      {Math.round(timeBalance.autoBreakDeducted * 60)} minuten
                      automatische pauze afgetrokken
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Snelle Acties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() =>
                  handleCompensationTime(
                    8,
                    new Date().toISOString().split("T")[0],
                    "Vrije dag"
                  )
                }
                className="w-full"
                disabled={!compensationData?.canUseCompensation}
              >
                Gebruik 8h compensatie
              </Button>
              <Button
                onClick={() => setShowBulkForm(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Bulk compensatie
              </Button>
              <Button onClick={exportData} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "compensation" && compensationData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compensation Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Compensatie Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-green-600">
                  {compensationData.compensationBalance.formatted.current}
                </div>
                <div className="text-sm text-gray-600">
                  Beschikbare compensatie uren
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-600">
                    {compensationData.compensationBalance.formatted.earned}
                  </div>
                  <div className="text-xs text-gray-600">Opgebouwd</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-600">
                    {compensationData.compensationBalance.formatted.used}
                  </div>
                  <div className="text-xs text-gray-600">Gebruikt</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Weekend uren</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {compensationData.breakdown.weekendHours.formatted}
                    </div>
                    <div className="text-xs text-gray-600">
                      +
                      {Math.round(
                        compensationData.breakdown.weekendHours.compensation
                      )}
                      h compensatie
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Avond uren</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {compensationData.breakdown.eveningHours.formatted}
                    </div>
                    <div className="text-xs text-gray-600">
                      +
                      {Math.round(
                        compensationData.breakdown.eveningHours.compensation
                      )}
                      h compensatie
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {compensationData.recommendations.length > 0 && (
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Aanbevelingen:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {compensationData.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recente Compensatie Activiteit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {compensationData.recentEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{entry.date}</p>
                      <p className="text-sm text-gray-600">
                        {entry.description}
                      </p>
                      <p className="text-xs text-gray-500">{entry.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.type === "Opgebouwd" ? "default" : "secondary"
                          }
                        >
                          {entry.type}
                        </Badge>
                        {entry.approved ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{entry.hours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "shortages" && (
        <div className="space-y-6">
          {/* Shortage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {shortageAlerts.length}
                    </div>
                    <div className="text-sm text-gray-600">Totaal tekorten</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {
                        shortageAlerts.filter((a) => a.severity === "CRITICAL")
                          .length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Kritiek</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {
                        shortageAlerts.filter(
                          (a) => a.escalationLevel === "HIGH"
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Escalatie</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {shortageAlerts.filter((a) => a.actionRequired).length}
                    </div>
                    <div className="text-sm text-gray-600">Actie vereist</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shortage Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Tekort Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shortageAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === "CRITICAL"
                        ? "bg-red-50 border-red-500"
                        : "bg-yellow-50 border-yellow-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{alert.userName}</h4>
                        <p className="text-sm text-gray-600">
                          {alert.formattedShortage} tekort • {alert.period}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              alert.severity === "CRITICAL"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {alert.consecutiveWeeksShort} weken
                          </Badge>
                          <Badge
                            variant={
                              alert.escalationLevel === "HIGH"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {alert.escalationLevel}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          -{alert.formattedShortage}
                        </div>
                        <div className="text-sm text-gray-600">
                          {Math.round(
                            (alert.actualHours / alert.expectedHours) * 100
                          )}
                          % productiviteit
                        </div>
                      </div>
                    </div>

                    {/* Suggested Actions */}
                    {alert.suggestedActions.length > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <h5 className="font-medium text-sm mb-2">
                          Voorgestelde acties:
                        </h5>
                        <ul className="text-sm space-y-1">
                          {alert.suggestedActions.map((action, actionIndex) => (
                            <li
                              key={actionIndex}
                              className="flex items-start gap-2"
                            >
                              <span className="text-blue-600">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {shortageAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>Geen tekorten gevonden! Alles op schema.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "team" && teamReport && (
        <div className="space-y-6">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {teamReport.teamStats.totalEmployees}
                    </div>
                    <div className="text-sm text-gray-600">Medewerkers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(teamReport.teamStats.totalHoursWorked)}
                    </div>
                    <div className="text-sm text-gray-600">Totaal uren</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(teamReport.teamStats.averageProductivity)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Gem. productiviteit
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        teamReport.teamStats.totalCompensationBalance
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Compensatie uren
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Insights */}
          {teamReport.insights && (
            <Card>
              <CardHeader>
                <CardTitle>Team Inzichten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {teamReport.insights.map((insight: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div
                          className={`text-sm px-2 py-1 rounded ${
                            insight.trend === "UP"
                              ? "bg-red-100 text-red-800"
                              : insight.trend === "DOWN"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {insight.trend}
                        </div>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {insight.value}
                      </div>
                      <div className="text-sm text-gray-600">
                        {insight.details}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Individuele Rapporten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Naam</th>
                      <th className="text-left p-2">Contract</th>
                      <th className="text-left p-2">Gewerkt</th>
                      <th className="text-left p-2">Verwacht</th>
                      <th className="text-left p-2">Productiviteit</th>
                      <th className="text-left p-2">Compensatie</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamReport.individualReports.map(
                      (report: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{report.userName}</td>
                          <td className="p-2">{report.contractType}</td>
                          <td className="p-2">
                            {report.formatted.actualHours}
                          </td>
                          <td className="p-2">
                            {report.formatted.expectedHours}
                          </td>
                          <td className="p-2">
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                report.formatted.productivity >= 100
                                  ? "bg-green-100 text-green-800"
                                  : report.formatted.productivity >= 90
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {report.formatted.productivity}%
                            </div>
                          </td>
                          <td className="p-2">
                            {report.formatted.compensationBalance}
                          </td>
                          <td className="p-2">
                            {report.balance.shortageHours > 0 ? (
                              <Badge variant="destructive">Tekort</Badge>
                            ) : report.balance.overtimeHours > 8 ? (
                              <Badge variant="secondary">Overtime</Badge>
                            ) : (
                              <Badge variant="default">OK</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Compensation Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              Bulk Compensatie Aanvraag
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={bulkForm.type}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="VACATION">Vakantie</option>
                  <option value="PERSONAL">Persoonlijk</option>
                  <option value="SICK">Ziek</option>
                  <option value="FLEX">Flexibel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Uren per dag
                </label>
                <input
                  type="number"
                  value={bulkForm.hoursPerDay}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      hoursPerDay: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  max="12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Datums (comma gescheiden)
                </label>
                <input
                  type="text"
                  placeholder="2024-01-15, 2024-01-16, 2024-01-17"
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      dates: e.target.value.split(",").map((d) => d.trim()),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reden</label>
                <textarea
                  value={bulkForm.reason}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Beschrijf de reden voor deze compensatie aanvraag..."
                />
              </div>

              <div className="text-sm text-gray-600">
                Totaal: {bulkForm.dates.length} dagen × {bulkForm.hoursPerDay}h
                = {bulkForm.dates.length * bulkForm.hoursPerDay}h
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={submitBulkCompensation} className="flex-1">
                Aanvragen
              </Button>
              <Button
                onClick={() => setShowBulkForm(false)}
                variant="outline"
                className="flex-1"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
