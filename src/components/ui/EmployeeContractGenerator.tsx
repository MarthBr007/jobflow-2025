"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import {
  ContractData,
  downloadEmploymentContract,
  downloadOnCallContract,
} from "@/utils/pdfGenerator";

interface EmploymentContractData {
  // Employee info
  employeeName: string;
  employeeAddress: string;
  employeeEmail: string;

  // Position info
  position: string;
  department: string;
  startDate: string;
  endDate?: string;
  contractType: "permanent" | "temporary";

  // Salary and conditions (for permanent employees)
  monthlySalary?: string;
  workingHours?: string;

  // Hourly wage and conditions (for flex workers)
  hourlyWage?: string;
  minimumHours?: string;
  maximumHours?: string;
  callNotice?: string;

  vacation: string;

  // Additional terms
  probationPeriod: string;
  noticePeriod: string;
  additionalTerms: string;
}

interface EmployeeContractGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: {
    name: string;
    email: string;
    address?: string;
    monthlySalary?: string;
    hourlyWage?: string;
    employeeType?: string;
  };
  onContractGenerated?: (contractData: EmploymentContractData) => void;
}

export default function EmployeeContractGenerator({
  isOpen,
  onClose,
  employeeData,
  onContractGenerated,
}: EmployeeContractGeneratorProps) {
  const isFlexWorker = employeeData?.employeeType === "FLEX_WORKER";

  const [contractData, setContractData] = useState<EmploymentContractData>({
    employeeName: employeeData?.name || "",
    employeeAddress: employeeData?.address || "",
    employeeEmail: employeeData?.email || "",
    position: "",
    department: "",
    startDate: "",
    endDate: "",
    contractType: "permanent",
    monthlySalary: isFlexWorker ? undefined : employeeData?.monthlySalary || "",
    workingHours: isFlexWorker ? undefined : "40",
    hourlyWage: isFlexWorker ? employeeData?.hourlyWage || "" : undefined,
    minimumHours: isFlexWorker ? "0" : undefined,
    maximumHours: isFlexWorker ? "40" : undefined,
    callNotice: isFlexWorker ? "4" : undefined,
    vacation: "25",
    probationPeriod: "2",
    noticePeriod: "1",
    additionalTerms: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  const handleInputChange = (
    field: keyof EmploymentContractData,
    value: string
  ) => {
    setContractData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateContract = async () => {
    setGenerating(true);

    try {
      // Simulate contract generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const contractDocument: ContractData = {
        contractNumber: isFlexWorker
          ? `OPR-${Date.now()}`
          : `EMP-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        contractType: isFlexWorker ? "ON_CALL" : "EMPLOYMENT",
        employeeType: isFlexWorker ? "FLEX_WORKER" : "PERMANENT",
        companyName: "Broers Verhuur",
        employeeName: contractData.employeeName,
        employeeAddress: contractData.employeeAddress,
        employeeEmail: contractData.employeeEmail,
        position: contractData.position,
        department: contractData.department,
        startDate: contractData.startDate,
        endDate:
          contractData.contractType === "temporary"
            ? contractData.endDate
            : undefined,
        // Permanent employee fields
        monthlySalary: isFlexWorker ? undefined : contractData.monthlySalary,
        workingHours: isFlexWorker ? undefined : contractData.workingHours,
        // Flex worker fields
        hourlyWage: isFlexWorker ? contractData.hourlyWage : undefined,
        minimumHours: isFlexWorker ? contractData.minimumHours : undefined,
        maximumHours: isFlexWorker ? contractData.maximumHours : undefined,
        callNotice: isFlexWorker ? contractData.callNotice : undefined,
        vacation: contractData.vacation,
      };

      // Download appropriate contract type
      if (isFlexWorker) {
        downloadOnCallContract(contractDocument);
      } else {
        downloadEmploymentContract(contractDocument);
      }

      onContractGenerated?.(contractData);
      onClose();
    } catch (error) {
      console.error("Error generating contract:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isFlexWorker
          ? "Oproepovereenkomst Generator"
          : "Arbeidsovereenkomst Generator"
      }
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

        {/* Step 1: Employee Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Medewerker Gegevens
              </h3>
            </div>

            {/* Show contract type info */}
            {isFlexWorker && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                  🏃‍♂️ Oproepovereenkomst
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Voor deze flexwerker wordt een oproepovereenkomst gegenereerd
                  conform artikel 7:628a BW. Dit type contract biedt
                  flexibiliteit voor zowel werkgever als werknemer.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Volledige Naam"
                value={contractData.employeeName}
                onChange={(e) =>
                  handleInputChange("employeeName", e.target.value)
                }
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={contractData.employeeEmail}
                onChange={(e) =>
                  handleInputChange("employeeEmail", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Woonadres
              </label>
              <textarea
                value={contractData.employeeAddress}
                onChange={(e) =>
                  handleInputChange("employeeAddress", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Straat en huisnummer, Postcode, Plaats"
                required
              />
            </div>
          </div>
        )}

        {/* Step 2: Position & Contract Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Functie & Contract Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Functietitel"
                value={contractData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Bijv: Evenement Coördinator"
                required
              />
              <Input
                label="Afdeling"
                value={contractData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                placeholder="Bijv: Operationeel"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contract Type
                </label>
                <select
                  value={contractData.contractType}
                  onChange={(e) =>
                    handleInputChange("contractType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="permanent">Voor onbepaalde tijd</option>
                  <option value="temporary">Voor bepaalde tijd</option>
                </select>
              </div>
            </div>

            {contractData.contractType === "temporary" && (
              <Input
                label="Einddatum (voor bepaalde tijd)"
                type="date"
                value={contractData.endDate || ""}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                required
              />
            )}

            {/* Flex worker specific fields */}
            {isFlexWorker && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Oproep Voorwaarden
                </h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    label="Minimum oproeptermijn (uren)"
                    type="number"
                    value={contractData.callNotice || ""}
                    onChange={(e) =>
                      handleInputChange("callNotice", e.target.value)
                    }
                    placeholder="4"
                    helperText="Minimaal aantal uren van tevoren oproepen"
                  />
                  <Input
                    label="Minimum uren per week"
                    type="number"
                    value={contractData.minimumHours || ""}
                    onChange={(e) =>
                      handleInputChange("minimumHours", e.target.value)
                    }
                    placeholder="0"
                    helperText="0 = geen gegarandeerde uren"
                  />
                </div>
                <Input
                  label="Maximum uren per week"
                  type="number"
                  value={contractData.maximumHours || ""}
                  onChange={(e) =>
                    handleInputChange("maximumHours", e.target.value)
                  }
                  placeholder="40"
                  helperText="Maximaal aantal uren per week"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Salary & Conditions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <CurrencyEuroIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Arbeidsvoorwaarden
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {isFlexWorker ? (
                <Input
                  label="Bruto Uurloon (€)"
                  type="number"
                  step="0.01"
                  value={contractData.hourlyWage || ""}
                  onChange={(e) =>
                    handleInputChange("hourlyWage", e.target.value)
                  }
                  leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                  placeholder="15.50"
                  required
                />
              ) : (
                <>
                  <Input
                    label="Bruto Maandloon (€)"
                    type="number"
                    value={contractData.monthlySalary || ""}
                    onChange={(e) =>
                      handleInputChange("monthlySalary", e.target.value)
                    }
                    leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                    placeholder="3500"
                    required
                  />
                  <Input
                    label="Werkende uren per week"
                    type="number"
                    value={contractData.workingHours || ""}
                    onChange={(e) =>
                      handleInputChange("workingHours", e.target.value)
                    }
                    leftIcon={<ClockIcon className="h-5 w-5" />}
                    placeholder="40"
                    required
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Vakantiedagen per jaar"
                type="number"
                value={contractData.vacation}
                onChange={(e) => handleInputChange("vacation", e.target.value)}
                leftIcon={<CalendarDaysIcon className="h-5 w-5" />}
                placeholder="25"
                helperText={isFlexWorker ? "Naar rato van gewerkte uren" : ""}
                required
              />
              <Input
                label="Proeftijd (maanden)"
                type="number"
                value={contractData.probationPeriod}
                onChange={(e) =>
                  handleInputChange("probationPeriod", e.target.value)
                }
                placeholder="2"
                required
              />
            </div>

            <Input
              label="Opzegtermijn (maanden)"
              type="number"
              value={contractData.noticePeriod}
              onChange={(e) =>
                handleInputChange("noticePeriod", e.target.value)
              }
              placeholder="1"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aanvullende Voorwaarden (optioneel)
              </label>
              <textarea
                value={contractData.additionalTerms}
                onChange={(e) =>
                  handleInputChange("additionalTerms", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Eventuele aanvullende afspraken, secundaire arbeidsvoorwaarden, etc..."
              />
            </div>

            {/* Contract Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Contract Overzicht
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>
                  <strong>{contractData.employeeName}</strong> -{" "}
                  {contractData.position}
                </p>
                {isFlexWorker ? (
                  <p>
                    Uurloon: €{contractData.hourlyWage}/uur (
                    {contractData.minimumHours || 0}-
                    {contractData.maximumHours || "∞"} uur/week)
                  </p>
                ) : (
                  <p>
                    Salaris: €{contractData.monthlySalary}/maand (
                    {contractData.workingHours} uur/week)
                  </p>
                )}
                <p>
                  Start: {contractData.startDate} (
                  {contractData.contractType === "permanent"
                    ? "Vast"
                    : "Tijdelijk"}
                  )
                </p>
                <p>
                  Vakantie: {contractData.vacation} dagen - Proeftijd:{" "}
                  {contractData.probationPeriod} maanden
                </p>
                {isFlexWorker && (
                  <p>
                    Oproeptermijn: {contractData.callNotice || 4} uur van
                    tevoren
                  </p>
                )}
              </div>
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
                    (!contractData.employeeName ||
                      !contractData.employeeEmail ||
                      !contractData.employeeAddress)) ||
                  (currentStep === 2 &&
                    (!contractData.position ||
                      !contractData.department ||
                      !contractData.startDate))
                }
              >
                Volgende
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={generateContract}
                disabled={
                  generating ||
                  (isFlexWorker
                    ? !contractData.hourlyWage || !contractData.vacation
                    : !contractData.monthlySalary ||
                      !contractData.workingHours ||
                      !contractData.vacation)
                }
                loading={generating}
                leftIcon={<DocumentTextIcon className="h-5 w-5" />}
              >
                {generating
                  ? "Contract Genereren..."
                  : isFlexWorker
                  ? "Oproepovereenkomst Genereren"
                  : "Arbeidsovereenkomst Genereren"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
