"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import { ContractData, downloadFreelanceContract } from "@/utils/pdfGenerator";

interface FreelanceContractData {
  // Medewerker info
  freelancerName: string;
  freelancerAddress: string;
  freelancerKvk: string;
  freelancerBtw: string;
  freelancerEmail: string;

  // Project info
  projectTitle: string;
  projectDescription: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  projectValue: string;
  paymentTerms: string;

  // Wet DBA compliance
  specificScope: string;
  independenceClause: boolean;
  substitutionAllowed: boolean;
  performanceBased: boolean;
  ownRisk: boolean;
}

interface FreelanceContractGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: {
    name: string;
    email: string;
    kvkNumber?: string;
    btwNumber?: string;
    address?: string;
  };
  onContractGenerated?: (contractData: FreelanceContractData) => void;
}

export default function FreelanceContractGenerator({
  isOpen,
  onClose,
  employeeData,
  onContractGenerated,
}: FreelanceContractGeneratorProps) {
  const [contractData, setContractData] = useState<FreelanceContractData>({
    freelancerName: employeeData?.name || "",
    freelancerAddress: employeeData?.address || "",
    freelancerKvk: employeeData?.kvkNumber || "",
    freelancerBtw: employeeData?.btwNumber || "",
    freelancerEmail: employeeData?.email || "",
    projectTitle: "",
    projectDescription: "",
    deliverables: "",
    startDate: "",
    endDate: "",
    projectValue: "",
    paymentTerms: "30 dagen na oplevering",
    specificScope: "",
    independenceClause: true,
    substitutionAllowed: true,
    performanceBased: true,
    ownRisk: true,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  const handleInputChange = (
    field: keyof FreelanceContractData,
    value: string | boolean
  ) => {
    setContractData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const checkWetDBACompliance = () => {
    const issues = [];

    if (!contractData.specificScope.trim()) {
      issues.push("Specifieke omvang van het werk is niet gedefinieerd");
    }

    if (!contractData.independenceClause) {
      issues.push("Onafhankelijkheidsclausule niet geaccepteerd");
    }

    if (!contractData.substitutionAllowed) {
      issues.push("Vervangingsmogelijkheid niet toegestaan");
    }

    if (!contractData.performanceBased) {
      issues.push("Betaling niet gebaseerd op prestaties");
    }

    if (!contractData.ownRisk) {
      issues.push("Eigen bedrijfsrisico niet geaccepteerd");
    }

    return issues;
  };

  const generateContract = async () => {
    setGenerating(true);

    try {
      // Simulate contract generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create contract data for PDF generation
      const contractDocument: ContractData = {
        contractNumber: `FL-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        contractType: "FREELANCE",
        companyName: "Broers Verhuur",
        employeeName: contractData.freelancerName,
        employeeAddress: contractData.freelancerAddress,
        employeeEmail: contractData.freelancerEmail,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        projectTitle: contractData.projectTitle,
        projectDescription: contractData.projectDescription,
        deliverables: contractData.deliverables,
        projectValue: contractData.projectValue,
        paymentTerms: contractData.paymentTerms,
        kvkNumber: contractData.freelancerKvk,
        btwNumber: contractData.freelancerBtw,
        specificScope: contractData.specificScope,
        independenceClause: contractData.independenceClause,
        substitutionAllowed: contractData.substitutionAllowed,
        performanceBased: contractData.performanceBased,
        ownRisk: contractData.ownRisk,
      };

      // Generate and download PDF
      downloadFreelanceContract(contractDocument);

      onContractGenerated?.(contractData);
      onClose();
    } catch (error) {
      console.error("Error generating contract:", error);
    } finally {
      setGenerating(false);
    }
  };

  const complianceIssues = checkWetDBACompliance();
  const isCompliant = complianceIssues.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Freelance Overeenkomst Generator"
      size="xl"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`h-0.5 w-16 mx-2 ${
                    currentStep > step
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Freelancer Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4 space-x-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Freelancer Gegevens
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Naam"
                value={contractData.freelancerName}
                onChange={(e) =>
                  handleInputChange("freelancerName", e.target.value)
                }
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={contractData.freelancerEmail}
                onChange={(e) =>
                  handleInputChange("freelancerEmail", e.target.value)
                }
                required
              />
            </div>

            <Input
              label="Adres"
              value={contractData.freelancerAddress}
              onChange={(e) =>
                handleInputChange("freelancerAddress", e.target.value)
              }
              required
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="KvK Nummer"
                value={contractData.freelancerKvk}
                onChange={(e) =>
                  handleInputChange("freelancerKvk", e.target.value)
                }
                required
              />
              <Input
                label="BTW Nummer"
                value={contractData.freelancerBtw}
                onChange={(e) =>
                  handleInputChange("freelancerBtw", e.target.value)
                }
                placeholder="NL123456789B01"
              />
            </div>
          </div>
        )}

        {/* Step 2: Project Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4 space-x-2">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Project Details
              </h3>
            </div>

            <Input
              label="Project Titel"
              value={contractData.projectTitle}
              onChange={(e) =>
                handleInputChange("projectTitle", e.target.value)
              }
              placeholder="Bijv: Evenement decoratie en logistiek"
              required
            />

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Beschrijving
              </label>
              <textarea
                value={contractData.projectDescription}
                onChange={(e) =>
                  handleInputChange("projectDescription", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white"
                placeholder="Gedetailleerde beschrijving van het project..."
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Te Leveren Prestaties (Wet DBA Vereist)
              </label>
              <textarea
                value={contractData.deliverables}
                onChange={(e) =>
                  handleInputChange("deliverables", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white"
                placeholder="Specifieke deliverables en resultaten..."
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Startdatum"
                type="date"
                value={contractData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
              />
              <Input
                label="Einddatum"
                type="date"
                value={contractData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Projectwaarde (€)"
                type="number"
                value={contractData.projectValue}
                onChange={(e) =>
                  handleInputChange("projectValue", e.target.value)
                }
                leftIcon={<CurrencyEuroIcon className="w-5 h-5" />}
                placeholder="2500"
                required
              />
              <Input
                label="Betalingsvoorwaarden"
                value={contractData.paymentTerms}
                onChange={(e) =>
                  handleInputChange("paymentTerms", e.target.value)
                }
                placeholder="30 dagen na oplevering"
              />
            </div>
          </div>
        )}

        {/* Step 3: Wet DBA Compliance */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center mb-4 space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Wet DBA Compliance Check
              </h3>
            </div>

            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
              <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                📋 Wat is de Wet DBA?
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                De Wet Deregulering Beoordeling Arbeidsrelaties zorgt ervoor dat
                schijnzelfstandigheid wordt voorkomen. Deze tool helpt je een
                compliant freelance contract te maken.
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Specifieke Werkzaamheden (Verplicht)
              </label>
              <textarea
                value={contractData.specificScope}
                onChange={(e) =>
                  handleInputChange("specificScope", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white"
                placeholder="Definieer exacte taken en verantwoordelijkheden. Vermijd algemene omschrijvingen zoals 'algemene werkzaamheden'."
                required
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 text-md dark:text-white">
                Wet DBA Vereisten (Alle moeten geaccepteerd worden)
              </h4>

              {[
                {
                  key: "independenceClause",
                  label: "Onafhankelijkheid gegarandeerd",
                  description:
                    "Freelancer bepaalt zelf hoe en wanneer werk wordt uitgevoerd",
                },
                {
                  key: "substitutionAllowed",
                  label: "Vervangingsmogelijkheid toegestaan",
                  description:
                    "Freelancer mag gekwalificeerde vervanger inzetten",
                },
                {
                  key: "performanceBased",
                  label: "Prestatiegerichte betaling",
                  description:
                    "Betaling voor resultaten, niet voor gewerkte uren",
                },
                {
                  key: "ownRisk",
                  label: "Eigen bedrijfsrisico",
                  description: "Freelancer draagt eigen kosten en risico's",
                },
              ].map((item) => (
                <label key={item.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={
                      contractData[
                        item.key as keyof FreelanceContractData
                      ] as boolean
                    }
                    onChange={(e) =>
                      handleInputChange(
                        item.key as keyof FreelanceContractData,
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Compliance Status */}
            <div
              className={`p-4 rounded-lg border ${
                isCompliant
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                {isCompliant ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                )}
                <h4
                  className={`text-sm font-medium ${
                    isCompliant
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {isCompliant
                    ? "Contract is Wet DBA Compliant ✅"
                    : "Contract nog niet compliant ⚠️"}
                </h4>
              </div>
              {!isCompliant && (
                <ul className="mt-2 text-sm text-red-800 dark:text-red-200">
                  {complianceIssues.map((issue, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <span>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                onClose();
              }
            }}
          >
            {currentStep === 1 ? "Annuleren" : "Vorige"}
          </Button>

          <div className="flex space-x-3">
            {currentStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 &&
                    (!contractData.freelancerName ||
                      !contractData.freelancerEmail ||
                      !contractData.freelancerKvk)) ||
                  (currentStep === 2 &&
                    (!contractData.projectTitle ||
                      !contractData.projectDescription ||
                      !contractData.deliverables))
                }
              >
                Volgende
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={generateContract}
                disabled={!isCompliant || generating}
                loading={generating}
                leftIcon={<DocumentTextIcon className="w-5 h-5" />}
              >
                {generating ? "Contract Genereren..." : "Contract Genereren"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
