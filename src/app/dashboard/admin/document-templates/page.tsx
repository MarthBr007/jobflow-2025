"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowUpTrayIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  PrinterIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import VisualTemplateBuilder from "@/components/ui/VisualTemplateBuilder";
import TemplateVersionHistory from "@/components/ui/TemplateVersionHistory";
import EmailTemplateSync from "@/components/ui/EmailTemplateSync";
import DocuSignIntegration from "@/components/ui/DocuSignIntegration";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: "CONTRACT" | "SCHEDULE" | "INVOICE" | "LETTER" | "REPORT";
  category: string;
  content: string;
  variables: string[];
  headerImage?: string;
  footerImage?: string;
  logoImage?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "email" | "phone" | "address";
  required: boolean;
  defaultValue?: string;
  description: string;
}

const TEMPLATE_TYPES = [
  {
    value: "CONTRACT",
    label: "Contracten",
    icon: ClipboardDocumentIcon,
    color: "bg-blue-500",
  },
  {
    value: "SCHEDULE",
    label: "Roosters",
    icon: DocumentTextIcon,
    color: "bg-green-500",
  },
  {
    value: "INVOICE",
    label: "Facturen",
    icon: DocumentTextIcon,
    color: "bg-yellow-500",
  },
  {
    value: "LETTER",
    label: "Brieven",
    icon: EnvelopeIcon,
    color: "bg-purple-500",
  },
  {
    value: "REPORT",
    label: "Rapporten",
    icon: DocumentTextIcon,
    color: "bg-indigo-500",
  },
];

const PREDEFINED_VARIABLES: Record<string, TemplateVariable[]> = {
  CONTRACT: [
    {
      key: "employee_name",
      label: "Naam Medewerker",
      type: "text",
      required: true,
      description: "Volledige naam van de medewerker",
    },
    {
      key: "employee_email",
      label: "Email Medewerker",
      type: "email",
      required: true,
      description: "Email adres van de medewerker",
    },
    {
      key: "employee_phone",
      label: "Telefoon Medewerker",
      type: "phone",
      required: false,
      description: "Telefoonnummer van de medewerker",
    },
    {
      key: "employee_address",
      label: "Adres Medewerker",
      type: "address",
      required: false,
      description: "Woonadres van de medewerker",
    },
    {
      key: "employee_type",
      label: "Type Medewerker",
      type: "text",
      required: true,
      description: "Type (Vast, Freelancer, Oproep)",
    },
    {
      key: "hourly_rate",
      label: "Uurtarief",
      type: "number",
      required: false,
      description: "Uurtarief in euro's",
    },
    {
      key: "start_date",
      label: "Startdatum",
      type: "date",
      required: true,
      description: "Startdatum van het contract",
    },
    {
      key: "contract_duration",
      label: "Contractduur",
      type: "text",
      required: false,
      description: "Duur van het contract",
    },
    {
      key: "job_title",
      label: "Functietitel",
      type: "text",
      required: true,
      description: "Officiële functietitel",
    },
    {
      key: "company_name",
      label: "Bedrijfsnaam",
      type: "text",
      required: true,
      description: "Naam van het bedrijf",
    },
    {
      key: "company_address",
      label: "Bedrijfsadres",
      type: "address",
      required: true,
      description: "Adres van het bedrijf",
    },
    {
      key: "today_date",
      label: "Huidige Datum",
      type: "date",
      required: true,
      description: "Datum van vandaag",
    },
  ],
  SCHEDULE: [
    {
      key: "schedule_date",
      label: "Roosteerdatum",
      type: "date",
      required: true,
      description: "Datum van het rooster",
    },
    {
      key: "employee_name",
      label: "Naam Medewerker",
      type: "text",
      required: true,
      description: "Naam van de medewerker",
    },
    {
      key: "shift_start",
      label: "Begintijd",
      type: "text",
      required: true,
      description: "Starttijd van de dienst",
    },
    {
      key: "shift_end",
      label: "Eindtijd",
      type: "text",
      required: true,
      description: "Eindtijd van de dienst",
    },
    {
      key: "project_name",
      label: "Project Naam",
      type: "text",
      required: false,
      description: "Naam van het project",
    },
    {
      key: "work_location",
      label: "Werklocatie",
      type: "text",
      required: false,
      description: "Locatie waar gewerkt wordt",
    },
    {
      key: "total_hours",
      label: "Totaal Uren",
      type: "number",
      required: true,
      description: "Totaal aantal uren",
    },
    {
      key: "break_time",
      label: "Pauzetijd",
      type: "text",
      required: false,
      description: "Pauzetijd in minuten",
    },
  ],
};

