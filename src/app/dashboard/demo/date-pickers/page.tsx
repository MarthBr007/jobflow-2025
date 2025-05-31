"use client";

import { useState } from "react";
import {
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SparklesIcon,
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
  const [meetingDateTime, setMeetingDateTime] = useState<Date | null>(null);

  // Context-aware date pickers
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
  const [vacationDate, setVacationDate] = useState<Date | null>(null);
  const [archiveDate, setArchiveDate] = useState<Date | null>(null);

  // Different sizes and variants
  const [smallDate, setSmallDate] = useState<Date | null>(null);
  const [mediumDate, setMediumDate] = useState<Date | null>(null);
  const [largeDate, setLargeDate] = useState<Date | null>(null);
  const [modalDate, setModalDate] = useState<Date | null>(null);

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
    setMeetingDateTime(null);
    setProjectStartDate(null);
    setVacationDate(null);
    setArchiveDate(null);
    setSmallDate(null);
    setMediumDate(null);
    setLargeDate(null);
    setModalDate(null);
    setProjectRange({ startDate: null, endDate: null });
    setVacationRange({ startDate: null, endDate: null });
    setReportRange({ startDate: null, endDate: null });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Demo", href: "/dashboard/demo" },
          { label: "Date Pickers" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            📅 Enhanced Date Pickers
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Demonstratie van verbeterde date pickers geïnspireerd door uinkits
            design principles
          </p>
        </div>
        <Button
          onClick={clearAllDates}
          variant="outline"
          leftIcon={<ClockIcon className="h-4 w-4" />}
        >
          Reset Alle Datums
        </Button>
      </div>

      {/* uinkits Principles Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <div className="flex items-start">
          <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
              🎨 uinkits Date Picker Principles
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-300">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📱 Context-Aware</h4>
                <p>
                  Smart presets based on use case: near-future voor deadlines,
                  far-future voor planning
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🎯 Mobile-First</h4>
                <p>
                  Touch-friendly targets, modal fallback voor kleine schermen,
                  responsive design
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">⚡ Intuitive UX</h4>
                <p>
                  Multi-view navigation, keyboard shortcuts, error prevention
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Context-Aware Date Pickers */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              Context-Aware Pickers
            </h2>

            <div className="space-y-6">
              {/* Near Future Context */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🚀 Project Start (Near Future)
                </h3>
                <DatePicker
                  label="Project Startdatum"
                  value={projectStartDate}
                  onChange={setProjectStartDate}
                  placeholder="Kies startdatum"
                  context="near-future"
                  minDate={new Date()}
                  helperText="Presets: Vandaag, Morgen, Volgende week"
                />
                {projectStartDate && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✅ Project start:{" "}
                    {projectStartDate.toLocaleDateString("nl-NL")}
                  </p>
                )}
              </div>

              {/* Far Future Context */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🏖️ Vakantie Planning (Far Future)
                </h3>
                <DatePicker
                  label="Vakantie Datum"
                  value={vacationDate}
                  onChange={setVacationDate}
                  placeholder="Plan je vakantie"
                  context="far-future"
                  minDate={new Date()}
                  helperText="Presets: 1, 3, 6 maanden vooruit"
                />
                {vacationDate && (
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    🌴 Vakantie over{" "}
                    {Math.ceil(
                      (vacationDate.getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    dagen
                  </p>
                )}
              </div>

              {/* Past Context */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📚 Archief Datum (Past)
                </h3>
                <DatePicker
                  label="Document Datum"
                  value={archiveDate}
                  onChange={setArchiveDate}
                  placeholder="Selecteer archief datum"
                  context="past"
                  maxDate={new Date()}
                  helperText="Alleen datums in het verleden"
                />
                {archiveDate && (
                  <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                    📄 Document van{" "}
                    {Math.floor(
                      (new Date().getTime() - archiveDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    dagen geleden
                  </p>
                )}
              </div>

              {/* DateTime Picker */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  ⏰ Meeting met Tijd
                </h3>
                <DatePicker
                  label="Meeting Datum & Tijd"
                  value={meetingDateTime}
                  onChange={setMeetingDateTime}
                  placeholder="Kies datum en tijd"
                  showTimeSelect={true}
                  context="near-future"
                  minDate={new Date()}
                  helperText="Inclusief tijd selectie"
                />
                {meetingDateTime && (
                  <p className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                    📅 Meeting: {meetingDateTime.toLocaleString("nl-NL")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Size and Variant Demos */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Sizes & Variants
            </h2>

            <div className="space-y-6">
              {/* Different Sizes */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  📏 Verschillende Groottes
                </h3>
                <div className="space-y-4">
                  <DatePicker
                    label="Small Size"
                    value={smallDate}
                    onChange={setSmallDate}
                    placeholder="Klein formaat"
                    size="sm"
                  />
                  <DatePicker
                    label="Medium Size (Default)"
                    value={mediumDate}
                    onChange={setMediumDate}
                    placeholder="Medium formaat"
                    size="md"
                  />
                  <DatePicker
                    label="Large Size"
                    value={largeDate}
                    onChange={setLargeDate}
                    placeholder="Groot formaat"
                    size="lg"
                  />
                </div>
              </div>

              {/* Modal Variant */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📱 Modal Variant (Mobile-Friendly)
                </h3>
                <DatePicker
                  label="Modal Date Picker"
                  value={modalDate}
                  onChange={setModalDate}
                  placeholder="Opens in modal"
                  variant="modal"
                  context="near-future"
                  helperText="Opent in fullscreen modal, ideaal voor mobiel"
                />
                {modalDate && (
                  <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                    📲 Modal geselecteerd:{" "}
                    {modalDate.toLocaleDateString("nl-NL")}
                  </p>
                )}
              </div>

              {/* Classic Examples */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  🎯 Klassieke Voorbeelden
                </h3>
                <div className="space-y-4">
                  {/* Basic Date Picker */}
                  <DatePicker
                    label="Basis Datum"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="Kies een datum"
                    helperText="Standard docked date picker"
                  />

                  {/* Birth Date with Restrictions */}
                  <DatePicker
                    label="Geboortedatum"
                    value={birthDate}
                    onChange={setBirthDate}
                    placeholder="DD/MM/YYYY"
                    maxDate={new Date()}
                    minDate={new Date(1900, 0, 1)}
                    helperText="Alleen verleden datums toegestaan"
                    required
                  />

                  {/* Future Appointment */}
                  <DatePicker
                    label="Toekomstige Afspraak"
                    value={appointmentDate}
                    onChange={setAppointmentDate}
                    placeholder="Selecteer toekomstige datum"
                    minDate={new Date()}
                    context="near-future"
                    helperText="Met handige presets voor nabije toekomst"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Pickers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Date Range Pickers
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Period */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              🚀 Project Periode
            </h3>
            <DateRangePicker
              value={projectRange}
              onChange={setProjectRange}
              placeholder="Selecteer project periode"
              minDate={new Date()}
            />
            {projectRange.startDate && projectRange.endDate && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🗓️ Project:{" "}
                  {projectRange.startDate.toLocaleDateString("nl-NL")} -{" "}
                  {projectRange.endDate.toLocaleDateString("nl-NL")}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Duur:{" "}
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
            {vacationRange.startDate && vacationRange.endDate && (
              <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  🌴 Vakantie:{" "}
                  {vacationRange.startDate.toLocaleDateString("nl-NL")} -{" "}
                  {vacationRange.endDate.toLocaleDateString("nl-NL")}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {Math.ceil(
                    (vacationRange.endDate.getTime() -
                      vacationRange.startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  dagen vrij
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
              placeholder="Selecteer rapport periode"
              maxDate={new Date()}
            />
            {reportRange.startDate && reportRange.endDate && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  📈 Rapport:{" "}
                  {reportRange.startDate.toLocaleDateString("nl-NL")} -{" "}
                  {reportRange.endDate.toLocaleDateString("nl-NL")}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Historische data van{" "}
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

      {/* Features Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
        <div className="flex items-start">
          <ComputerDesktopIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-3">
              ✨ Nieuwe Features (uinkits-geïnspireerd)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-green-800 dark:text-green-300">
              <div>
                <h4 className="font-semibold mb-2">🎯 Context-Aware Presets</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Near-future: Vandaag, Morgen, Volgende week</li>
                  <li>• Far-future: 1, 3, 6 maanden vooruit</li>
                  <li>• Automatisch gebaseerd op use case</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📱 Mobile Optimizations</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Grotere touch targets op mobiel</li>
                  <li>• Modal fallback voor kleine schermen</li>
                  <li>• 16px font-size (prevent zoom)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚡ Enhanced UX</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Multi-view navigatie (days/months/years)</li>
                  <li>• Keyboard shortcuts (Enter, Escape, Arrow)</li>
                  <li>• DateTime picker support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎨 Visual Improvements</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Hover animations en micro-interactions</li>
                  <li>• Better today indicator met ring</li>
                  <li>• Consistent spacing en typography</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔧 Developer Experience</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Flexible size options (sm/md/lg)</li>
                  <li>• Context prop voor smart presets</li>
                  <li>• Better TypeScript support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">♿ Accessibility</h4>
                <ul className="space-y-1 text-xs">
                  <li>• ARIA labels en roles</li>
                  <li>• Keyboard navigation</li>
                  <li>• Screen reader friendly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
