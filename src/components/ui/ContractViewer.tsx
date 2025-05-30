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
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Modal from "./Modal";
import ContractUploader from "./ContractUploader";

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

  useEffect(() => {
    if (isOpen) {
      fetchContracts();
    }
  }, [isOpen, userId]);

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
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Er zijn nog geen contracten aangemaakt voor deze medewerker.
              </p>
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
      {userId && userName && (
        <ContractUploader
          isOpen={showContractUploader}
          onClose={() => setShowContractUploader(false)}
          userId={userId}
          userName={userName}
          onContractUploaded={() => {
            fetchContracts();
            setShowContractUploader(false);
          }}
        />
      )}
    </>
  );
}
