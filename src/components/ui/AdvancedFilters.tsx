import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FunnelIcon,
  XMarkIcon,
  BookmarkIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  ClockIcon,
  BuildingOfficeIcon,
  TagIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Input from "./Input";
import Button from "./Button";
import DateRangePicker from "./DateRangePicker";

export interface FilterCriteria {
  search: string;
  role: string;
  employeeType: string;
  company: string;
  workTypes: string[];
  salaryRange: {
    min: number | null;
    max: number | null;
    type: "hourlyRate" | "monthlySalary" | "hourlyWage" | "all";
  };
  dateRanges: {
    hiredDate: { startDate: Date | null; endDate: Date | null };
    lastActivity: { startDate: Date | null; endDate: Date | null };
  };
  quickFilters: string[];
  hasContract: boolean | null;
  status: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterCriteria;
  isDefault: boolean;
  createdAt: Date;
}

interface AdvancedFiltersProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  availableWorkTypes: Array<{ id: string; name: string; emoji?: string }>;
  availableCompanies: string[];
  className?: string;
}

const defaultFilters: FilterCriteria = {
  search: "",
  role: "",
  employeeType: "",
  company: "",
  workTypes: [],
  salaryRange: {
    min: null,
    max: null,
    type: "all",
  },
  dateRanges: {
    hiredDate: { startDate: null, endDate: null },
    lastActivity: { startDate: null, endDate: null },
  },
  quickFilters: [],
  hasContract: null,
  status: "",
};

