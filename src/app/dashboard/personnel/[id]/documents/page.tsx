"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  IdentificationIcon,
  CurrencyEuroIcon,
  KeyIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeType: string;
  company: string;
  role: string;
}

interface Document {
  id: string;
  type: string;
  title: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  status: "active" | "archived";
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  required: boolean;
  forFreelancers: boolean;
  category: "identity" | "employment" | "agreements" | "tax";
}

const documentTypes: DocumentType[] = [
  {
    id: "identity_copy",
    name: "Kopie Identiteitsbewijs",
    description: "Kopie van paspoort, ID-kaart of rijbewijs",
    icon: IdentificationIcon,
    color: "blue",
    required: true,
    forFreelancers: true,
    category: "identity",
  },
  {
    id: "employment_contract",
    name: "Arbeidsovereenkomst",
    description: "Getekende arbeidsovereenkomst",
    icon: DocumentTextIcon,
    color: "green",
    required: true,
    forFreelancers: false,
    category: "employment",
  },
  {
    id: "freelance_contract",
    name: "Freelance Overeenkomst",
    description: "Getekende freelance overeenkomst",
    icon: DocumentTextIcon,
    color: "purple",
    required: true,
    forFreelancers: true,
    category: "employment",
  },
  {
    id: "tax_form",
    name: "Loonheffingsformulier",
    description: "Ingevuld loonheffingsformulier van de Belastingdienst",
    icon: CurrencyEuroIcon,
    color: "orange",
    required: false,
    forFreelancers: false,
    category: "tax",
  },
  {
    id: "laptop_agreement",
    name: "Laptopovereenkomst",
    description: "Overeenkomst voor het gebruik van bedrijfslaptop",
    icon: ComputerDesktopIcon,
    color: "indigo",
    required: false,
    forFreelancers: true,
    category: "agreements",
  },
  {
    id: "key_agreement",
    name: "Sleutelovereenkomst",
    description: "Overeenkomst voor bedrijfssleutels en toegang",
    icon: KeyIcon,
    color: "yellow",
    required: false,
    forFreelancers: true,
    category: "agreements",
  },
  {
    id: "other_agreement",
    name: "Overige Overeenkomst",
    description: "Andere contractuele documenten",
    icon: DocumentDuplicateIcon,
    color: "gray",
    required: false,
    forFreelancers: true,
    category: "agreements",
  },
];