export default function DocumentTemplatesPage() {
  return (
    <PermissionGuard permission="canManageSystemSettings">
      <DocumentTemplatesContent />
    </PermissionGuard>
  );
}

function DocumentTemplatesContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [currentView, setCurrentView] = useState<
    | "templates"
    | "upload"
    | "preview"
    | "fields"
    | "visual"
    | "versions"
    | "email"
    | "docusign"
  >("templates");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    type: "CONTRACT" as DocumentTemplate["type"],
    category: "",
    content: "",
    variables: [] as string[],
    isActive: true,
    isDefault: false,
  });

  // Add custom field management state
  const [customFields, setCustomFields] = useState<TemplateVariable[]>([]);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<TemplateVariable | null>(
    null
  );
  const [previewContent, setPreviewContent] = useState<string>("");
  const [fieldForm, setFieldForm] = useState({
    key: "",
    label: "",
    type: "text" as TemplateVariable["type"],
    required: false,
    description: "",
    defaultValue: "",
    category: "GENERAL" as
      | "GENERAL"
      | "CONTRACT"
      | "SCHEDULE"
      | "INVOICE"
      | "LETTER"
      | "REPORT",
  });

  useEffect(() => {
    fetchTemplates();
    fetchCustomFields();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockTemplates: DocumentTemplate[] = [
        {
          id: "1",
          name: "Standaard Freelancer Contract",
          description: "Standaard contract template voor freelancers",
          type: "CONTRACT",
          category: "Freelancer",
          content: `Beste {{employee_name}},

Hierbij bieden wij u een freelance opdracht aan bij {{company_name}}.

**Contractgegevens:**
- Naam: {{employee_name}}
- Email: {{employee_email}}
- Functie: {{job_title}}
- Uurtarief: €{{hourly_rate}}
- Startdatum: {{start_date}}

Met vriendelijke groet,
{{company_name}}`,
          variables: [
            "employee_name",
            "employee_email",
            "job_title",
            "hourly_rate",
            "start_date",
            "company_name",
          ],
          isActive: true,
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "Admin",
        },
        {
          id: "2",
          name: "Weekrooster Template",
          description: "Standaard template voor week roosters",
          type: "SCHEDULE",
          category: "Rooster",
          content: `**WEEKROOSTER**

Datum: {{schedule_date}}
Medewerker: {{employee_name}}

**Dienst Details:**
- Starttijd: {{shift_start}}
- Eindtijd: {{shift_end}}
- Totaal uren: {{total_hours}}
- Project: {{project_name}}
- Locatie: {{work_location}}

{{#if break_time}}
Pauze: {{break_time}} minuten
{{/if}}`,
          variables: [
            "schedule_date",
            "employee_name",
            "shift_start",
            "shift_end",
            "total_hours",
            "project_name",
            "work_location",
            "break_time",
          ],
          isActive: true,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "Admin",
        },
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      showToast("Fout bij laden van templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      // Try to load from localStorage first
      const savedFields = localStorage.getItem("jobflow_custom_fields");
      if (savedFields) {
        setCustomFields(JSON.parse(savedFields));
        return;
      }

      // Default custom fields if none saved
      const defaultFields: TemplateVariable[] = [
        {
          key: "custom_company_slogan",
          label: "Bedrijfsslogan",
          type: "text",
          required: false,
          description: "Slogan van het bedrijf voor op documenten",
          defaultValue: "Uw partner in werk en succes",
        },
        {
          key: "custom_reference_number",
          label: "Referentienummer",
          type: "text",
          required: false,
          description: "Uniek referentienummer voor documenten",
        },
        {
          key: "custom_department",
          label: "Afdeling",
          type: "text",
          required: false,
          description: "Afdeling waar medewerker wordt ingedeeld",
        },
        {
          key: "custom_manager_name",
          label: "Manager Naam",
          type: "text",
          required: false,
          description: "Naam van de direct leidinggevende",
        },
        {
          key: "custom_working_days",
          label: "Werkdagen per Week",
          type: "number",
          required: false,
          description: "Aantal werkdagen per week",
        },
        {
          key: "custom_vacation_days",
          label: "Vakantiedagen",
          type: "number",
          required: false,
          description: "Aantal vakantiedagen per jaar",
        },
      ];
      setCustomFields(defaultFields);
      // Save default fields to localStorage
      localStorage.setItem(
        "jobflow_custom_fields",
        JSON.stringify(defaultFields)
      );
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      showToast("Fout bij laden van custom velden", "error");
    }
  };

  const saveCustomFieldsToStorage = (fields: TemplateVariable[]) => {
    try {
      console.log("Saving custom fields to localStorage:", fields);
      const fieldsJson = JSON.stringify(fields);
      localStorage.setItem("jobflow_custom_fields", fieldsJson);
      console.log("Successfully saved to localStorage");

      // Verify the save worked
      const verification = localStorage.getItem("jobflow_custom_fields");
      if (verification) {
        const parsedVerification = JSON.parse(verification);
        console.log(
          "Verification - fields were saved correctly:",
          parsedVerification
        );
      } else {
        console.error("Verification failed - no data found in localStorage");
      }
    } catch (error) {
      console.error("Error saving custom fields to localStorage:", error);
      showToast("Fout bij opslaan van custom velden", "error");
    }
  };

  const handleCreateTemplate = async () => {
    try {
      // Mock creation
      const newTemplate: DocumentTemplate = {
        id: Date.now().toString(),
        ...templateForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: session?.user?.name || "Admin",
      };

      setTemplates([...templates, newTemplate]);
      setShowCreateModal(false);
      resetForm();
      showToast("Template succesvol aangemaakt", "success");
    } catch (error) {
      console.error("Error creating template:", error);
      showToast("Fout bij aanmaken template", "error");
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const updatedTemplate = {
        ...selectedTemplate,
        ...templateForm,
        updatedAt: new Date().toISOString(),
      };

      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id ? updatedTemplate : t
        )
      );
      setShowEditModal(false);
      setSelectedTemplate(null);
      resetForm();
      showToast("Template succesvol bijgewerkt", "success");
    } catch (error) {
      console.error("Error updating template:", error);
      showToast("Fout bij bijwerken template", "error");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Weet je zeker dat je deze template wilt verwijderen?"))
      return;

    try {
      setTemplates(templates.filter((t) => t.id !== templateId));
      showToast("Template succesvol verwijderd", "success");
    } catch (error) {
      console.error("Error deleting template:", error);
      showToast("Fout bij verwijderen template", "error");
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      type: "CONTRACT",
      category: "",
      content: "",
      variables: [],
      isActive: true,
      isDefault: false,
    });
  };

  const openEditModal = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
    setShowEditModal(true);
  };

  const filteredTemplates = templates.filter(
    (template) => filterType === "ALL" || template.type === filterType
  );

  const getTypeIcon = (type: string) => {
    const typeConfig = TEMPLATE_TYPES.find((t) => t.value === type);
    return typeConfig?.icon || DocumentTextIcon;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = TEMPLATE_TYPES.find((t) => t.value === type);
    return typeConfig?.color || "bg-gray-500";
  };

  const handleCreateField = async () => {
    try {
      console.log("Creating field with form data:", fieldForm);

      const generatedKey = fieldForm.label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      console.log("Generated key:", generatedKey);

      // Check for duplicate keys
      const existingField = customFields.find(
        (field) => field.key === generatedKey
      );
      if (existingField) {
        console.log("Duplicate key found:", existingField);
        showToast(
          "Er bestaat al een veld met deze naam. Kies een andere naam.",
          "error"
        );
        return;
      }

      // Validate required fields
      if (!fieldForm.label.trim() || !fieldForm.description.trim()) {
        console.log("Validation failed: missing required fields");
        showToast("Veld naam en beschrijving zijn verplicht", "error");
        return;
      }

      const newField: TemplateVariable = {
        ...fieldForm,
        key: generatedKey,
      };

      console.log("Creating new field:", newField);

      const updatedFields = [...customFields, newField];
      console.log("Updated fields array:", updatedFields);

      setCustomFields(updatedFields);
      saveCustomFieldsToStorage(updatedFields);
      setShowAddFieldModal(false);
      resetFieldForm();
      showToast("Custom veld succesvol aangemaakt", "success");
    } catch (error) {
      console.error("Error creating field:", error);
      showToast("Fout bij aanmaken veld", "error");
    }
  };

  const handleEditField = async () => {
    if (!editingField) return;

    try {
      const generatedKey = fieldForm.label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      const updatedField: TemplateVariable = {
        ...fieldForm,
        key: generatedKey,
      };

      const updatedFields = customFields.map((field) =>
        field.key === editingField.key ? updatedField : field
      );
      setCustomFields(updatedFields);
      saveCustomFieldsToStorage(updatedFields);
      setEditingField(null);
      resetFieldForm();
      showToast("Custom veld succesvol bijgewerkt", "success");
    } catch (error) {
      console.error("Error updating field:", error);
      showToast("Fout bij bijwerken veld", "error");
    }
  };

  const handleDeleteField = async (fieldKey: string) => {
    if (!confirm("Weet je zeker dat je dit custom veld wilt verwijderen?"))
      return;

    try {
      const updatedFields = customFields.filter(
        (field) => field.key !== fieldKey
      );
      setCustomFields(updatedFields);
      saveCustomFieldsToStorage(updatedFields);
      showToast("Custom veld succesvol verwijderd", "success");
    } catch (error) {
      console.error("Error deleting field:", error);
      showToast("Fout bij verwijderen veld", "error");
    }
  };

  const openEditFieldModal = (field: TemplateVariable) => {
    setEditingField(field);
    setFieldForm({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      description: field.description,
      defaultValue: field.defaultValue || "",
      category: "GENERAL",
    });
    setShowAddFieldModal(true);
  };

  const resetFieldForm = () => {
    setFieldForm({
      key: "",
      label: "",
      type: "text",
      required: false,
      description: "",
      defaultValue: "",
      category: "GENERAL",
    });
  };

  const getAllAvailableFields = () => {
    const predefinedFields = PREDEFINED_VARIABLES.CONTRACT.concat(
      PREDEFINED_VARIABLES.SCHEDULE
    );
    return [...predefinedFields, ...customFields];
  };

  // Custom font upload handler
  const handleFontUpload = async (fontFile: File): Promise<string> => {
    // In a real implementation, this would upload to your storage service
    // For now, we'll create a local URL for demonstration
    return URL.createObjectURL(fontFile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Templates laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Systeeminstellingen",
            href: "/dashboard/admin/system-settings",
          },
          { label: "Document Templates" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Document Templates
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Beheer briefpapier, logo's en document templates voor
                  contracten en roosters
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span>
                      {templates.filter((t) => t.isActive).length} Actief
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    <span>
                      {templates.filter((t) => t.type === "CONTRACT").length}{" "}
                      Contracten
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-purple-500 rounded-full"></span>
                    <span>
                      {templates.filter((t) => t.type === "SCHEDULE").length}{" "}
                      Roosters
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 sm:flex-nowrap">
              <Button
                onClick={() => setCurrentView("upload")}
                leftIcon={
                  <CloudArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                }
                variant="outline"
                size="md"
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
              >
                <span className="sm:hidden">Upload</span>
                <span className="hidden sm:inline">Logo Upload</span>
              </Button>
              <Button
                onClick={() => setCurrentView("preview")}
                leftIcon={<EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                variant="outline"
                size="md"
                className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium"
              >
                <span className="sm:hidden">Preview</span>
                <span className="hidden sm:inline">Voorbeeld</span>
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                variant="primary"
                size="md"
                className="shadow-lg font-medium"
              >
                <span className="sm:hidden">Nieuwe Template</span>
                <span className="hidden sm:inline">Nieuwe Template</span>
              </Button>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
              <button
                onClick={() => setCurrentView("templates")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "templates"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Templates
              </button>

              <button
                onClick={() => setCurrentView("visual")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "visual"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Visual Builder
              </button>

              <button
                onClick={() => setCurrentView("fields")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "fields"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Custom Velden
              </button>

              <button
                onClick={() => setCurrentView("versions")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "versions"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Versie Geschiedenis
              </button>

              <button
                onClick={() => setCurrentView("upload")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "upload"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Media Upload
              </button>

              <button
                onClick={() => setCurrentView("email")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "email"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Email Sync
              </button>

              <button
                onClick={() => setCurrentView("docusign")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "docusign"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                DocuSign
              </button>

              <button
                onClick={() => setCurrentView("preview")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === "preview"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Voorbeeld
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates View */}
      {currentView === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const IconComponent = getTypeIcon(template.type);

            return (
              <Card
                key={template.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 h-12 w-12 ${getTypeColor(
                        template.type
                      )} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {template.name}
                        </h3>
                        {template.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Standaard
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Type:
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {
                              TEMPLATE_TYPES.find(
                                (t) => t.value === template.type
                              )?.label
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Variabelen:
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {template.variables.length} velden
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Status:
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              template.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {template.isActive ? "Actief" : "Inactief"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="Template bewerken"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedTemplate(template)}
                            className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                            title="Template bekijken"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const content = JSON.stringify(template, null, 2);
                              navigator.clipboard.writeText(content);
                              showToast(
                                "Template gekopieerd naar klembord",
                                "success"
                              );
                            }}
                            className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                            title="Template kopiëren"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Template verwijderen"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {format(new Date(template.updatedAt), "dd MMM yyyy", {
                            locale: nl,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Custom Fields View */}
      {currentView === "fields" && (
        <div className="space-y-6">
          {/* Custom Fields Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Custom Template Velden
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Beheer custom velden voor gebruik in document templates
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      {customFields.length} Velden
                    </span>
                    <Button
                      onClick={() => setShowAddFieldModal(true)}
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                      variant="primary"
                      size="sm"
                    >
                      Nieuw Veld
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {customFields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                            {`{{${field.key}}}`}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {field.label}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {field.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              field.type === "text"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : field.type === "number"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : field.type === "date"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : field.type === "email"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {field.type.toUpperCase()}
                          </span>
                          {field.required && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Verplicht
                            </span>
                          )}
                          {field.defaultValue && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Standaard: {field.defaultValue}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditFieldModal(field)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Veld bewerken"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.key)}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Veld verwijderen"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {customFields.length === 0 && (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Geen custom velden
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Voeg custom velden toe om je templates aan te passen
                      </p>
                      <Button
                        onClick={() => setShowAddFieldModal(true)}
                        leftIcon={<PlusIcon className="h-4 w-4" />}
                        variant="primary"
                      >
                        Eerste Veld Toevoegen
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Predefined Fields Reference */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Voorgedefinieerde Velden
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Deze velden zijn standaard beschikbaar in templates
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Contract Velden
                    </h4>
                    <div className="space-y-1">
                      {PREDEFINED_VARIABLES.CONTRACT.slice(0, 5).map(
                        (field) => (
                          <div key={field.key} className="text-xs">
                            <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 rounded">
                              {`{{${field.key}}}`}
                            </span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {field.label}
                            </span>
                          </div>
                        )
                      )}
                      <div className="text-xs text-gray-500">
                        ... en {PREDEFINED_VARIABLES.CONTRACT.length - 5} meer
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Rooster Velden
                    </h4>
                    <div className="space-y-1">
                      {PREDEFINED_VARIABLES.SCHEDULE.slice(0, 4).map(
                        (field) => (
                          <div key={field.key} className="text-xs">
                            <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 rounded">
                              {`{{${field.key}}}`}
                            </span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {field.label}
                            </span>
                          </div>
                        )
                      )}
                      <div className="text-xs text-gray-500">
                        ... en {PREDEFINED_VARIABLES.SCHEDULE.length - 4} meer
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Tip
                  </h5>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Gebruik {`{{veld_naam}}`} in je templates om dynamische
                    waarden toe te voegen
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Visual Template Builder View */}
      {currentView === "visual" && (
        <div className="h-full">
          <VisualTemplateBuilder
            templateVariables={getAllAvailableFields().map((f) => f.key)}
            onSave={(blocks) => {
              console.log("Visual template saved:", blocks);
              showToast("Visual template opgeslagen", "success");
            }}
            onImageUpload={async (file) => {
              // Mock image upload
              return URL.createObjectURL(file);
            }}
          />
        </div>
      )}

      {/* Version History View */}
      {currentView === "versions" && (
        <div className="space-y-6">
          <TemplateVersionHistory
            templateId={selectedTemplate?.id || "current"}
            currentVersion={{
              id: "current",
              templateId: selectedTemplate?.id || "current",
              version: 1,
              content: selectedTemplate?.content || "",
              metadata: {
                name: selectedTemplate?.name || "Current Template",
                description: "Huidige versie",
                author: "System",
                createdAt: new Date().toISOString(),
              },
            }}
            onRestore={(version) => {
              if (selectedTemplate) {
                setSelectedTemplate({
                  ...selectedTemplate,
                  content: version.content,
                });
                showToast(`Hersteld naar versie ${version.version}`, "success");
              }
            }}
            onPreview={(version) => {
              setPreviewContent(version.content);
              setCurrentView("preview");
            }}
            onCreateTag={(versionId, tag) => {
              console.log("Creating tag:", tag, "for version:", versionId);
              return Promise.resolve();
            }}
            onDeleteVersion={(versionId) => {
              console.log("Deleting version:", versionId);
              return Promise.resolve();
            }}
          />
        </div>
      )}

      {/* Email Template Sync View */}
      {currentView === "email" && (
        <div className="space-y-6">
          <EmailTemplateSync
            templates={[]}
            providers={[]}
            onSync={async (providerId, templateIds) => {
              console.log(
                "Syncing templates:",
                templateIds,
                "to provider:",
                providerId
              );
              // Mock sync delay
              await new Promise((resolve) => setTimeout(resolve, 2000));
              showToast("Templates gesynchroniseerd", "success");
            }}
            onConnect={async (provider) => {
              console.log("Connecting to provider:", provider);
              await new Promise((resolve) => setTimeout(resolve, 1000));
              showToast(`Verbonden met ${provider.name}`, "success");
            }}
            onDisconnect={async (providerId) => {
              console.log("Disconnecting provider:", providerId);
              showToast("Provider verbinding verbroken", "info");
            }}
            onSendTest={async (templateId, email) => {
              console.log("Sending test email:", templateId, "to:", email);
              await new Promise((resolve) => setTimeout(resolve, 1000));
              showToast(`Test email verzonden naar ${email}`, "success");
            }}
            onCreateCampaign={async (templateId, recipients) => {
              console.log("Creating campaign:", templateId, "for:", recipients);
              return Promise.resolve();
            }}
          />
        </div>
      )}

      {/* DocuSign Integration View */}
      {currentView === "docusign" && (
        <div className="space-y-6">
          <DocuSignIntegration
            onConnect={async (account) => {
              console.log("Connecting DocuSign account:", account);
              await new Promise((resolve) => setTimeout(resolve, 1000));
              showToast(
                `Verbonden met DocuSign: ${account.accountName}`,
                "success"
              );
            }}
            onDisconnect={async () => {
              console.log("Disconnecting DocuSign");
              showToast("DocuSign verbinding verbroken", "info");
            }}
            onSendForSignature={async (templateId, recipient, message) => {
              console.log(
                "Sending for signature:",
                templateId,
                recipient,
                message
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
              showToast(
                `Handtekening verzoek verzonden naar ${recipient.email}`,
                "success"
              );
              return `req_${Date.now()}`;
            }}
            onCreateTemplate={async (name, content) => {
              console.log("Creating DocuSign template:", name, content);
              return `tpl_${Date.now()}`;
            }}
            onGetSigningUrl={async (requestId) => {
              console.log("Getting signing URL for:", requestId);
              return `https://demo.docusign.net/signing/${requestId}`;
            }}
            onDownloadDocument={async (requestId) => {
              console.log("Downloading document for:", requestId);
              showToast("Document download gestart", "info");
              return `https://demo.docusign.net/documents/${requestId}`;
            }}
          />
        </div>
      )}

      {/* Upload Media View */}
      {currentView === "upload" && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Media Upload
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Upload bedrijfslogo's, briefpapier afbeeldingen en andere media
                voor document templates
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Company Logo
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    PNG, JPG tot 2MB
                  </p>
                  <Button variant="outline" size="sm">
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Briefpapier Header
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    PNG, JPG tot 5MB
                  </p>
                  <Button variant="outline" size="sm">
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Upload Header
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Footer Afbeelding
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    PNG, JPG tot 2MB
                  </p>
                  <Button variant="outline" size="sm">
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Upload Footer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preview View */}
      {currentView === "preview" && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Template Voorbeeld
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Preview van hoe templates eruit zien met echte data
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border">
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Selecteer een template om een preview te bekijken
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nieuwe Template Aanmaken"
        description="Maak een nieuwe document template aan"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Naam"
              value={templateForm.name}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, name: e.target.value })
              }
              placeholder="Bijv. Freelancer Contract"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Type
              </label>
              <select
                value={templateForm.type}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    type: e.target.value as DocumentTemplate["type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {TEMPLATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Beschrijving"
            value={templateForm.description}
            onChange={(e) =>
              setTemplateForm({ ...templateForm, description: e.target.value })
            }
            placeholder="Korte beschrijving van de template"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Inhoud
            </label>
            <RichTextEditor
              value={templateForm.content}
              onChange={(value) =>
                setTemplateForm({ ...templateForm, content: value })
              }
              placeholder="Begin met typen... Gebruik de toolbar voor opmaak en variabelen voor dynamische waarden"
              templateVariables={[
                ...(PREDEFINED_VARIABLES[templateForm.type] || []).map(
                  (v) => v.key
                ),
                ...customFields.map((f) => f.key),
              ]}
              allowFileUpload={true}
              allowFontCustomization={true}
              onFontUpload={handleFontUpload}
              minHeight={300}
              maxHeight={500}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={templateForm.isActive}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Template actief
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={templateForm.isDefault}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    isDefault: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Standaard template
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={() => setShowCreateModal(false)} variant="outline">
              Annuleren
            </Button>
            <Button onClick={handleCreateTemplate} variant="primary">
              Template Aanmaken
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Template Bewerken"
        description={`Bewerk "${selectedTemplate?.name}"`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Naam"
              value={templateForm.name}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, name: e.target.value })
              }
              placeholder="Bijv. Freelancer Contract"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Type
              </label>
              <select
                value={templateForm.type}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    type: e.target.value as DocumentTemplate["type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {TEMPLATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Beschrijving"
            value={templateForm.description}
            onChange={(e) =>
              setTemplateForm({ ...templateForm, description: e.target.value })
            }
            placeholder="Korte beschrijving van de template"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Inhoud
            </label>
            <RichTextEditor
              value={templateForm.content}
              onChange={(value) =>
                setTemplateForm({ ...templateForm, content: value })
              }
              placeholder="Begin met typen... Gebruik de toolbar voor opmaak en variabelen voor dynamische waarden"
              templateVariables={[
                ...(PREDEFINED_VARIABLES[templateForm.type] || []).map(
                  (v) => v.key
                ),
                ...customFields.map((f) => f.key),
              ]}
              allowFileUpload={true}
              allowFontCustomization={true}
              onFontUpload={handleFontUpload}
              minHeight={300}
              maxHeight={500}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={templateForm.isActive}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Template actief
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={templateForm.isDefault}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    isDefault: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Standaard template
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={() => setShowEditModal(false)} variant="outline">
              Annuleren
            </Button>
            <Button onClick={handleEditTemplate} variant="primary">
              Template Bijwerken
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Custom Field Modal */}
      <Modal
        isOpen={showAddFieldModal}
        onClose={() => {
          setShowAddFieldModal(false);
          setEditingField(null);
          resetFieldForm();
        }}
        title={editingField ? "Custom Veld Bewerken" : "Nieuw Custom Veld"}
        description={
          editingField
            ? `Bewerk "${editingField.label}"`
            : "Voeg een nieuw custom veld toe voor templates"
        }
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Veld Naam"
              value={fieldForm.label}
              onChange={(e) =>
                setFieldForm({ ...fieldForm, label: e.target.value })
              }
              placeholder="Bijv. Bedrijfsslogan"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Veld Key (automatisch)
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-600 dark:text-gray-400">
                {fieldForm.label
                  ? `{{${fieldForm.label
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, "")}}}`
                  : "{{veld_key}}"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Veld Type
              </label>
              <select
                value={fieldForm.type}
                onChange={(e) =>
                  setFieldForm({
                    ...fieldForm,
                    type: e.target.value as TemplateVariable["type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="text">Tekst</option>
                <option value="number">Nummer</option>
                <option value="date">Datum</option>
                <option value="email">Email</option>
                <option value="phone">Telefoon</option>
                <option value="address">Adres</option>
              </select>
            </div>

            <Input
              label="Standaard Waarde (optioneel)"
              value={fieldForm.defaultValue}
              onChange={(e) =>
                setFieldForm({ ...fieldForm, defaultValue: e.target.value })
              }
              placeholder="Standaard waarde..."
            />
          </div>

          <Input
            label="Beschrijving"
            value={fieldForm.description}
            onChange={(e) =>
              setFieldForm({ ...fieldForm, description: e.target.value })
            }
            placeholder="Korte beschrijving van dit veld"
            required
          />

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fieldForm.required}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, required: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Verplicht veld
              </span>
            </label>
          </div>

          {/* Field Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Voorbeeld in Template
            </h4>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border font-mono text-sm">
              <span className="text-gray-600 dark:text-gray-400">Beste </span>
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1 rounded">
                {fieldForm.label
                  ? `{{${fieldForm.label
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, "")}}}`
                  : "{{veld_key}}"}
              </span>
              <span className="text-gray-600 dark:text-gray-400">,</span>
              <br />
              <span className="text-gray-600 dark:text-gray-400">
                Uw {fieldForm.label || "veld"} wordt gebruikt in dit document...
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => {
                setShowAddFieldModal(false);
                setEditingField(null);
                resetFieldForm();
              }}
              variant="outline"
            >
              Annuleren
            </Button>
            <Button
              onClick={editingField ? handleEditField : handleCreateField}
              variant="primary"
              disabled={!fieldForm.label || !fieldForm.description}
            >
              {editingField ? "Veld Bijwerken" : "Veld Aanmaken"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
