"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  Cog8ToothIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Modal from "./Modal";
import ContractUploader from "./ContractUploader";
import { Toast, useToast } from "./Toast";

interface Contract {
  id: string;
  userId: string;
  contractType: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  fileName?: string;
  fileUrl?: string;
  signedDate?: string;
  salary?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    employeeType?: string;
  };
}

interface ContractViewerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

export default function ContractViewer({
  isOpen,
  onClose,
  userId,
  userName,
}: ContractViewerProps) {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [signingContract, setSigningContract] = useState<string | null>(null);
  const [showContractUploader, setShowContractUploader] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showEmailOptions, setShowEmailOptions] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchContracts();
    }
  }, [isOpen, userId]);

  // Close email dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmailOptions) {
        const target = event.target as Element;
        if (!target.closest(".email-dropdown")) {
          setShowEmailOptions(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmailOptions]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append("userId", userId);
      }

      const response = await fetch(`/api/contracts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      } else {
        console.error("Failed to fetch contracts");
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "PENDING_SIGNATURE":
        return <ClockIcon className="h-5 w-5 text-amber-500" />;
      case "DRAFT":
        return <PencilIcon className="h-5 w-5 text-gray-500" />;
      case "EXPIRED":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actief";
      case "PENDING_SIGNATURE":
        return "Wacht op ondertekening";
      case "DRAFT":
        return "Concept";
      case "EXPIRED":
        return "Verlopen";
      case "TERMINATED":
        return "Beëindigd";
      case "SUSPENDED":
        return "Opgeschort";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "PENDING_SIGNATURE":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "EXPIRED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "TERMINATED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const signContract = async (contractId: string) => {
    setSigningContract(contractId);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ACTIVE",
          signedDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        await fetchContracts();
        if (selectedContract && selectedContract.id === contractId) {
          const updatedContract = await response.json();
          setSelectedContract(updatedContract);
        }
      } else {
        console.error("Failed to sign contract");
      }
    } catch (error) {
      console.error("Error signing contract:", error);
    } finally {
      setSigningContract(null);
    }
  };

  const sendForSignature = async (contractId: string) => {
    // In real app, this would send an email or notification
    alert(
      "Contract verzonden voor ondertekening (email functionaliteit nog toe te voegen)"
    );
  };

  const generatePdf = async (contractId: string) => {
    setGeneratingPdf(contractId);
    try {
      const response = await fetch(
        `/api/contracts/${contractId}/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        showToast("PDF succesvol gegenereerd", "success");
        await fetchContracts(); // Refresh contracts

        // Update selected contract if it's the same one
        if (selectedContract && selectedContract.id === contractId) {
          const updatedContracts = contracts.map((c) =>
            c.id === contractId
              ? { ...c, fileUrl: result.fileUrl, fileName: result.fileName }
              : c
          );
          const updatedContract = updatedContracts.find(
            (c) => c.id === contractId
          );
          if (updatedContract) {
            setSelectedContract(updatedContract);
          }
        }

        // Show PDF preview instead of direct download
        const contract = contracts.find((c) => c.id === contractId);
        if (contract) {
          setPreviewContract({
            ...contract,
            fileUrl: result.fileUrl,
            fileName: result.fileName,
          });
          setPreviewPdfUrl(result.fileUrl);
          setShowPdfPreview(true);
        }
      } else {
        const error = await response.json();
        showToast(error.error || "Fout bij PDF generatie", "error");
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
        showToast(result.message, "success");
        setShowEmailOptions(null);

        // Close PDF preview if open
        if (showPdfPreview) {
          setShowPdfPreview(false);
          setPreviewPdfUrl(null);
          setPreviewContract(null);
        }

        await fetchContracts(); // Refresh to see updated notes
      } else {
        const error = await response.json();
        showToast(error.error || "Fout bij verzenden email", "error");
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

  const downloadPdf = async (contract: Contract) => {
    if (!contract.fileUrl) {
      showToast("Geen PDF beschikbaar. Genereer eerst een PDF.", "warning");
      return;
    }

    try {
      // Create download link
      const link = document.createElement("a");
      link.href = contract.fileUrl;
      link.download = contract.fileName || `${contract.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("PDF gedownload", "success");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showToast("Fout bij downloaden PDF", "error");
    }
  };

  const viewContractDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowContractDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL");
  };

  const getContractDuration = (contract: Contract) => {
    if (contract.endDate) {
      return `Bepaalde tijd (tot ${formatDate(contract.endDate)})`;
    }
    return "Onbepaalde tijd";
  };

  const getContractTypeText = (contractType: string) => {
    switch (contractType) {
      case "PERMANENT_FULL_TIME":
        return "Vast contract (voltijd)";
      case "PERMANENT_PART_TIME":
        return "Vast contract (deeltijd)";
      case "TEMPORARY_FULL_TIME":
        return "Tijdelijk contract (voltijd)";
      case "TEMPORARY_PART_TIME":
        return "Tijdelijk contract (deeltijd)";
      case "FREELANCE":
        return "Freelance overeenkomst";
      case "ZERO_HOURS":
        return "Oproepovereenkomst";
      case "INTERNSHIP":
        return "Stage overeenkomst";
      case "PROBATION":
        return "Proeftijd contract";
      default:
        return contractType;
    }
  };

  const canSignContract = (contract: Contract) => {
    return (
      contract.status === "PENDING_SIGNATURE" &&
      (session?.user?.id === contract.userId ||
        session?.user?.role === "ADMIN" ||
        session?.user?.role === "MANAGER")
    );
  };

  const canSendForSignature = (contract: Contract) => {
    return (
      contract.status === "DRAFT" &&
      (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER")
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Contracten${userName ? ` - ${userName}` : ""}`}
        size="xl"
      >
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                Contracten laden...
              </div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Geen contracten gevonden
              </h3>
              {(session?.user?.role === "ADMIN" ||
                session?.user?.role === "MANAGER") && (
                <Button
                  variant="primary"
                  onClick={() => setShowContractUploader(true)}
                  leftIcon={<CloudArrowUpIcon className="h-5 w-5" />}
                >
                  Bestaand Contract Uploaden
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header with Upload Button */}
              {(session?.user?.role === "ADMIN" ||
                session?.user?.role === "MANAGER") && (
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Contracten ({contracts.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContractUploader(true)}
                    leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}
                  >
                    Contract Uploaden
                  </Button>
                </div>
              )}

              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(contract.status)}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {contract.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            contract.status
                          )}`}
                        >
                          {getStatusText(contract.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Startdatum:
                          </span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(contract.startDate)}
                          </p>
                        </div>
                        {contract.endDate && (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Einddatum:
                            </span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(contract.endDate)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Duur:
                          </span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getContractDuration(contract)}
                          </p>
                        </div>
                        {contract.salary && (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Salaris:
                            </span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {contract.salary}
                            </p>
                          </div>
                        )}
                      </div>

                      {contract.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {contract.description}
                        </p>
                      )}

                      {contract.signedDate && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ Ondertekend op {formatDate(contract.signedDate)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                        onClick={() => viewContractDetails(contract)}
                      >
                        Bekijken
                      </Button>

                      {/* PDF Actions - Only for Admin/Manager */}
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "MANAGER") && (
                        <div className="flex space-x-1">
                          {contract.fileUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              }
                              onClick={() => downloadPdf(contract)}
                              className="flex-1"
                            >
                              PDF
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Cog8ToothIcon className="h-4 w-4" />}
                              onClick={() => generatePdf(contract.id)}
                              loading={generatingPdf === contract.id}
                              className="flex-1"
                            >
                              PDF
                            </Button>
                          )}

                          {contract.fileUrl && (
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                                onClick={() =>
                                  setShowEmailOptions(
                                    showEmailOptions === contract.id
                                      ? null
                                      : contract.id
                                  )
                                }
                                loading={sendingEmail === contract.id}
                                className="flex-1"
                              >
                                Mail
                              </Button>

                              {/* Email Options Dropdown */}
                              {showEmailOptions === contract.id && (
                                <div className="email-dropdown absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                  <div className="p-2 space-y-1">
                                    <button
                                      onClick={() =>
                                        sendEmail(contract.id, "new")
                                      }
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                    >
                                      📄 Nieuw contract
                                    </button>
                                    <button
                                      onClick={() =>
                                        sendEmail(contract.id, "reminder")
                                      }
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                    >
                                      ⏰ Herinnering
                                    </button>
                                    <button
                                      onClick={() =>
                                        sendEmail(contract.id, "signed")
                                      }
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                    >
                                      ✅ Ondertekend
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {canSignContract(contract) && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                          onClick={() => signContract(contract.id)}
                          loading={signingContract === contract.id}
                        >
                          Ondertekenen
                        </Button>
                      )}

                      {canSendForSignature(contract) && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
                          onClick={() => sendForSignature(contract.id)}
                        >
                          Versturen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Contract Details Modal */}
      {selectedContract && (
        <Modal
          isOpen={showContractDetails}
          onClose={() => {
            setShowContractDetails(false);
            setSelectedContract(null);
          }}
          title={`Contract Details - ${selectedContract.title}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(selectedContract.status)}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {getStatusText(selectedContract.status)}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aangemaakt op {formatDate(selectedContract.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {canSignContract(selectedContract) && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    onClick={() => signContract(selectedContract.id)}
                    loading={signingContract === selectedContract.id}
                  >
                    Contract Ondertekenen
                  </Button>
                )}
              </div>
            </div>

            {/* Contract Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Contract Informatie
                </h5>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Type:
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {getContractTypeText(selectedContract.contractType)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Startdatum:
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedContract.startDate)}
                    </dd>
                  </div>
                  {selectedContract.endDate && (
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        Einddatum:
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedContract.endDate)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Duur:
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {getContractDuration(selectedContract)}
                    </dd>
                  </div>
                  {selectedContract.salary && (
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        Salaris:
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedContract.salary}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Medewerker
                </h5>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Naam:
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedContract.user.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Email:
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedContract.user.email}
                    </dd>
                  </div>
                  {selectedContract.user.employeeType && (
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        Type:
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedContract.user.employeeType}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Description */}
            {selectedContract.description && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Beschrijving
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedContract.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedContract.notes && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Opmerkingen
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedContract.notes}
                </p>
              </div>
            )}

            {/* File Information */}
            {selectedContract.fileName && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Bestand
                </h5>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {selectedContract.fileName}
                  </span>
                </div>
              </div>
            )}

            {/* Signature Information */}
            {selectedContract.signedDate && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Contract ondertekend op{" "}
                    {formatDate(selectedContract.signedDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Contract Uploader Modal */}
      {showContractUploader && (
        <ContractUploader
          isOpen={showContractUploader}
          onClose={() => setShowContractUploader(false)}
          userId={userId || ""}
          userName={userName || "Medewerker"}
          onContractUploaded={() => {
            setShowContractUploader(false);
            fetchContracts();
          }}
        />
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && previewContract && previewPdfUrl && (
        <Modal
          isOpen={showPdfPreview}
          onClose={() => {
            setShowPdfPreview(false);
            setPreviewPdfUrl(null);
            setPreviewContract(null);
          }}
          title={`PDF Preview - ${previewContract.title}`}
          size="xl"
        >
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {previewContract.fileName || `${previewContract.title}.pdf`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPdf(previewContract)}
                  leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                >
                  Download
                </Button>

                {/* Email Options */}
                {(session?.user?.role === "ADMIN" ||
                  session?.user?.role === "MANAGER") && (
                  <div className="relative">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowEmailOptions(previewContract.id)}
                      leftIcon={<EnvelopeIcon className="h-4 w-4" />}
                      loading={sendingEmail === previewContract.id}
                    >
                      Email Versturen
                    </Button>

                    {showEmailOptions === previewContract.id && (
                      <div className="email-dropdown absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
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
                )}
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
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Contract Klaar voor Verzending
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Controleer de PDF zorgvuldig voordat je hem verstuurt. Je
                    kunt de PDF downloaden of direct per email versturen naar{" "}
                    {previewContract.user.name} ({previewContract.user.email}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}