export default function EmployeeDocuments() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(
    null
  );
  const [customTitle, setCustomTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const employeeId = params?.id as string;

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
      fetchDocuments();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/personnel/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setEmployee(data);
      } else {
        setError("Medewerker niet gevonden");
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      setError("Fout bij ophalen medewerker gegevens");
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/personnel/${employeeId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Bestand is te groot (max 10MB)");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError(
          "Ongeldig bestandstype. Alleen PDF, Word en afbeeldingen zijn toegestaan."
        );
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", selectedDocType.id);
      formData.append("title", customTitle || selectedDocType.name);
      formData.append("employeeId", employeeId);

      const response = await fetch(`/api/personnel/${employeeId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess("Document succesvol geüpload!");
        setShowUploadModal(false);
        setSelectedFile(null);
        setCustomTitle("");
        setSelectedDocType(null);
        await fetchDocuments();
      } else {
        const data = await response.json();
        setError(data.error || "Fout bij uploaden");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Er is een fout opgetreden bij het uploaden");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;

    try {
      const response = await fetch(
        `/api/personnel/${employeeId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSuccess("Document verwijderd");
        await fetchDocuments();
      } else {
        setError("Fout bij verwijderen document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError("Er is een fout opgetreden");
    }
  };

  const getDocumentTypeInfo = (type: string): DocumentType | undefined => {
    return documentTypes.find((dt) => dt.id === type);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      orange: "bg-orange-50 text-orange-700 border-orange-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      gray: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getAvailableDocumentTypes = () => {
    if (!employee) return [];

    const isFreelancer = employee.employeeType === "FREELANCER";
    return documentTypes.filter((dt) =>
      isFreelancer ? dt.forFreelancers : true
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const groupedDocuments = getAvailableDocumentTypes().reduce(
    (acc, docType) => {
      const docsOfType = documents.filter((doc) => doc.type === docType.id);
      acc[docType.category] = acc[docType.category] || [];
      acc[docType.category].push({
        type: docType,
        documents: docsOfType,
        hasDocuments: docsOfType.length > 0,
      });
      return acc;
    },
    {} as Record<
      string,
      Array<{
        type: DocumentType;
        documents: Document[];
        hasDocuments: boolean;
      }>
    >
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Medewerker niet gevonden
          </h2>
          <Button
            onClick={() => router.push("/dashboard/personnel")}
            variant="primary"
          >
            Terug naar Personeel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard/personnel")}
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
              >
                Terug
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Documentbeheer
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {employee.name} • {employee.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  employee.employeeType === "FREELANCER"
                    ? "bg-green-100 text-green-800"
                    : employee.employeeType === "PERMANENT"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {employee.employeeType === "FREELANCER"
                  ? "Freelancer"
                  : employee.employeeType === "PERMANENT"
                  ? "Vast personeel"
                  : "Oproepkracht"}
              </span>
              <Button
                onClick={() => setShowUploadModal(true)}
                variant="primary"
                leftIcon={<PlusIcon className="h-5 w-5" />}
              >
                Document Toevoegen
              </Button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Document Categories */}
        {Object.entries(groupedDocuments).map(([category, categoryData]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
              {category === "identity" && "📋 Identiteitsgegevens"}
              {category === "employment" && "📄 Arbeidsovereenkomsten"}
              {category === "tax" && "💰 Belasting & Loon"}
              {category === "agreements" && "📑 Aanvullende Overeenkomsten"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryData.map(
                ({ type, documents: docsOfType, hasDocuments }) => (
                  <div
                    key={type.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${getColorClasses(
                      type.color
                    )} p-6`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <type.icon className="h-8 w-8 mr-3" />
                        <div>
                          <h3 className="font-semibold text-sm">{type.name}</h3>
                          <p className="text-xs opacity-75 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                      {type.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Verplicht
                        </span>
                      )}
                    </div>

                    {hasDocuments ? (
                      <div className="space-y-3">
                        {docsOfType.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {doc.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(doc.size)} •{" "}
                                  {format(
                                    new Date(doc.uploadedAt),
                                    "dd MMM yyyy",
                                    { locale: nl }
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `/api/personnel/${employeeId}/documents/${doc.id}/download`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CloudArrowUpIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
                        <p className="text-sm opacity-75 mb-3">
                          Nog geen documenten
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocType(type);
                            setShowUploadModal(true);
                          }}
                          leftIcon={<PlusIcon className="h-4 w-4" />}
                        >
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        ))}

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedDocType(null);
            setSelectedFile(null);
            setCustomTitle("");
            setError(null);
          }}
          title="📎 Document Uploaden"
          description={`Upload een document voor ${employee.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Document Type Selection */}
            {!selectedDocType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Document Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {getAvailableDocumentTypes().map((docType) => (
                    <button
                      key={docType.id}
                      onClick={() => setSelectedDocType(docType)}
                      className={`text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors`}
                    >
                      <div className="flex items-center">
                        <docType.icon className="h-6 w-6 mr-3 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {docType.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {docType.description}
                          </p>
                        </div>
                        {docType.required && (
                          <span className="ml-auto px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Verplicht
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Document Type & File Upload */}
            {selectedDocType && (
              <>
                <div
                  className={`p-4 rounded-lg border-2 ${getColorClasses(
                    selectedDocType.color
                  )}`}
                >
                  <div className="flex items-center">
                    <selectedDocType.icon className="h-6 w-6 mr-3" />
                    <div>
                      <p className="font-medium">{selectedDocType.name}</p>
                      <p className="text-sm opacity-75">
                        {selectedDocType.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocType(null)}
                      className="ml-auto"
                    >
                      Wijzigen
                    </Button>
                  </div>
                </div>

                <Input
                  label="Document Titel (optioneel)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={selectedDocType.name}
                  variant="outlined"
                  inputSize="md"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bestand Selecteren
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Klik om een bestand te selecteren of sleep het hierheen
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PDF, Word, of afbeeldingen (max 10MB)
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Annuleren
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    leftIcon={
                      uploading ? undefined : (
                        <CloudArrowUpIcon className="h-5 w-5" />
                      )
                    }
                  >
                    {uploading ? "Uploading..." : "Document Uploaden"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