const quickFilterOptions = [
  {
    id: "new_employees",
    label: "Nieuwe medewerkers",
    description: "Aangenomen in de laatste 30 dagen",
    icon: UserGroupIcon,
    color: "blue",
  },
  {
    id: "active_this_week",
    label: "Actief deze week",
    description: "Heeft deze week gewerkt",
    icon: ClockIcon,
    color: "green",
  },
  {
    id: "contract_expiring",
    label: "Contract verloopt binnenkort",
    description: "Contract verloopt binnen 60 dagen",
    icon: CalendarIcon,
    color: "orange",
  },
  {
    id: "high_earners",
    label: "Hoogverdieners",
    description: "Boven gemiddeld salaris",
    icon: CurrencyEuroIcon,
    color: "purple",
  },
  {
    id: "no_contract",
    label: "Geen contract",
    description: "Medewerkers zonder getekend contract",
    icon: XMarkIcon,
    color: "red",
  },
  {
    id: "freelancers_only",
    label: "Alleen freelancers",
    description: "Freelance medewerkers",
    icon: TagIcon,
    color: "indigo",
  },
];

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  availableWorkTypes,
  availableCompanies,
  className = "",
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    loadSavedPresets();
  }, []);

  useEffect(() => {
    calculateActiveFilters();
  }, [filters]);

  const loadSavedPresets = async () => {
    try {
      const response = await fetch("/api/filter-presets");
      if (response.ok) {
        const data = await response.json();
        setSavedPresets(data);
      }
    } catch (error) {
      console.error("Error loading filter presets:", error);
    }
  };

  const calculateActiveFilters = () => {
    let count = 0;

    if (filters.search) count++;
    if (filters.role) count++;
    if (filters.employeeType) count++;
    if (filters.company) count++;
    if (filters.workTypes.length > 0) count++;
    if (filters.salaryRange.min !== null || filters.salaryRange.max !== null)
      count++;
    if (
      filters.dateRanges.hiredDate.startDate ||
      filters.dateRanges.hiredDate.endDate
    )
      count++;
    if (
      filters.dateRanges.lastActivity.startDate ||
      filters.dateRanges.lastActivity.endDate
    )
      count++;
    if (filters.quickFilters.length > 0) count++;
    if (filters.hasContract !== null) count++;
    if (filters.status) count++;

    setActiveFiltersCount(count);
  };

  const updateFilters = (updates: Partial<FilterCriteria>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const toggleQuickFilter = (filterId: string) => {
    const newQuickFilters = filters.quickFilters.includes(filterId)
      ? filters.quickFilters.filter((id) => id !== filterId)
      : [...filters.quickFilters, filterId];

    updateFilters({ quickFilters: newQuickFilters });
  };

  const savePreset = async () => {
    if (!newPresetName.trim()) return;

    try {
      const response = await fetch("/api/filter-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName,
          filters,
        }),
      });

      if (response.ok) {
        const newPreset = await response.json();
        setSavedPresets([...savedPresets, newPreset]);
        setNewPresetName("");
        setShowPresetModal(false);
      }
    } catch (error) {
      console.error("Error saving filter preset:", error);
    }
  };

  const loadPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
  };

  const deletePreset = async (presetId: string) => {
    try {
      const response = await fetch(`/api/filter-presets/${presetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedPresets(savedPresets.filter((p) => p.id !== presetId));
      }
    } catch (error) {
      console.error("Error deleting filter preset:", error);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Geavanceerde Filters
            </h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {activeFiltersCount} actief
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
              >
                Wissen
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              leftIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
            >
              {isExpanded ? "Inklappen" : "Uitklappen"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-4 py-3">
        <Input
          placeholder="Zoek op naam, email, bedrijf..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          variant="outlined"
          inputSize="md"
          className="w-full"
        />
      </div>

      {/* Quick Filters */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {quickFilterOptions.map((option) => {
            const isActive = filters.quickFilters.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleQuickFilter(option.id)}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `bg-${option.color}-100 text-${option.color}-800 dark:bg-${option.color}-900/20 dark:text-${option.color}-300 ring-2 ring-${option.color}-500/20`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
                title={option.description}
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-6">
              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rol
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => updateFilters({ role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Alle rollen</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Medewerker</option>
                    <option value="FREELANCER">Freelancer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type Medewerker
                  </label>
                  <select
                    value={filters.employeeType}
                    onChange={(e) =>
                      updateFilters({ employeeType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Alle types</option>
                    <option value="PERMANENT">Vast personeel</option>
                    <option value="FREELANCER">Freelancers</option>
                    <option value="FLEX_WORKER">Oproepkrachten</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bedrijf
                  </label>
                  <select
                    value={filters.company}
                    onChange={(e) => updateFilters({ company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Alle bedrijven</option>
                    {availableCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilters({ status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Alle statussen</option>
                    <option value="AVAILABLE">Beschikbaar</option>
                    <option value="WORKING">Aan het werk</option>
                    <option value="UNAVAILABLE">Niet beschikbaar</option>
                  </select>
                </div>
              </div>

              {/* Work Types Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Werkzaamheden
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableWorkTypes.map((workType) => {
                    const isSelected = filters.workTypes.includes(
                      workType.name
                    );
                    return (
                      <button
                        key={workType.id}
                        onClick={() => {
                          const newWorkTypes = isSelected
                            ? filters.workTypes.filter(
                                (wt) => wt !== workType.name
                              )
                            : [...filters.workTypes, workType.name];
                          updateFilters({ workTypes: newWorkTypes });
                        }}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 ring-2 ring-purple-500/20"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {workType.emoji && (
                          <span className="mr-2">{workType.emoji}</span>
                        )}
                        {workType.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Salary Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <CurrencyEuroIcon className="h-4 w-4 inline mr-2" />
                  Salaris Bereik
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Type
                    </label>
                    <select
                      value={filters.salaryRange.type}
                      onChange={(e) =>
                        updateFilters({
                          salaryRange: {
                            ...filters.salaryRange,
                            type: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="all">Alle types</option>
                      <option value="hourlyRate">Uurtarief</option>
                      <option value="hourlyWage">Uurloon</option>
                      <option value="monthlySalary">Maandloon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Minimum (€)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.salaryRange.min || ""}
                      onChange={(e) =>
                        updateFilters({
                          salaryRange: {
                            ...filters.salaryRange,
                            min: e.target.value ? Number(e.target.value) : null,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Maximum (€)
                    </label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={filters.salaryRange.max || ""}
                      onChange={(e) =>
                        updateFilters({
                          salaryRange: {
                            ...filters.salaryRange,
                            max: e.target.value ? Number(e.target.value) : null,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <CalendarIcon className="h-4 w-4 inline mr-2" />
                    Aanstellingsdatum
                  </label>
                  <DateRangePicker
                    value={filters.dateRanges.hiredDate}
                    onChange={(range) =>
                      updateFilters({
                        dateRanges: {
                          ...filters.dateRanges,
                          hiredDate: range,
                        },
                      })
                    }
                    placeholder="Selecteer periode"
                    maxDate={new Date()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <ClockIcon className="h-4 w-4 inline mr-2" />
                    Laatste Activiteit
                  </label>
                  <DateRangePicker
                    value={filters.dateRanges.lastActivity}
                    onChange={(range) =>
                      updateFilters({
                        dateRanges: {
                          ...filters.dateRanges,
                          lastActivity: range,
                        },
                      })
                    }
                    placeholder="Selecteer periode"
                    maxDate={new Date()}
                  />
                </div>
              </div>

              {/* Contract Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Contract Status
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: null, label: "Alle" },
                    { value: true, label: "Heeft Contract" },
                    { value: false, label: "Geen Contract" },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      onClick={() =>
                        updateFilters({ hasContract: option.value })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filters.hasContract === option.value
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Presets */}
      {isExpanded && savedPresets.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Opgeslagen Filters
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresetModal(true)}
              leftIcon={<BookmarkIcon className="h-4 w-4" />}
            >
              Huidige Opslaan
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2"
              >
                <button
                  onClick={() => loadPreset(preset)}
                  className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <StarIcon className="h-4 w-4" />
                  <span>{preset.name}</span>
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Filter Preset Opslaan
            </h3>
            <Input
              label="Preset Naam"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Bijv. Actieve Freelancers"
              variant="outlined"
              inputSize="md"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPresetModal(false);
                  setNewPresetName("");
                }}
              >
                Annuleren
              </Button>
              <Button
                variant="primary"
                onClick={savePreset}
                disabled={!newPresetName.trim()}
              >
                Opslaan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
