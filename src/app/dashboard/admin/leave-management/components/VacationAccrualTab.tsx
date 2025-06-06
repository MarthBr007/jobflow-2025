"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CalculatorIcon,
  RefreshCwIcon,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface VacationAccrualData {
  userId: string;
  userName: string;
  employeeType: string;
  contractHoursPerWeek: number;
  contractType: string;
  hoursWorkedYTD: number;
  vacationHoursAccrued: number;
  vacationDaysAccrued: number;
  vacationHoursPerYear: number;
  accrualPerHour: number;
  lastCalculatedDate: string;
  monthlyBreakdown: {
    [key: string]: { hoursWorked: number; vacationAccrued: number };
  };
}

interface CalculationResult {
  userId: string;
  userName: string;
  success: boolean;
  message?: string;
  error?: string;
  accrualData?: VacationAccrualData;
}

interface CalculationSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  year: number;
}

export default function VacationAccrualTab() {
  const [accrualData, setAccrualData] = useState<VacationAccrualData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<VacationAccrualData | null>(null);
  const [calculationResults, setCalculationResults] = useState<
    CalculationResult[]
  >([]);
  const [calculationSummary, setCalculationSummary] =
    useState<CalculationSummary | null>(null);

  const fetchAccrualData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/vacation-accrual/calculate?year=${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          const successfulResults = data.results
            .filter((r: CalculationResult) => r.success && r.accrualData)
            .map((r: CalculationResult) => r.accrualData);
          setAccrualData(successfulResults);
        }
      }
    } catch (error) {
      console.error("Error fetching accrual data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateVacationAccrual = async (recalculateAll = false) => {
    try {
      setCalculating(true);
      const payload = {
        year: selectedYear,
        recalculateAll,
        ...(selectedUserId && !recalculateAll && { userId: selectedUserId }),
      };

      const response = await fetch("/api/vacation-accrual/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setCalculationResults(data.results || []);
        setCalculationSummary(data.summary);

        // Refresh the data
        await fetchAccrualData();
      }
    } catch (error) {
      console.error("Error calculating vacation accrual:", error);
    } finally {
      setCalculating(false);
    }
  };

  const showEmployeeDetails = (employee: VacationAccrualData) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    fetchAccrualData();
  }, [selectedYear]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalculatorIcon className="h-6 w-6 text-blue-600" />
            Vakantie-Opbouw Berekening
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automatische berekening van vakantie-uren op basis van gewerkte uren
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <Button
            onClick={() => calculateVacationAccrual(true)}
            disabled={calculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {calculating ? (
              <>
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                Berekenen...
              </>
            ) : (
              <>
                <CalculatorIcon className="h-4 w-4 mr-2" />
                Herbereken Alles
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {calculationSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Verwerkt
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {calculationSummary.totalProcessed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Succesvol
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {calculationSummary.successful}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-red-600 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Gefaald
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {calculationSummary.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accrual Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Vakantie-Opbouw Overzicht {selectedYear}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Automatisch berekende vakantie-uren per werknemer op basis van
            gewerkte uren
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : accrualData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Geen data beschikbaar</p>
              <p className="text-sm">
                Klik op "Herbereken Alles" om vakantie-opbouw te berekenen
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Werknemer</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Contract Uren/Week</th>
                    <th className="px-4 py-2">Gewerkte Uren</th>
                    <th className="px-4 py-2">Vakantie-Uren</th>
                    <th className="px-4 py-2">Vakantie-Dagen</th>
                    <th className="px-4 py-2">Laatste Update</th>
                    <th className="px-4 py-2">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {accrualData.map((employee) => (
                    <tr key={employee.userId}>
                      <td className="border px-4 py-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {employee.userName}
                          </div>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {employee.employeeType}
                        </span>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-sm">
                          <div className="font-medium">
                            {employee.contractHoursPerWeek}u
                          </div>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-sm">
                          <div className="font-medium text-blue-600">
                            {employee.hoursWorkedYTD.toFixed(1)}u
                          </div>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-sm">
                          <div className="font-medium text-green-600">
                            {employee.vacationHoursAccrued.toFixed(1)}u
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {(employee.accrualPerHour * 100).toFixed(2)}% per
                            uur
                          </div>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-sm">
                          <div className="font-medium text-purple-600">
                            {employee.vacationDaysAccrued} dagen
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            ({employee.vacationHoursPerYear}u/jaar)
                          </div>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(
                            new Date(employee.lastCalculatedDate),
                            "dd MMM yyyy HH:mm",
                            { locale: nl }
                          )}
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEmployeeDetails(employee)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEmployee(null);
        }}
        title={`Vakantie-Opbouw Details - ${selectedEmployee?.userName}`}
        size="xl"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedEmployee.contractHoursPerWeek}u
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Contract per week
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedEmployee.hoursWorkedYTD.toFixed(1)}u
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Gewerkt dit jaar
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedEmployee.vacationHoursAccrued.toFixed(1)}u
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Vakantie opgebouwd
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {((selectedEmployee.accrualPerHour || 0) * 100).toFixed(3)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Opbouw per uur
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Maandelijks Overzicht</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Vakantie-opbouw per maand in {selectedYear}
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Maand</th>
                        <th className="px-4 py-2">Gewerkte Uren</th>
                        <th className="px-4 py-2">Vakantie Opgebouwd</th>
                        <th className="px-4 py-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedEmployee.monthlyBreakdown || {})
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([month, data]) => (
                          <tr key={month}>
                            <td className="border px-4 py-2">
                              {format(new Date(month + "-01"), "MMMM yyyy", {
                                locale: nl,
                              })}
                            </td>
                            <td className="border px-4 py-2">
                              <div className="font-medium text-blue-600">
                                {data.hoursWorked.toFixed(1)}u
                              </div>
                            </td>
                            <td className="border px-4 py-2">
                              <div className="font-medium text-green-600">
                                {data.vacationAccrued.toFixed(2)}u
                              </div>
                            </td>
                            <td className="border px-4 py-2">
                              <div className="text-sm text-gray-500">
                                {data.hoursWorked > 0
                                  ? (
                                      (data.vacationAccrued /
                                        data.hoursWorked) *
                                      100
                                    ).toFixed(2) + "%"
                                  : "0%"}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
 