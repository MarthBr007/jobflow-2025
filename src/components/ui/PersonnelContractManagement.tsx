"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Modal from "./Modal";
import Input from "./Input";

interface Contract {
  id: string;
  title: string;
  contractType: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  salary?: string;
  notes?: string;
  signedDate?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
  fileName?: string;
}

interface PersonnelContractManagementProps {
  userId: string;
  userName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const PersonnelContractManagement: React.FC<
  PersonnelContractManagementProps
> = ({ userId, userName, userEmail, isOpen, onClose }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    contractType: "PERMANENT_FULL_TIME",
    title: `Arbeidsovereenkomst ${userName}`,
    description: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
    salary: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchContracts();
    }
  }, [isOpen, userId]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setContracts(data);
      } else {
        console.error("Error fetching contracts:", data.error);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async () => {
    try {
      const contractData = {
        ...formData,
        userId,
        userName,
        userEmail,
      };

      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (response.ok) {
        setContracts([...contracts, data]);
        setShowAddModal(false);
        resetForm();

        // Auto-prompt for PDF generation
        setSelectedContract(data);
        handleGeneratePDF(data);
      } else {
        console.error("Error creating contract:", data.error);
      }
    } catch (error) {
      console.error("Error creating contract:", error);
    }
  };

  const handleGeneratePDF = async (contract: Contract) => {
    try {
      setGenerating(true);
      const response = await fetch(
        `/api/contracts/${contract.id}/generate-pdf`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        await fetchContracts(); // Refresh to get updated contract with PDF
      } else {
        console.error("Error generating PDF");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contractType: "PERMANENT_FULL_TIME",
      title: `Arbeidsovereenkomst ${userName}`,
      description: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      salary: "",
      notes: "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SIGNED":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "PENDING":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "EXPIRED":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contractbeheer voor ${userName}`}
      size="full"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {userName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userEmail}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Nieuw Contract
          </Button>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Nog geen contracten voor {userName}
              </p>
              <Button
                variant="primary"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Eerste Contract Toevoegen
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(contract.status)}
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {contract.title}
                        </h4>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Start: {formatDate(contract.startDate)}</p>
                        {contract.endDate && (
                          <p>Eind: {formatDate(contract.endDate)}</p>
                        )}
                        {contract.salary && <p>Salaris: {contract.salary}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!contract.fileUrl && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          }
                          onClick={() => handleGeneratePDF(contract)}
                          disabled={generating}
                        >
                          PDF Genereren
                        </Button>
                      )}

                      {contract.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<EyeIcon className="h-4 w-4" />}
                          onClick={() =>
                            window.open(contract.fileUrl, "_blank")
                          }
                        >
                          Bekijken
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Contract Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nieuw Contract Toevoegen"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contract Type
              </label>
              <select
                value={formData.contractType}
                onChange={(e) =>
                  setFormData({ ...formData, contractType: e.target.value })
                }
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="PERMANENT_FULL_TIME">Vast - Fulltime</option>
                <option value="PERMANENT_PART_TIME">Vast - Parttime</option>
                <option value="TEMPORARY">Tijdelijk</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="DRAFT">Concept</option>
                <option value="PENDING">Wachten op handtekening</option>
                <option value="SIGNED">Ondertekend</option>
              </select>
            </div>
          </div>

          <Input
            label="Contract Titel"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Bijv. Arbeidsovereenkomst John Doe"
            variant="outlined"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Startdatum"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              variant="outlined"
              required
            />

            <Input
              label="Einddatum (optioneel)"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              variant="outlined"
            />
          </div>

          <Input
            label="Salaris/Tarief"
            value={formData.salary}
            onChange={(e) =>
              setFormData({ ...formData, salary: e.target.value })
            }
            placeholder="Bijv. €3000/maand of €25/uur"
            variant="outlined"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Annuleren
            </Button>
            <Button variant="primary" onClick={handleAddContract}>
              Contract Toevoegen
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default PersonnelContractManagement;
