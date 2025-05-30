"use client";

import { useState } from "react";
import {
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "@/components/ui/DatePicker";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function DatePickerDemo() {
  // Single date picker states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);

  // Date range picker states
  const [projectRange, setProjectRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });

  const [vacationRange, setVacationRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });

  const [reportRange, setReportRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });

  const clearAllDates = () => {
    setSelectedDate(null);
    setBirthDate(null);
    setAppointmentDate(null);
    setProjectRange({ startDate: null, endDate: null });
    setVacationRange({ startDate: null, endDate: null });
    setReportRange({ startDate: null, endDate: null });
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Demo", href: "/dashboard/demo" },
          { label: "Date Pickers" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📅 Date Picker Components
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Gebaseerd op{" "}
            <a
              href="https://www.uinkits.com/components/date-picker-ui-element"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              uinkits design principes
            </a>{" "}
            voor moderne datum selectie
          </p>
        </div>
        <Button
          onClick={clearAllDates}
          variant="outline"
          leftIcon={<ClockIcon className="h-5 w-5" />}
        >
          Reset Alle Datums
        </Button>
      </div>

      {/* Design Principles Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <div className="flex items-start">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 mr-4" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              uinkits Date Picker Types
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <p>
                <strong>Docked Date Picker:</strong> Geschikt voor zowel nabije
                als verre datums met dropdown calendar interface
              </p>
              <p>
                <strong>Modal Date Picker:</strong> Ideaal voor datum ranges
                zoals project periodes
              </p>
              <p>
                <strong>Modal Date Input:</strong> Handmatige datum invoer voor
                snelle entry
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single Date Pickers */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Single Date Pickers
            </h2>

            <div className="space-y-6">
              {/* Basic Date Picker */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🗓️ Basis Datum Selectie
                </h3>
                <DatePicker
                  label="Selecteer Datum"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Kies een datum"
                  helperText="Klik op het kalender icoon of typ de datum"
                />
                {selectedDate && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✅ Geselecteerd: {selectedDate.toLocaleDateString("nl-NL")}
                  </p>
                )}
              </div>

              {/* Birth Date with Restrictions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🎂 Geboortedatum (Met Beperkingen)
                </h3>
                <DatePicker
                  label="Geboortedatum"
                  value={birthDate}
                  onChange={setBirthDate}
                  placeholder="DD/MM/YYYY"
                  maxDate={new Date()} // Can't select future dates
                  minDate={new Date(1900, 0, 1)} // Can't select before 1900
                  helperText="Alleen datums in het verleden zijn toegestaan"
                  required
                />
                {birthDate && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✅ Leeftijd:{" "}
                    {new Date().getFullYear() - birthDate.getFullYear()} jaar
                  </p>
                )}
              </div>

              {/* Future Appointment */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📅 Toekomstige Afspraak
                </h3>
                <DatePicker
                  label="Afspraak Datum"
                  value={appointmentDate}
                  onChange={setAppointmentDate}
                  placeholder="Selecteer toekomstige datum"
                  minDate={new Date()} // Can't select past dates
                  helperText="Alleen toekomstige datums zijn beschikbaar"
                />
                {appointmentDate && (
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    📍 Over{" "}
                    {Math.ceil(
                      (appointmentDate.getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    dagen
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Pickers */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              Date Range Pickers
            </h2>

            <div className="space-y-6">
              {/* Project Period */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🚀 Project Periode
                </h3>
                <DateRangePicker
                  value={projectRange}
                  onChange={setProjectRange}
                  placeholder="Selecteer start- en einddatum"
                  minDate={new Date()}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Kies de periode voor je project
                </p>
                {projectRange.startDate && projectRange.endDate && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✅ Start:{" "}
                      {projectRange.startDate.toLocaleDateString("nl-NL")}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✅ Eind:{" "}
                      {projectRange.endDate.toLocaleDateString("nl-NL")}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      📊 Duur:{" "}
                      {Math.ceil(
                        (projectRange.endDate.getTime() -
                          projectRange.startDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      dagen
                    </p>
                  </div>
                )}
              </div>

              {/* Vacation Period */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🏖️ Vakantie Periode
                </h3>
                <DateRangePicker
                  value={vacationRange}
                  onChange={setVacationRange}
                  placeholder="Wanneer ga je op vakantie?"
                  minDate={new Date()}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Selecteer je vakantieperiode
                </p>
                {vacationRange.startDate && vacationRange.endDate && (
                  <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      🌴 Vakantie van{" "}
                      {vacationRange.startDate.toLocaleDateString("nl-NL")} tot{" "}
                      {vacationRange.endDate.toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                )}
              </div>

              {/* Report Period */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📊 Rapport Periode
                </h3>
                <DateRangePicker
                  value={reportRange}
                  onChange={setReportRange}
                  placeholder="Selecteer rapportage periode"
                  maxDate={new Date()} // Can't select future dates for reports
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Kies de periode voor je rapport (alleen verleden)
                </p>
                {reportRange.startDate && reportRange.endDate && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      📈 Rapport periode:{" "}
                      {Math.ceil(
                        (reportRange.endDate.getTime() -
                          reportRange.startDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      dagen
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          ✨ Component Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              🎨 Design
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Dark mode support</li>
              <li>• Consistent styling</li>
              <li>• Smooth animations</li>
              <li>• Responsive design</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              ⚡ Functionality
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Keyboard navigation</li>
              <li>• Date validation</li>
              <li>• Min/max date limits</li>
              <li>• Quick date selection</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              🔧 Accessibility
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Screen reader support</li>
              <li>• Focus management</li>
              <li>• Error handling</li>
              <li>• Helper text support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          💡 Gebruik in JobFlow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Single Date Picker
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Geboortedatum bij registratie</li>
              <li>• Deadline voor taken</li>
              <li>• Afspraak planning</li>
              <li>• Rapportage datum</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Date Range Picker
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Project start/eind datums</li>
              <li>• Vakantie aanvragen</li>
              <li>• Rapportage periodes</li>
              <li>• Beschikbaarheid planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
