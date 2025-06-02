"use client";

import { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CloudArrowUpIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  EyeIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Toast from "./Toast";
import { useToast } from "@/hooks/useToast";

interface Contract {
  id: string;
  contractType: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  salary?: string;
  notes?: string;
  signedDate?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ContractManagementProps {
  userId: string;
  userName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const contractTypeLabels: Record<string, string> = {
  PERMANENT_FULL_TIME: "🏢 Vast contract voltijd",
  PERMANENT_PART_TIME: "🏢 Vast contract deeltijd",
  TEMPORARY_FULL_TIME: "⏰ Tijdelijk contract voltijd",
  TEMPORARY_PART_TIME: "⏰ Tijdelijk contract deeltijd",
  FREELANCE: "💼 Freelance overeenkomst",
  ZERO_HOURS: "📞 0-urencontract",
  INTERNSHIP: "🎓 Stage overeenkomst",
  PROBATION: "🔍 Proeftijd contract",
};

const contractStatusLabels: Record<string, string> = {
  NONE: "Geen contract",
  DRAFT: "📝 Concept",
  PENDING_SIGNATURE: "✍️ Wacht op ondertekening",
  ACTIVE: "✅ Actief",
  EXPIRED: "⏰ Verlopen",
  TERMINATED: "❌ Beëindigd",
  SUSPENDED: "⏸️ Opgeschort",
};

const contractStatusColors: Record<string, string> = {
  NONE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  DRAFT:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PENDING_SIGNATURE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  TERMINATED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  SUSPENDED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function ContractManagement({
  userId,
  userName,
  userEmail,
  isOpen,
  onClose,
}: ContractManagementProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null
  );
  const [fileUploading, setFileUploading] = useState(false);

  // New states for PDF and email functionality
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showEmailOptions, setShowEmailOptions] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);

  const [formData, setFormData] = useState({
    contractType: "PERMANENT_FULL_TIME",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
    salary: "",
    notes: "",
    signedDate: "",
    file: null as File | null,
  });

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchContracts();
    }
  }, [isOpen]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contractType: "PERMANENT_FULL_TIME",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      salary: "",
      notes: "",
      signedDate: "",
      file: null,
    });
    setSelectedContract(null);
    setShowEditModal(false);
  };

  const handleAddContract = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditContract = (contract: Contract) => {
    setFormData({
      contractType: contract.contractType,
      title: contract.title,
      description: contract.description || "",
      startDate: contract.startDate,
      endDate: contract.endDate || "",
      status: contract.status,
      salary: contract.salary || "",
      notes: contract.notes || "",
      signedDate: contract.signedDate || "",
      file: null,
    });
    setSelectedContract(contract);
    setShowEditModal(true);
  };

  const handleDeleteContract = (contract: Contract) => {
    setContractToDelete(contract);
    setShowDeleteModal(true);
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const contractData: any = { ...formData };

    // Handle file upload if present
    if (formData.file) {
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1];

          contractData.fileContent = base64Data;
          contractData.fileName = formData.file!.name;
          delete contractData.file;

          await submitContract(contractData);
        };
        reader.readAsDataURL(formData.file);
      } catch (error) {
        console.error("Error reading file:", error);
        setLoading(false);
      }
    } else {
      delete contractData.file;
      await submitContract(contractData);
    }
  };

  const submitContract = async (contractData: any) => {
    try {
      const url = selectedContract
        ? `/api/contracts/${selectedContract.id}`
        : "/api/contracts";
      const method = selectedContract ? "PUT" : "POST";

      if (!selectedContract) {
        contractData.userId = userId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        await fetchContracts();
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        showToast(
          selectedContract ? "Contract bijgewerkt" : "Contract aangemaakt",
          "success"
        );
      } else {
        const error = await response.json();
        console.error("Error saving contract:", error);
        showToast(
          `Fout bij opslaan contract: ${error.error || "Onbekende fout"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      showToast(
        "Er is een fout opgetreden bij het opslaan van het contract",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contractToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchContracts();
        setShowDeleteModal(false);
        setContractToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "EXPIRED":
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case "PENDING_SIGNATURE":
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const isContractExpiringSoon = (endDate: string) => {
    if (!endDate) return false;
    const today = new Date();
    const contractEnd = new Date(endDate);
    const daysUntilExpiry = Math.ceil(
      (contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const renderContractForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contract Type and Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contract Type
          </label>
          <select
            value={formData.contractType}
            onChange={(e) =>
              setFormData({ ...formData, contractType: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            {Object.entries(contractTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Contract Titel"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Arbeidscontract 2024"
          required
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Startdatum"
          type="date"
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
          required
        />

        <Input
          label="Einddatum (optioneel)"
          type="date"
          value={formData.endDate}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value })
          }
          helperText="Laat leeg voor onbepaalde tijd"
        />
      </div>

      {/* Status and Salary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            {Object.entries(contractStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Salaris/Tarief"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          placeholder="€3500 per maand / €25 per uur"
        />
      </div>

      {/* Signed Date */}
      <Input
        label="Ondertekend op (optioneel)"
        type="date"
        value={formData.signedDate}
        onChange={(e) =>
          setFormData({ ...formData, signedDate: e.target.value })
        }
      />

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contract Bestand
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-500"
              >
                Upload een bestand
              </label>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
              <span> of sleep hier</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF, DOC, DOCX tot 10MB
            </p>
            {formData.file && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                ✅ {formData.file.name} geselecteerd
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description and Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Beschrijving
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Korte beschrijving van het contract"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notities
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Aanvullende notities over het contract"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
        >
          Annuleren
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || fileUploading}
        >
          {loading
            ? "Bezig..."
            : selectedContract
            ? "Contract Bijwerken"
            : "Contract Toevoegen"}
        </Button>
      </div>
    </form>
  );

  // New function: Generate PDF
  const generatePdf = async (contractId: string) => {
    setGeneratingPdf(contractId);
    try {
      const response = await fetch(
        `/api/contracts/${contractId}/generate-pdf`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        await fetchContracts(); // Refresh to get updated contract with PDF

        // Find the updated contract
        const updatedContract = contracts.find((c) => c.id === contractId);
        if (updatedContract) {
          // Show success message with options
          const action = confirm(
            `✅ PDF is succesvol gegenereerd voor "${updatedContract.title}"!\n\nWil je het contract nu bekijken en eventueel emailen?`
          );

          if (action) {
            // Refresh contracts first to get the latest data
            await fetchContracts();
            // Find the contract again with updated data
            const refreshedContracts = await fetch(
              `/api/contracts?userId=${userId}`
            );
            if (refreshedContracts.ok) {
              const latestContracts = await refreshedContracts.json();
              const latestContract = latestContracts.find(
                (c: Contract) => c.id === contractId
              );
              if (latestContract && latestContract.fileUrl) {
                previewPdf(latestContract);
              }
            }
          }
        } else {
          showToast(
            "PDF succesvol gegenereerd! Ververs de pagina om de nieuwe opties te zien.",
            "success"
          );
        }
      } else {
        const error = await response.json();
        showToast(
          `Fout bij genereren PDF: ${error.error || "Onbekende fout"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast(
        "Er is een fout opgetreden bij het genereren van de PDF",
        "error"
      );
    } finally {
      setGeneratingPdf(null);
    }
  };

  // New function: Send Email
  const sendEmail = async (
    contractId: string,
    emailType: "new" | "signed" | "reminder"
  ) => {
    setSendingEmail(contractId);
    try {
      const response = await fetch(`/api/contracts/${contractId}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailType }),
      });

      if (response.ok) {
        const result = await response.json();
        showToast(`Email versturen: ${result.message}`, "success");
        setShowEmailOptions(null);
        await fetchContracts(); // Refresh to see updated notes
      } else {
        const error = await response.json();
        showToast(
          `Fout bij verzenden email: ${
            error.error || "Fout bij verzenden email"
          }`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
      showToast(
        "Er is een fout opgetreden bij het verzenden van de email",
        "error"
      );
    } finally {
      setSendingEmail(null);
    }
  };

  // New function: Download PDF
  const downloadPdf = (contract: Contract) => {
    if (!contract.fileUrl) {
      showToast("Geen PDF beschikbaar. Genereer eerst een PDF.", "warning");
      return;
    }

    const link = document.createElement("a");
    link.href = contract.fileUrl;
    link.download = contract.fileName || `${contract.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New function: Preview PDF
  const previewPdf = (contract: Contract) => {
    if (!contract.fileUrl) {
      showToast("Geen PDF beschikbaar. Genereer eerst een PDF.", "warning");
      return;
    }

    setPreviewContract(contract);
    setPreviewPdfUrl(contract.fileUrl);
    setShowPdfPreview(true);
  };

  return (
    <>
      {/* Main Contract Management Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`📄 Contract Beheer - ${userName}`}
        description="Beheer alle contracten voor deze medewerker"
        size="xl"
      >
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span>Medewerker: {userName}</span>
              <span className="ml-4">Email: {userEmail}</span>
            </div>
            <Button
              onClick={handleAddContract}
              leftIcon={<PlusIcon className="h-4 w-4" />}
              variant="primary"
              size="sm"
            >
              Nieuw Contract
            </Button>
          </div>

          {/* Contracts List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Contracten laden...
              </p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Geen contracten gevonden
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Voeg het eerste contract toe voor deze medewerker.
              </p>
              <Button
                onClick={handleAddContract}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                variant="primary"
              >
                Eerste Contract Toevoegen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${
                    contract.status === "ACTIVE"
                      ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {contract.title}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            contractStatusColors[contract.status]
                          }`}
                        >
                          {getContractStatusIcon(contract.status)}
                          <span className="ml-1">
                            {contractStatusLabels[contract.status]}
                          </span>
                        </span>
                        {isContractExpiringSoon(contract.endDate || "") && (
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            ⚠️ Verloopt binnenkort
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {contractTypeLabels[contract.contractType]}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Startdatum:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {format(
                              new Date(contract.startDate),
                              "dd MMM yyyy",
                              { locale: nl }
                            )}
                          </span>
                        </div>
                        {contract.endDate && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Einddatum:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {format(
                                new Date(contract.endDate),
                                "dd MMM yyyy",
                                { locale: nl }
                              )}
                            </span>
                          </div>
                        )}
                        {contract.salary && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Salaris:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {contract.salary}
                            </span>
                          </div>
                        )}
                      </div>

                      {contract.fileName && (
                        <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          <span>{contract.fileName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {/* PDF Actions */}
                      {contract.fileUrl ? (
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => previewPdf(contract)}
                            variant="outline"
                            size="sm"
                            leftIcon={<EyeIcon className="h-4 w-4" />}
                            className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                          >
                            Bekijken
                          </Button>
                          <Button
                            onClick={() => downloadPdf(contract)}
                            variant="outline"
                            size="sm"
                            leftIcon={
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            }
                            className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                          >
                            Download
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-1">
                          <Button
                            onClick={() => generatePdf(contract.id)}
                            variant="primary"
                            size="sm"
                            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                            loading={generatingPdf === contract.id}
                            className="bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
                          >
                            {generatingPdf === contract.id
                              ? "PDF wordt gemaakt..."
                              : "🚀 PDF Genereren"}
                          </Button>
                          <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Genereer eerst PDF voor email opties
                          </span>
                        </div>
                      )}

                      {/* Email Action - only show if PDF exists */}
                      {contract.fileUrl && (
                        <div className="relative">
                          <Button
                            onClick={() =>
                              setShowEmailOptions(
                                showEmailOptions === contract.id
                                  ? null
                                  : contract.id
                              )
                            }
                            variant="outline"
                            size="sm"
                            leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                            rightIcon={<ChevronDownIcon className="h-3 w-3" />}
                            loading={sendingEmail === contract.id}
                            className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                          >
                            {sendingEmail === contract.id
                              ? "Verzenden..."
                              : "📧 Email"}
                          </Button>

                          {showEmailOptions === contract.id && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  📧 Contract Emailen
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Naar: {userEmail}
                                </p>
                              </div>
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={() => sendEmail(contract.id, "new")}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                                >
                                  <span>📄</span>
                                  <div>
                                    <div className="font-medium">
                                      Nieuw contract
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Voor ondertekening
                                    </div>
                                  </div>
                                </button>
                                <button
                                  onClick={() =>
                                    sendEmail(contract.id, "reminder")
                                  }
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                                >
                                  <span>⏰</span>
                                  <div>
                                    <div className="font-medium">
                                      Herinnering
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Voor niet-ondertekende contracten
                                    </div>
                                  </div>
                                </button>
                                <button
                                  onClick={() =>
                                    sendEmail(contract.id, "signed")
                                  }
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                                >
                                  <span>✅</span>
                                  <div>
                                    <div className="font-medium">
                                      Ondertekend contract
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Ter bevestiging
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Edit/Delete Actions */}
                      <div className="flex space-x-1 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
                        <Button
                          onClick={() => handleEditContract(contract)}
                          variant="outline"
                          size="sm"
                          leftIcon={<PencilIcon className="h-4 w-4" />}
                        >
                          Bewerken
                        </Button>
                        <Button
                          onClick={() => handleDeleteContract(contract)}
                          variant="outline"
                          size="sm"
                          leftIcon={<TrashIcon className="h-4 w-4" />}
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          Verwijderen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Add Contract Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="📄 Nieuw Contract Toevoegen"
        description={`Voeg een nieuw contract toe voor ${userName}`}
        size="xl"
      >
        {renderContractForm()}
      </Modal>

      {/* Edit Contract Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="📝 Contract Bewerken"
        description={`Bewerk contract voor ${userName}`}
        size="xl"
      >
        {renderContractForm()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setContractToDelete(null);
        }}
        title="🗑️ Contract Verwijderen"
        description={`Weet je zeker dat je het contract "${contractToDelete?.title}" wilt verwijderen?`}
        size="sm"
        type="error"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Deze actie kan niet ongedaan worden gemaakt. Het contract en
                  alle bijbehorende gegevens worden permanent verwijderd.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setContractToDelete(null);
              }}
              variant="outline"
            >
              Annuleren
            </Button>
            <Button
              onClick={confirmDeleteContract}
              variant="destructive"
              disabled={loading}
            >
              {loading ? "Verwijderen..." : "Definitief Verwijderen"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      {showPdfPreview && previewContract && previewPdfUrl && (
        <Modal
          isOpen={showPdfPreview}
          onClose={() => {
            setShowPdfPreview(false);
            setPreviewPdfUrl(null);
            setPreviewContract(null);
          }}
          title={`📄 Contract Preview: ${previewContract.title}`}
          size="full"
        >
          <div className="space-y-4">
            {/* Preview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {previewContract.title}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Voor: {userName} ({userEmail})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPdf(previewContract)}
                  leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                >
                  Download
                </Button>

                {/* Email Options */}
                <div className="relative">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setShowEmailOptions(
                        showEmailOptions === previewContract.id
                          ? null
                          : previewContract.id
                      )
                    }
                    leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                    rightIcon={<ChevronDownIcon className="h-3 w-3" />}
                    loading={sendingEmail === previewContract.id}
                  >
                    Email Versturen
                  </Button>

                  {showEmailOptions === previewContract.id && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-2">
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => {
                            sendEmail(previewContract.id, "new");
                          }}
                        >
                          📄 Nieuw contract versturen
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => {
                            sendEmail(previewContract.id, "reminder");
                          }}
                        >
                          ⏰ Herinnering versturen
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => {
                            sendEmail(previewContract.id, "signed");
                          }}
                        >
                          ✅ Ondertekend contract versturen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="w-full h-[600px] border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full"
                title="PDF Preview"
                style={{ border: "none" }}
              />
            </div>

            {/* Info Section */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                    Contract Klaar voor Verzending
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Het contract is gegenereerd en klaar om te versturen. Je
                    kunt de PDF downloaden of direct per email versturen naar{" "}
                    {userName} ({userEmail}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Click outside to close email dropdowns */}
      {showEmailOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmailOptions(null)}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}
