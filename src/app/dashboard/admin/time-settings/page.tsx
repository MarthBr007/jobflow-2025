"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import PermissionGuard from "@/components/ui/PermissionGuard";

export default function TimeSettings() {
  return (
    <PermissionGuard permission="canManageSystemSettings">
      <TimeSettingsContent />
    </PermissionGuard>
  );
}

function TimeSettingsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    standardWorkDay: 8,
    standardWorkWeek: 40,
    standardStartTime: "08:00",
    standardEndTime: "17:00",
    breakDuration: 30,
    overtimeThreshold: 8.5,
    weekendOvertime: true,
    automaticBreakDeduction: true,
    roundingMinutes: 15,
    timeZone: "Europe/Amsterdam",
    dateFormat: "dd-MM-yyyy",
    timeFormat: "24h",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/time-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/time-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Tijd instellingen opgeslagen!");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Fout bij opslaan van instellingen");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Systeeminstellingen",
            href: "/dashboard/admin/system-settings",
          },
          { label: "Tijd & Planning" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ClockIcon className="h-7 w-7 mr-3 text-orange-600" />
            Tijd & Planning
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configureer werk- en rusttijden, overuren en tijdregistratie
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          onClick={() => router.push("/dashboard/schedule")}
          variant="outline"
          leftIcon={<CalendarIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Rooster Beheren
        </Button>
        <Button
          onClick={() => router.push("/dashboard/time-tracking")}
          variant="outline"
          leftIcon={<ClockIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Tijdregistratie
        </Button>
        <Button
          onClick={() => router.push("/dashboard/admin/schedule-templates")}
          variant="outline"
          leftIcon={<Cog6ToothIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Rooster Templates
        </Button>
      </div>

      {/* Standard Work Hours */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <SunIcon className="h-5 w-5 mr-2 text-orange-600" />
            Standaard Werktijden
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Standaard werkdag (uren)"
              type="number"
              value={settings.standardWorkDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  standardWorkDay: parseFloat(e.target.value),
                })
              }
              min="1"
              max="24"
              step="0.5"
              helperText="Aantal uren per standaard werkdag"
            />

            <Input
              label="Standaard werkweek (uren)"
              type="number"
              value={settings.standardWorkWeek}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  standardWorkWeek: parseFloat(e.target.value),
                })
              }
              min="1"
              max="168"
              step="0.5"
              helperText="Aantal uren per standaard werkweek"
            />

            <Input
              label="Overuren drempel (uren)"
              type="number"
              value={settings.overtimeThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  overtimeThreshold: parseFloat(e.target.value),
                })
              }
              min="1"
              max="24"
              step="0.5"
              helperText="Na hoeveel uren per dag beginnen overuren"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
            <Input
              label="Standaard starttijd"
              type="time"
              value={settings.standardStartTime}
              onChange={(e) =>
                setSettings({ ...settings, standardStartTime: e.target.value })
              }
              helperText="Standaard begintijd voor nieuwe medewerkers"
            />

            <Input
              label="Standaard eindtijd"
              type="time"
              value={settings.standardEndTime}
              onChange={(e) =>
                setSettings({ ...settings, standardEndTime: e.target.value })
              }
              helperText="Standaard eindtijd voor nieuwe medewerkers"
            />
          </div>
        </div>
      </Card>

      {/* Break Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <MoonIcon className="h-5 w-5 mr-2 text-blue-600" />
            Pauze Instellingen
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Standaard pauze duur (minuten)"
              type="number"
              value={settings.breakDuration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  breakDuration: parseInt(e.target.value),
                })
              }
              min="0"
              max="240"
              step="15"
              helperText="Standaard pauze duur per werkdag"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.automaticBreakDeduction}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    automaticBreakDeduction: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Automatische pauze aftrek bij tijdregistratie
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Info:</strong> Pauzes worden automatisch afgetrokken
                  van de totale gewerkte tijd als deze optie is ingeschakeld.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Time Tracking Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
            Tijdregistratie Instellingen
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Afronding (minuten)"
              type="number"
              value={settings.roundingMinutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  roundingMinutes: parseInt(e.target.value),
                })
              }
              min="1"
              max="60"
              helperText="Tijd wordt afgerond op deze minuten"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tijdzone
              </label>
              <select
                value={settings.timeZone}
                onChange={(e) =>
                  setSettings({ ...settings, timeZone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Europe/Amsterdam">Europa/Amsterdam (CET)</option>
                <option value="Europe/London">Europa/London (GMT)</option>
                <option value="Europe/Paris">Europa/Paris (CET)</option>
                <option value="Europe/Berlin">Europa/Berlin (CET)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tijd formaat
              </label>
              <select
                value={settings.timeFormat}
                onChange={(e) =>
                  setSettings({ ...settings, timeFormat: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="24h">24-uurs (08:30)</option>
                <option value="12h">12-uurs (8:30 AM)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.weekendOvertime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weekendOvertime: e.target.checked,
                  })
                }
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Weekend werk automatisch als overuren registreren
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Date & Display Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Datum & Weergave Instellingen
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Datum formaat
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) =>
                  setSettings({ ...settings, dateFormat: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="dd-MM-yyyy">DD-MM-YYYY (31-12-2024)</option>
                <option value="MM-dd-yyyy">MM-DD-YYYY (12-31-2024)</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD (2024-12-31)</option>
                <option value="dd/MM/yyyy">DD/MM/YYYY (31/12/2024)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-purple-400" />
              <div className="ml-3">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>Voorbeeld:</strong> Met de huidige instellingen wordt
                  een werkdag van {settings.standardStartTime} tot{" "}
                  {settings.standardEndTime}
                  weergegeven als {settings.standardWorkDay} uren werk met{" "}
                  {settings.breakDuration} minuten pauze.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Working Hours Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Werktijden Overzicht
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {settings.standardWorkDay}h
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Standaard werkdag
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {settings.standardWorkWeek}h
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Standaard werkweek
                </p>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {settings.breakDuration}min
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Standaard pauze
                </p>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {settings.roundingMinutes}min
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Afronding
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={() => router.push("/dashboard/admin/system-settings")}
          variant="outline"
        >
          Terug
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          leftIcon={<ClockIcon className="h-4 w-4" />}
        >
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}
