import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  TagIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";

export interface SearchFilter {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "multiselect" | "range";
  options?: Array<{ value: string; label: string; count?: number }>;
  placeholder?: string;
  icon?: React.ReactNode;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export interface SearchSuggestion {
  id: string;
  type: "recent" | "popular" | "suggestion";
  text: string;
  category?: string;
  icon?: React.ReactNode;
  metadata?: string;
}

interface AdvancedSearchProps {
  placeholder?: string;
  filters?: SearchFilter[];
  quickActions?: QuickAction[];
  suggestions?: SearchSuggestion[];
  onSearch: (query: string, filters: Record<string, any>) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  loading?: boolean;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  placeholder = "Zoeken...",
  filters = [],
  quickActions = [],
  suggestions = [],
  onSearch,
  onFilterChange,
  loading = false,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Filter suggestions based on query
    if (query.length > 0) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      // Show recent and popular when no query
      setFilteredSuggestions(
        suggestions
          .filter((s) => s.type === "recent" || s.type === "popular")
          .slice(0, 5)
      );
    }
    setSelectedSuggestionIndex(-1);
  }, [query, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        selectedSuggestionIndex >= 0 &&
        filteredSuggestions[selectedSuggestionIndex]
      ) {
        selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setIsExpanded(false);
      setShowFilters(false);
      inputRef.current?.blur();
    }
  };

  const handleSearch = () => {
    onSearch(query, activeFilters);
    setIsExpanded(false);
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSearch(suggestion.text, activeFilters);
    setIsExpanded(false);
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (value === "" || value === null || value === undefined) {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange?.({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div
        className={`relative transition-all duration-200 ${
          isExpanded ? "shadow-lg" : "shadow-sm"
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          className={`block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            isExpanded ? "rounded-b-none border-b-0" : ""
          }`}
          placeholder={placeholder}
        />

        {/* Filter Toggle & Clear */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}

          {filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 rounded transition-colors relative ${
                showFilters
                  ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg shadow-lg max-h-96 overflow-hidden"
          >
            {/* Quick Actions */}
            {quickActions.length > 0 && query === "" && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Snelle acties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                      {action.shortcut && (
                        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-1 rounded">
                          {action.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedSuggestionIndex
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {suggestion.icon || (
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {suggestion.text}
                        </span>
                        {suggestion.type === "recent" && (
                          <span className="text-xs text-gray-500">Recent</span>
                        )}
                        {suggestion.type === "popular" && (
                          <span className="text-xs text-gray-500">
                            Populair
                          </span>
                        )}
                      </div>
                      {suggestion.metadata && (
                        <p className="text-xs text-gray-500 truncate">
                          {suggestion.metadata}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.length > 0 && filteredSuggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">
                  Geen suggesties gevonden voor "{query}"
                </p>
                <button
                  onClick={handleSearch}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1"
                >
                  Toch zoeken
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-40 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Alles wissen
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filter.icon}
                    <span>{filter.label}</span>
                  </label>

                  {filter.type === "text" && (
                    <input
                      type="text"
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) => updateFilter(filter.key, e.target.value)}
                      placeholder={filter.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  )}

                  {filter.type === "select" && (
                    <select
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) => updateFilter(filter.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Alle</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {option.count !== undefined && ` (${option.count})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Actieve filters:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeFilters).map(([key, value]) => {
                    const filter = filters.find((f) => f.key === key);
                    if (!filter || !value) return null;

                    return (
                      <span
                        key={key}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                      >
                        <span>
                          {filter.label}: {value}
                        </span>
                        <button
                          onClick={() => clearFilter(key)}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Predefined configurations for common search scenarios
export const ProjectSearchFilters: SearchFilter[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    icon: <TagIcon className="h-4 w-4" />,
    options: [
      { value: "ACTIVE", label: "Actief", count: 12 },
      { value: "COMPLETED", label: "Voltooid", count: 45 },
      { value: "CANCELLED", label: "Geannuleerd", count: 3 },
    ],
  },
  {
    key: "company",
    label: "Bedrijf",
    type: "select",
    icon: <BuildingOfficeIcon className="h-4 w-4" />,
    options: [
      { value: "Broers Verhuur", label: "Broers Verhuur" },
      { value: "DCRT Event Decorations", label: "DCRT Event Decorations" },
      { value: "DCRT in Building", label: "DCRT in Building" },
    ],
  },
  {
    key: "assignee",
    label: "Toegewezen aan",
    type: "text",
    icon: <UserGroupIcon className="h-4 w-4" />,
    placeholder: "Naam medewerker...",
  },
];

export const UserSearchFilters: SearchFilter[] = [
  {
    key: "role",
    label: "Rol",
    type: "select",
    icon: <TagIcon className="h-4 w-4" />,
    options: [
      { value: "ADMIN", label: "Administrator" },
      { value: "MANAGER", label: "Manager" },
      { value: "EMPLOYEE", label: "Medewerker" },
      { value: "FREELANCER", label: "Freelancer" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    icon: <ClockIcon className="h-4 w-4" />,
    options: [
      { value: "WORKING", label: "Aan het werk" },
      { value: "BREAK", label: "Pauze" },
      { value: "SICK", label: "Ziek" },
      { value: "VACATION", label: "Vakantie" },
    ],
  },
];

export default AdvancedSearch;
