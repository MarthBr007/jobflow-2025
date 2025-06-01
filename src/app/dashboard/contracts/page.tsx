"use client";

import { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  EyeIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { hasPermission, UserRole } from "@/lib/permissions";
import {
  SignaturePadManager,
  ElectronicSignatureValidator,
  LegalComplianceUtils,
  type DigitalSignature,
  type SignatureData,
  defaultSignaturePadConfig,
} from "@/lib/electronic-signature";

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
  user: {
    id: string;
    name: string;
    email: string;
  };
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

export default function ContractsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle potential null searchParams
  const userId = searchParams?.get("userId") || null;
  const userName = searchParams?.get("userName") || null;
  const userEmail = searchParams?.get("userEmail") || null;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null
  );

  // PDF and email functionality states
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showEmailOptions, setShowEmailOptions] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContract, setEmailContract] = useState<Contract | null>(null);
  const [emailType, setEmailType] = useState<"new" | "signed" | "reminder">(
    "new"
  );
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
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
    firstName: "",
    lastName: "",
    address: "",
    zipCode: "",
    city: "",
    iban: "",
    kvkNumber: "",
    btwNumber: "",
    expenseAllowance: "",
    file: null as File | null,
  });

  // Electronic signature functionality states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureContract, setSignatureContract] = useState<Contract | null>(
    null
  );
  const [signaturePadManager, setSignaturePadManager] =
    useState<SignaturePadManager | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerRole, setSignerRole] = useState<
    "EMPLOYER" | "EMPLOYEE" | "WITNESS"
  >("EMPLOYEE");
  const [signatureStep, setSignatureStep] = useState<
    "disclaimer" | "signature" | "confirmation"
  >("disclaimer");
  const [isSignatureSaving, setIsSignatureSaving] = useState(false);

  // Check permissions - contracts are part of user management
  const canManageContracts = hasPermission(
    session?.user?.role as UserRole,
    "canEditUsers"
  );

  useEffect(() => {
    if (!canManageContracts) {
      router.push("/dashboard");
      return;
    }
    fetchContracts();
  }, [canManageContracts, router]);

  useEffect(() => {
    // Filter contracts based on search and status
    let filtered = contracts;

    if (searchTerm) {
      filtered = filtered.filter(
        (contract) =>
          contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (contract) => contract.status === statusFilter
      );
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const url = userId ? `/api/contracts?userId=${userId}` : "/api/contracts";
      const response = await fetch(url);
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
      firstName: "",
      lastName: "",
      address: "",
      zipCode: "",
      city: "",
      iban: "",
      kvkNumber: "",
      btwNumber: "",
      expenseAllowance: "",
      file: null,
    });
  };

  const handleAddContract = () => {
    resetForm();
    setSelectedContract(null);
    setShowAddModal(true);
  };

  const handleEditContract = (contract: Contract) => {
    setFormData({
      contractType: contract.contractType,
      title: contract.title,
      description: contract.description || "",
      startDate: contract.startDate.split("T")[0],
      endDate: contract.endDate ? contract.endDate.split("T")[0] : "",
      status: contract.status,
      salary: contract.salary || "",
      notes: contract.notes || "",
      signedDate: contract.signedDate ? contract.signedDate.split("T")[0] : "",
      firstName: "",
      lastName: "",
      address: "",
      zipCode: "",
      city: "",
      iban: "",
      kvkNumber: "",
      btwNumber: "",
      expenseAllowance: "",
      file: null,
    });
    setSelectedContract(contract);
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contractData = {
        userId: userId || selectedContract?.user.id,
        contractType: formData.contractType,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
        salary: formData.salary,
        notes: formData.notes,
        signedDate: formData.signedDate || null,
      };

      const url = selectedContract
        ? `/api/contracts/${selectedContract.id}`
        : "/api/contracts";
      const method = selectedContract ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        const savedContract = await response.json();
        await fetchContracts();
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();

        // Auto-generate PDF option
        if (!selectedContract && !formData.file) {
          const generatePdfNow = confirm(
            `Contract "${savedContract.title}" is succesvol aangemaakt!\n\nWil je nu automatisch een PDF genereren? Dan kun je het contract direct emailen.`
          );

          if (generatePdfNow) {
            await generatePdf(savedContract.id);
          }
        }
      } else {
        const error = await response.json();
        alert(
          "Fout bij opslaan contract: " + (error.error || "Onbekende fout")
        );
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      alert("Er is een fout opgetreden bij het opslaan van het contract");
    } finally {
      setLoading(false);
    }
  };

  // PDF and Email functions (same as before)
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
        await fetchContracts();
        const updatedContract = contracts.find((c) => c.id === contractId);
        if (updatedContract) {
          const action = confirm(
            `✅ PDF is succesvol gegenereerd voor "${updatedContract.title}"!\n\nWil je het contract nu bekijken en eventueel emailen?`
          );

          if (action) {
            await fetchContracts();
            const refreshedContracts = await fetch(
              `/api/contracts?userId=${userId || ""}`
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
          alert("✅ PDF succesvol gegenereerd! Pagina wordt vernieuwd.");
          await fetchContracts();
        }
      } else {
        const error = await response.json();
        alert(
          "❌ Fout bij genereren PDF: " + (error.error || "Onbekende fout")
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("❌ Er is een fout opgetreden bij het genereren van de PDF");
    } finally {
      setGeneratingPdf(null);
    }
  };

  const sendEmail = async (
    contractId: string,
    emailType: "new" | "signed" | "reminder"
  ) => {
    setSendingEmail(contractId);
    try {
      const response = await fetch(`/api/contracts/${contractId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowEmailOptions(null);
        await fetchContracts();
      } else {
        const error = await response.json();
        alert(error.error || "Fout bij verzenden email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Er is een fout opgetreden bij het verzenden van de email");
    } finally {
      setSendingEmail(null);
    }
  };

  const downloadPdf = (contract: Contract) => {
    if (!contract.fileUrl) {
      alert("Geen PDF beschikbaar. Genereer eerst een PDF.");
      return;
    }
    const link = document.createElement("a");
    link.href = contract.fileUrl;
    link.download = contract.fileName || `${contract.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewPdf = (contract: Contract) => {
    if (!contract.fileUrl) {
      alert("Geen PDF beschikbaar. Genereer eerst een PDF.");
      return;
    }
    setPreviewContract(contract);
    setPreviewPdfUrl(contract.fileUrl);
    setShowPdfPreview(true);
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

  const handleElectronicSign = (contract: Contract) => {
    setSignatureContract(contract);
    setSignerName("");
    setSignerEmail("");
    setSignerRole("EMPLOYEE");
    setSignatureStep("disclaimer");
    setShowSignatureModal(true);
  };

  const initializeSignaturePad = (canvas: HTMLCanvasElement) => {
    const manager = new SignaturePadManager(canvas, {
      ...defaultSignaturePadConfig,
      width: 500,
      height: 250,
      backgroundColor: "#f8fafc",
      penColor: "#2563eb",
    });
    setSignaturePadManager(manager);
  };

  const clearSignature = () => {
    if (signaturePadManager) {
      signaturePadManager.clear();
    }
  };

  const saveElectronicSignature = async () => {
    if (
      !signaturePadManager ||
      !signatureContract ||
      !signerName ||
      !signerEmail
    ) {
      alert("Vul alle verplichte velden in en plaats uw handtekening.");
      return;
    }

    if (signaturePadManager.isEmpty()) {
      alert("Plaats eerst uw handtekening in het veld.");
      return;
    }

    setIsSignatureSaving(true);
    try {
      const signatureDataURL = signaturePadManager.getSignatureDataURL();

      // Get user agent and IP (simplified for demo)
      const userAgent = navigator.userAgent;
      const now = new Date();

      // Create signature data
      const signatureData: SignatureData = {
        signatureBase64: signatureDataURL,
        signerName,
        signerEmail,
        signatureDate: now,
        ipAddress: "127.0.0.1", // In production, get from server
        userAgent,
        contractId: signatureContract.id,
        documentHash: "SHA256_HASH_OF_CONTRACT", // In production, calculate actual hash
      };

      // Generate verification code
      const verificationCode =
        ElectronicSignatureValidator.generateVerificationCode(signatureData);

      // Create digital signature object
      const digitalSignature: Partial<DigitalSignature> = {
        contractId: signatureContract.id,
        signerName,
        signerEmail,
        signerRole,
        signatureImageBase64: signatureDataURL,
        signedAt: now,
        ipAddress: "127.0.0.1",
        userAgent,
        documentHash: "SHA256_HASH_OF_CONTRACT",
        verificationCode,
        isVerified: true,
        metadata: {
          browser: navigator.userAgent.split(" ")[0],
          device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "Mobile"
            : "Desktop",
          sessionId: `SESSION_${Date.now()}`,
        },
      };

      // In production, save to database via API
      console.log("Digital Signature:", digitalSignature);

      // Update contract status
      await fetch(`/api/contracts/${signatureContract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SIGNED",
          signedAt: now.toISOString(),
          signedBy: signerName,
        }),
      });

      setSignatureStep("confirmation");

      // Refresh contracts list
      fetchContracts();
    } catch (error) {
      console.error("Error saving signature:", error);
      alert("Er is een fout opgetreden bij het opslaan van de handtekening.");
    } finally {
      setIsSignatureSaving(false);
    }
  };

  if (!canManageContracts) {
    return null; // Will redirect
  }

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Personeel", href: "/dashboard/personnel" },
    { label: "Contracten" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
              Contract Beheer
            </h1>
            {userId && userName ? (
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                Voor: {userName} ({userEmail})
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Beheer alle contracten van medewerkers
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {userId && (
              <Button
                variant="outline"
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                onClick={() => router.back()}
              >
                Terug
              </Button>
            )}
            <Button
              onClick={handleAddContract}
              leftIcon={<PlusIcon className="h-4 w-4" />}
              variant="primary"
            >
              Nieuw Contract
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Zoeken op contract titel, medewerker naam of email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />
          </div>
          <div className="lg:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle statussen</option>
              {Object.entries(contractStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Contracts Grid/List */}
      {/* Enhanced Inline Contract Form */}
      {(showAddModal || showEditModal) && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedContract
                ? "📝 Contract Bewerken"
                : "📄 Nieuw Contract Toevoegen"}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedContract(null);
                resetForm();
              }}
            >
              Annuleren
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contract Basis Info */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Contract Informatie
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {Object.entries(contractTypeLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Titel
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Bijv. Arbeidsovereenkomst John Doe"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
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
                  placeholder="Optionele beschrijving van het contract..."
                />
              </div>
            </div>

            {/* Personal Details Section */}
            {formData.contractType !== "FREELANCE" && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Personeelsgegevens
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Voornaam
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Achternaam
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Straatnaam + Huisnummer
                    </label>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Hoofdstraat 123"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={formData.iban || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, iban: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="NL12 ABCD 0123 4567 89"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="1234 AB"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Woonplaats
                    </label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Amsterdam"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Freelance Details Section */}
            {formData.contractType === "FREELANCE" && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Freelance Gegevens
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      KVK Nummer
                    </label>
                    <input
                      type="text"
                      value={formData.kvkNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, kvkNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="12345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      BTW Nummer
                    </label>
                    <input
                      type="text"
                      value={formData.btwNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, btwNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="NL123456789B01"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contract Dates and Status */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Contract Periode & Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Einddatum (optioneel)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
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
                    {Object.entries(contractStatusLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Financiële Gegevens
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.contractType === "ZERO_HOURS"
                      ? "Bruto Uurtarief"
                      : formData.contractType === "FREELANCE"
                      ? "Uurtarief (excl. BTW)"
                      : "Maandsalaris"}
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={
                      formData.contractType === "ZERO_HOURS"
                        ? "€ 15,00 per uur"
                        : formData.contractType === "FREELANCE"
                        ? "€ 75,00 per uur"
                        : "€ 3500 per maand"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Onkostenvergoeding (optioneel)
                  </label>
                  <input
                    type="text"
                    value={formData.expenseAllowance || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expenseAllowance: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="€ 0,19 per km (reiskosten)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ondertekend op (optioneel)
                  </label>
                  <input
                    type="date"
                    value={formData.signedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, signedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notities (optioneel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Eventuele extra notities over dit contract..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedContract(null);
                  resetForm();
                }}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                {loading
                  ? "Opslaan..."
                  : selectedContract
                  ? "Contract Bijwerken"
                  : "Contract Aanmaken"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Contracten laden...
            </p>
          </div>
        </Card>
      ) : filteredContracts.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter
                ? "Geen overeenkomende contracten"
                : "Geen contracten gevonden"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter
                ? "Probeer een andere zoekopdracht of filter."
                : "Voeg het eerste contract toe."}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                onClick={handleAddContract}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                variant="primary"
              >
                Eerste Contract Toevoegen
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card
              key={contract.id}
              className={`p-6 ${
                contract.status === "ACTIVE"
                  ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex flex-col xl:flex-row xl:items-start gap-6">
                {/* Contract Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {contract.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium flex items-center ${
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

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">{contract.user.name}</span>
                    <span className="mx-2">•</span>
                    <span>{contract.user.email}</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {contractTypeLabels[contract.contractType]}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Startdatum:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {format(new Date(contract.startDate), "dd MMM yyyy", {
                          locale: nl,
                        })}
                      </span>
                    </div>
                    {contract.endDate && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Einddatum:
                        </span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {format(new Date(contract.endDate), "dd MMM yyyy", {
                            locale: nl,
                          })}
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
                    <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      <span>{contract.fileName}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-64">
                  {/* PDF Actions */}
                  {contract.fileUrl ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => previewPdf(contract)}
                        variant="outline"
                        size="sm"
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                        className="flex-1 text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                      >
                        Bekijken
                      </Button>
                      <Button
                        onClick={() => downloadPdf(contract)}
                        variant="outline"
                        size="sm"
                        leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                        className="flex-1 text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                      >
                        Download
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => generatePdf(contract.id)}
                      variant="primary"
                      size="sm"
                      leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                      loading={generatingPdf === contract.id}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingPdf === contract.id
                        ? "PDF wordt gemaakt..."
                        : "🚀 PDF Genereren"}
                    </Button>
                  )}

                  {/* Email Action */}
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
                        className="w-full text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
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
                              Naar: {contract.user.email}
                            </p>
                          </div>
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => {
                                setEmailContract(contract);
                                setEmailType("new");
                                setShowEmailModal(true);
                                setShowEmailOptions(null);
                              }}
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
                              onClick={() => {
                                setEmailContract(contract);
                                setEmailType("reminder");
                                setShowEmailModal(true);
                                setShowEmailOptions(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                            >
                              <span>⏰</span>
                              <div>
                                <div className="font-medium">Herinnering</div>
                                <div className="text-xs text-gray-500">
                                  Voor niet-ondertekende contracten
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setEmailContract(contract);
                                setEmailType("signed");
                                setShowEmailModal(true);
                                setShowEmailOptions(null);
                              }}
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

                  {/* Electronic Signature Action */}
                  {contract.fileUrl && contract.status !== "SIGNED" && (
                    <Button
                      onClick={() => handleElectronicSign(contract)}
                      variant="outline"
                      size="sm"
                      leftIcon={<span className="text-blue-600">✍️</span>}
                      className="w-full text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20"
                    >
                      🔐 Elektronisch Ondertekenen
                    </Button>
                  )}

                  {/* Edit/Delete Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleEditContract(contract)}
                      variant="outline"
                      size="sm"
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Bewerken
                    </Button>
                    <Button
                      onClick={() => {
                        setContractToDelete(contract);
                        setShowDeleteModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      className="flex-1 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Click outside to close email dropdowns */}
      {showEmailOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmailOptions(null)}
        />
      )}
      {/* Email Compose Modal */}
      {showEmailModal && emailContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  📧 Professional Email Composer
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailContract(null);
                    setEmailSubject("");
                    setEmailMessage("");
                  }}
                >
                  ✕ Sluiten
                </Button>
              </div>

              <div className="space-y-6">
                {/* Contract Details Card - Enhanced */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        📎 Contract Bijlage Inbegrepen
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            Contract:
                          </span>
                          <span className="ml-2 text-blue-700 dark:text-blue-300">
                            {emailContract.title}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            Ontvanger:
                          </span>
                          <span className="ml-2 text-blue-700 dark:text-blue-300">
                            {emailContract.user.name}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            Email:
                          </span>
                          <span className="ml-2 text-blue-700 dark:text-blue-300">
                            {emailContract.user.email}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            Type:
                          </span>
                          <span className="ml-2 text-blue-700 dark:text-blue-300">
                            {contractTypeLabels[emailContract.contractType]}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                          <span className="mr-2">📄</span>
                          Het contract PDF wordt automatisch als bijlage
                          toegevoegd
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Type Selector - Enhanced */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📧 Email Template Type
                  </label>
                  <select
                    value={emailType}
                    onChange={(e) => {
                      const type = e.target.value as
                        | "new"
                        | "signed"
                        | "reminder";
                      setEmailType(type);
                      // Auto-fill with enhanced templates
                      if (type === "new") {
                        setEmailSubject(
                          `📄 Nieuw Contract: ${emailContract.title}`
                        );
                        setEmailMessage(`Beste ${emailContract.user.name},

Hierbij ontvangt u uw nieuwe arbeidscontract ter ondertekening.

📋 **Contract Details:**
• Titel: ${emailContract.title}
• Type: ${contractTypeLabels[emailContract.contractType]}
• Startdatum: ${format(new Date(emailContract.startDate), "dd MMMM yyyy", {
                          locale: nl,
                        })}

📎 **Bijlage:** Het volledige contract als PDF

🔍 **Volgende stappen:**
1. Download en bekijk het bijgevoegde contract
2. Controleer alle gegevens zorgvuldig
3. Onderteken het contract en stuur het terug

Bij vragen kunt u altijd contact met ons opnemen.

Met vriendelijke groet,
HR Team - Broers Verhuur`);
                      } else if (type === "reminder") {
                        setEmailSubject(
                          `⏰ Herinnering: Contract Ondertekening - ${emailContract.title}`
                        );
                        setEmailMessage(`Beste ${emailContract.user.name},

Dit is een vriendelijke herinnering voor de ondertekening van uw contract.

📋 **Contract:** ${emailContract.title}

We hebben nog geen ondertekend exemplaar van u ontvangen. Om de arbeidsrelatie te kunnen starten, verzoeken wij u vriendelijk het contract zo spoedig mogelijk te ondertekenen en terug te sturen.

📎 Het contract vindt u bijgevoegd bij deze email.

Heeft u vragen of onduidelijkheden? Neem dan contact met ons op.

Met vriendelijke groet,
HR Team - Broers Verhuur`);
                      } else if (type === "signed") {
                        setEmailSubject(
                          `✅ Bevestiging: Contract Ondertekend - ${emailContract.title}`
                        );
                        setEmailMessage(`Beste ${emailContract.user.name},

Hartelijk dank voor de ondertekening van uw contract!

📋 **Contract:** ${emailContract.title}
✅ **Status:** Ondertekend en actief

Hierbij bevestigen wij de ontvangst van uw ondertekende contract. Uw arbeidsrelatie met Broers Verhuur is nu officieel van start gegaan.

📎 Ter bevestiging ontvangt u nogmaals een kopie van het ondertekende contract.

Welkom bij het team! We kijken ernaar uit om met u samen te werken.

Met vriendelijke groet,
HR Team - Broers Verhuur`);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                  >
                    <option value="new">
                      📄 Nieuw contract (voor ondertekening)
                    </option>
                    <option value="reminder">
                      ⏰ Herinnering (niet ondertekend)
                    </option>
                    <option value="signed">
                      ✅ Ondertekend contract (bevestiging)
                    </option>
                  </select>
                </div>

                {/* Enhanced Subject Field */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📝 Email Onderwerp
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                    placeholder="Voer het email onderwerp in..."
                    required
                  />
                </div>

                {/* Rich Text Editor Container */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  {/* Formatting Toolbar */}
                  <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
                        ✨ Formatting:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            'textarea[placeholder*="email bericht"]'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selectedText = textarea.value.substring(
                              start,
                              end
                            );
                            const newText =
                              textarea.value.substring(0, start) +
                              `**${selectedText}**` +
                              textarea.value.substring(end);
                            setEmailMessage(newText);
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 2, end + 2);
                            }, 0);
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            'textarea[placeholder*="email bericht"]'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selectedText = textarea.value.substring(
                              start,
                              end
                            );
                            const newText =
                              textarea.value.substring(0, start) +
                              `*${selectedText}*` +
                              textarea.value.substring(end);
                            setEmailMessage(newText);
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 1, end + 1);
                            }, 0);
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors italic"
                      >
                        I
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMessage((prev) => prev + "\n• ");
                        }}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMessage(
                            (prev) => prev + "\n📋 **Belangrijk:** "
                          );
                        }}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        💡 Note
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMessage((prev) => prev + "\n\n---\n\n");
                        }}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        ─ Divider
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Text Area */}
                  <div className="p-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      💬 Email Bericht
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base resize-y min-h-[300px]"
                      placeholder="Typ hier uw professionele email bericht...

