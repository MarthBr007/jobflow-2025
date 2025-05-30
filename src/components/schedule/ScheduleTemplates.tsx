"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookmarkIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  category: "daily" | "weekly" | "project" | "special";
  shifts: TemplateShift[];
  createdAt: string;
  usageCount: number;
}

interface TemplateShift {
  id: string;
  role: string;
  startTime: string;
  endTime: string;
  count: number;
  requirements?: string[];
  notes?: string;
}

interface ScheduleTemplatesProps {
  onApplyTemplate: (template: ScheduleTemplate, date: string) => void;
  onCreateTemplate: (shifts: any[]) => void;
}

export default function ScheduleTemplates({
  onApplyTemplate,
  onCreateTemplate,
}: ScheduleTemplatesProps) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ScheduleTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "daily" as const,
  });

  // Mock data - in real app this would come from API
  const templates: ScheduleTemplate[] = [
    {
      id: "1",
      name: "Standaard Werkdag",
      description: "Normale werkdag met basis bezetting",
      category: "daily",
      usageCount: 45,
      createdAt: "2024-01-15",
      shifts: [
        {
          id: "1",
          role: "chauffeur",
          startTime: "08:00",
          endTime: "16:00",
          count: 2,
          requirements: ["Rijbewijs C", "ADR certificaat"],
        },
        {
          id: "2",
          role: "wasstraat",
          startTime: "09:00",
          endTime: "17:00",
          count: 3,
        },
        {
          id: "3",
          role: "orderpicker",
          startTime: "09:00",
          endTime: "18:00",
          count: 4,
          requirements: ["Heftruckcertificaat"],
        },
      ],
    },
    {
      id: "2",
      name: "Weekend Dienst",
      description: "Verminderde bezetting voor weekenden",
      category: "weekly",
      usageCount: 12,
      createdAt: "2024-01-20",
      shifts: [
        {
          id: "4",
          role: "chauffeur",
          startTime: "08:00",
          endTime: "14:00",
          count: 1,
        },
        {
          id: "5",
          role: "beveiliging",
          startTime: "18:00",
          endTime: "06:00",
          count: 1,
          notes: "Nachtdienst",
        },
      ],
    },
    {
      id: "3",
      name: "Event Setup",
      description: "Grote evenement opbouw",
      category: "project",
      usageCount: 8,
      createdAt: "2024-02-01",
      shifts: [
        {
          id: "6",
          role: "op en afbouw werkzaamheden",
          startTime: "06:00",
          endTime: "18:00",
          count: 8,
          requirements: ["VCA certificaat", "Fysiek zwaar werk"],
        },
        {
          id: "7",
          role: "technische dienst",
          startTime: "08:00",
          endTime: "20:00",
          count: 3,
          requirements: ["Elektrotechnische kennis"],
        },
        {
          id: "8",
          role: "chauffeur",
          startTime: "05:00",
          endTime: "22:00",
          count: 4,
          requirements: ["Rijbewijs C+E", "Beschikbaar hele dag"],
        },
      ],
    },
    {
      id: "4",
      name: "Feestdag Basis",
      description: "Minimale bezetting voor feestdagen",
      category: "special",
      usageCount: 6,
      createdAt: "2024-02-10",
      shifts: [
        {
          id: "9",
          role: "beveiliging",
          startTime: "08:00",
          endTime: "20:00",
          count: 1,
        },
        {
          id: "10",
          role: "klantenservice",
          startTime: "10:00",
          endTime: "15:00",
          count: 1,
          notes: "Alleen voor noodgevallen",
        },
      ],
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "daily":
        return "📅";
      case "weekly":
        return "🗓️";
      case "project":
        return "🚧";
      case "special":
        return "🎉";
      default:
        return "📋";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "daily":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "weekly":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "project":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "special":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "daily":
        return "Dagelijks";
      case "weekly":
        return "Wekelijks";
      case "project":
        return "Project";
      case "special":
        return "Speciaal";
      default:
        return category;
    }
  };

  const calculateTotalHours = (shifts: TemplateShift[]) => {
    return shifts.reduce((total, shift) => {
      const start = new Date(`2024-01-01T${shift.startTime}`);
      const end = new Date(`2024-01-01T${shift.endTime}`);
      let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Handle overnight shifts
      if (hours < 0) {
        hours += 24;
      }

      return total + hours * shift.count;
    }, 0);
  };

  const getTotalWorkers = (shifts: TemplateShift[]) => {
    return shifts.reduce((total, shift) => total + shift.count, 0);
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ScheduleTemplate[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Rooster Templates
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gebruik bestaande templates voor snelle roosterplanning
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          variant="primary"
          size="md"
        >
          Nieuwe Template
        </Button>
      </div>

      {/* Templates by Category */}
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              {getCategoryLabel(category)}
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({categoryTemplates.length} templates)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowTemplateModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BookmarkIcon className="h-5 w-5 text-gray-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h5>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(
                      template.category
                    )}`}
                  >
                    {getCategoryLabel(template.category)}
                  </span>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getTotalWorkers(template.shifts)} personen
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {calculateTotalHours(template.shifts).toFixed(1)}h
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {template.shifts.slice(0, 2).map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {shift.role} ({shift.count}x)
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                  ))}
                  {template.shifts.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      +{template.shifts.length - 2} meer...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {template.usageCount}x gebruikt
                  </span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyTemplate(
                        template,
                        new Date().toISOString().split("T")[0]
                      );
                    }}
                    variant="outline"
                    size="sm"
                    leftIcon={<DocumentDuplicateIcon className="h-4 w-4" />}
                  >
                    Toepassen
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Template Detail Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate?.name || "Template Details"}
        description="Bekijk template details en pas toe op gewenste datum"
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(
                    selectedTemplate.category
                  )}`}
                >
                  {getCategoryLabel(selectedTemplate.category)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTemplate.usageCount}x gebruikt
                </span>
              </div>
              {selectedTemplate.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Diensten in deze template
              </h4>
              {selectedTemplate.shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {shift.role}
                    </h5>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {shift.count} personen
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                  </div>

                  {shift.requirements && shift.requirements.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vereisten:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {shift.requirements.map((req, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {shift.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {shift.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Totaal: {getTotalWorkers(selectedTemplate.shifts)} personen •{" "}
                {calculateTotalHours(selectedTemplate.shifts).toFixed(1)} uur
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    const date = prompt(
                      "Voer datum in (YYYY-MM-DD):",
                      new Date().toISOString().split("T")[0]
                    );
                    if (date) {
                      onApplyTemplate(selectedTemplate, date);
                      setShowTemplateModal(false);
                    }
                  }}
                  variant="primary"
                  leftIcon={<DocumentDuplicateIcon className="h-4 w-4" />}
                >
                  Template Toepassen
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nieuwe Template Maken"
        description="Maak een nieuwe template van huidige rooster"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Template Naam"
            value={newTemplate.name}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, name: e.target.value })
            }
            placeholder="Bijv. Drukke Maandag"
          />

          <Input
            label="Beschrijving (optioneel)"
            value={newTemplate.description}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, description: e.target.value })
            }
            placeholder="Beschrijving van deze template..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categorie
            </label>
            <select
              value={newTemplate.category}
              onChange={(e) =>
                setNewTemplate({
                  ...newTemplate,
                  category: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="daily">Dagelijks</option>
              <option value="weekly">Wekelijks</option>
              <option value="project">Project</option>
              <option value="special">Speciaal</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={() => setShowCreateModal(false)} variant="outline">
              Annuleren
            </Button>
            <Button
              onClick={() => {
                // In real app, this would save the current schedule as a template
                alert("Template opgeslagen! (Demo functie)");
                setShowCreateModal(false);
                setNewTemplate({
                  name: "",
                  description: "",
                  category: "daily",
                });
              }}
              variant="primary"
              disabled={!newTemplate.name.trim()}
            >
              Template Opslaan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