💡 Tips:
• Gebruik **tekst** voor vetgedrukte tekst
• Gebruik *tekst* voor schuingedrukte tekst  
• Gebruik • voor bullet points
• Gebruik emojis om uw bericht vriendelijker te maken

Het contract PDF wordt automatisch bijgevoegd."
                      required
                    />
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>📄 Contract PDF wordt automatisch bijgevoegd</span>
                      <span>{emailMessage.length} karakters</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailContract(null);
                      setEmailSubject("");
                      setEmailMessage("");
                    }}
                  >
                    ❌ Annuleren
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={sendingEmail === emailContract.id}
                    onClick={async () => {
                      if (!emailSubject.trim() || !emailMessage.trim()) {
                        alert("❌ Vul zowel onderwerp als bericht in.");
                        return;
                      }

                      setSendingEmail(emailContract.id);
                      try {
                        const response = await fetch(
                          `/api/contracts/${emailContract.id}/send-email`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              emailType,
                              customSubject: emailSubject,
                              customMessage: emailMessage,
                            }),
                          }
                        );

                        if (response.ok) {
                          const result = await response.json();
                          alert(`✅ ${result.message}`);
                          setShowEmailModal(false);
                          setEmailContract(null);
                          setEmailSubject("");
                          setEmailMessage("");
                          setShowEmailOptions(null);
                          await fetchContracts();
                        } else {
                          const error = await response.json();
                          alert(
                            `❌ ${error.error || "Fout bij verzenden email"}`
                          );
                        }
                      } catch (error) {
                        console.error("Error sending email:", error);
                        alert(
                          "❌ Er is een fout opgetreden bij het verzenden van de email"
                        );
                      } finally {
                        setSendingEmail(null);
                      }
                    }}
                    leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                  >
                    {sendingEmail === emailContract.id
                      ? "📤 Verzenden..."
                      : "📧 Professional Email Versturen"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Electronic Signature Modal */}
      {showSignatureModal && signatureContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  ✍️ Elektronische Handtekening
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureContract(null);
                    setSignaturePadManager(null);
                  }}
                >
                  Sluiten
                </Button>
              </div>

              {/* Contract Info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📄 Contract Details
                </h4>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Titel:</strong> {signatureContract.title}
                  <br />
                  <strong>Type:</strong> {signatureContract.contractType}
                  <br />
                  <strong>Status:</strong> {signatureContract.status}
                </p>
              </div>

              {signatureStep === "disclaimer" && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center">
                      ⚖️ Juridische Bepalingen
                    </h4>
                    <div className="prose prose-sm text-yellow-800 dark:text-yellow-200 max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {LegalComplianceUtils.generateLegalDisclaimer()}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Volledige naam *
                      </label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Uw volledige naam"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        E-mailadres *
                      </label>
                      <input
                        type="email"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="uw.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rol *
                    </label>
                    <select
                      value={signerRole}
                      onChange={(e) =>
                        setSignerRole(
                          e.target.value as "EMPLOYER" | "EMPLOYEE" | "WITNESS"
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="EMPLOYEE">Werknemer</option>
                      <option value="EMPLOYER">Werkgever</option>
                      <option value="WITNESS">Getuige</option>
                    </select>
                  </div>

                  <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      onChange={(e) => {
                        if (e.target.checked && signerName && signerEmail) {
                          setSignatureStep("signature");
                        }
                      }}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="ml-3 text-sm text-green-800 dark:text-green-200"
                    >
                      Ik ga akkoord met bovenstaande voorwaarden en ben bevoegd
                      om dit document te ondertekenen
                    </label>
                  </div>
                </div>
              )}

              {signatureStep === "signature" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-2">
                      Plaats uw handtekening
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Teken hieronder met uw muis, vinger (op touch devices) of
                      stylus
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <canvas
                      ref={(canvas) => {
                        if (canvas && !signaturePadManager) {
                          initializeSignaturePad(canvas);
                        }
                      }}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white mx-auto block"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  </div>

                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={clearSignature}
                      className="flex items-center"
                    >
                      🗑️ Wissen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSignatureStep("disclaimer")}
                    >
                      ← Vorige
                    </Button>
                    <Button
                      onClick={saveElectronicSignature}
                      disabled={isSignatureSaving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSignatureSaving ? (
                        <>⏳ Opslaan...</>
                      ) : (
                        <>✅ Ondertekenen</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {signatureStep === "confirmation" && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-green-900 dark:text-green-100">
                    Contract Succesvol Ondertekend! 🎉
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <p className="text-green-800 dark:text-green-200 mb-4">
                      Uw elektronische handtekening is rechtsgeldig vastgelegd
                      conform de eIDAS-verordening.
                    </p>
                    <div className="text-left space-y-2 text-sm">
                      <p>
                        <strong>Ondertekenaar:</strong> {signerName}
                      </p>
                      <p>
                        <strong>Email:</strong> {signerEmail}
                      </p>
                      <p>
                        <strong>Rol:</strong> {signerRole}
                      </p>
                      <p>
                        <strong>Datum & Tijd:</strong>{" "}
                        {new Date().toLocaleString("nl-NL")}
                      </p>
                      <p>
                        <strong>Verificatiecode:</strong>{" "}
                        <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          TEMP-{Date.now().toString().slice(-8)}
                        </code>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setShowSignatureModal(false);
                      setSignatureContract(null);
                      setSignaturePadManager(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sluiten
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
