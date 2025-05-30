"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  UserIcon,
  CurrencyEuroIcon,
  CalendarDaysIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import {
  ContractData,
  downloadFreelanceContract,
  downloadEmploymentContract,
  downloadOnCallContract,
} from "@/utils/pdfGenerator";

interface QuickContractData {
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
  email: string;
  iban: string;

  // Salary fields (only one will be used based on employee type)
  monthlySalary?: string; // For permanent employees
  hourlyWage?: string; // For flex workers
  projectValue?: string; // For freelancers (total amount)
  hourlyRate?: string; // For freelancers (hourly rate)

  // Basic position info
  position: string;
  department: string;
  startDate: string;

  // Freelancer specific
  kvkNumber?: string;
  btwNumber?: string;
}

interface QuickContractGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: {
    name: string;
    email: string;
    address?: string;
    employeeType?: string;
    monthlySalary?: string;
    hourlyWage?: string;
    kvkNumber?: string;
    btwNumber?: string;
  };
  onContractGenerated?: (contractData: QuickContractData) => void;
}

export default function QuickContractGenerator({
  isOpen,
  onClose,
  employeeData,
  onContractGenerated,
}: QuickContractGeneratorProps) {
  const employeeType = employeeData?.employeeType || "PERMANENT";
  const [nameParts] = useState(() => {
    const fullName = employeeData?.name || "";
    const parts = fullName.split(" ");
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  });

  const [contractData, setContractData] = useState<QuickContractData>({
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    birthDate: "",
    address: employeeData?.address || "",
    email: employeeData?.email || "",
    iban: "",
    monthlySalary:
      employeeType === "PERMANENT"
        ? employeeData?.monthlySalary || ""
        : undefined,
    hourlyWage:
      employeeType === "FLEX_WORKER"
        ? employeeData?.hourlyWage || ""
        : undefined,
    projectValue: employeeType === "FREELANCER" ? "" : undefined,
    hourlyRate: employeeType === "FREELANCER" ? "" : undefined,
    position: "",
    department: "",
    startDate: "",
    kvkNumber:
      employeeType === "FREELANCER" ? employeeData?.kvkNumber || "" : undefined,
    btwNumber:
      employeeType === "FREELANCER" ? employeeData?.btwNumber || "" : undefined,
  });

  const [generating, setGenerating] = useState(false);
  const [useProjectValue, setUseProjectValue] = useState(true); // For freelancers: true = project value, false = hourly rate

  const handleInputChange = (field: keyof QuickContractData, value: string) => {
    setContractData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getContractTitle = () => {
    switch (employeeType) {
      case "FREELANCER":
        return "Freelance Overeenkomst - Basis Template";
      case "FLEX_WORKER":
        return "Oproepovereenkomst - Basis Template";
      default:
        return "Arbeidsovereenkomst - Basis Template";
    }
  };

  const getSalaryLabel = () => {
    switch (employeeType) {
      case "FREELANCER":
        return useProjectValue
          ? "Overeengekomen Totaal Bedrag (€)"
          : "Uurtarief (€)";
      case "FLEX_WORKER":
        return "Bruto Uursalaris (€)";
      default:
        return "Bruto Maandsalaris (€)";
    }
  };

  const getSalaryPlaceholder = () => {
    switch (employeeType) {
      case "FREELANCER":
        return useProjectValue ? "2500" : "25.00";
      case "FLEX_WORKER":
        return "15.50";
      default:
        return "3500";
    }
  };

  const getSalaryValue = () => {
    switch (employeeType) {
      case "FREELANCER":
        return useProjectValue
          ? contractData.projectValue || ""
          : contractData.hourlyRate || "";
      case "FLEX_WORKER":
        return contractData.hourlyWage || "";
      default:
        return contractData.monthlySalary || "";
    }
  };

  const setSalaryValue = (value: string) => {
    switch (employeeType) {
      case "FREELANCER":
        if (useProjectValue) {
          handleInputChange("projectValue", value);
        } else {
          handleInputChange("hourlyRate", value);
        }
        break;
      case "FLEX_WORKER":
        handleInputChange("hourlyWage", value);
        break;
      default:
        handleInputChange("monthlySalary", value);
        break;
    }
  };

  const generateContract = async () => {
    setGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fullName =
        `${contractData.firstName} ${contractData.lastName}`.trim();

      // Create contract data for PDF generation
      const contractDocument: ContractData = {
        contractNumber: `${
          employeeType === "FREELANCER"
            ? "FL"
            : employeeType === "FLEX_WORKER"
            ? "OPR"
            : "EMP"
        }-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        contractType:
          employeeType === "FREELANCER"
            ? "FREELANCE"
            : employeeType === "FLEX_WORKER"
            ? "ON_CALL"
            : "EMPLOYMENT",
        employeeType:
          employeeType === "FLEX_WORKER" ? "FLEX_WORKER" : "PERMANENT",
        companyName: "Broers Verhuur",
        employeeName: fullName,
        employeeAddress: contractData.address,
        employeeEmail: contractData.email,
        employeeBirthDate: contractData.birthDate,
        position: contractData.position,
        department: contractData.department,
        startDate: contractData.startDate,

        // Permanent employee fields
        monthlySalary:
          employeeType === "PERMANENT" ? contractData.monthlySalary : undefined,
        workingHours: employeeType === "PERMANENT" ? "40" : undefined,

        // Flex worker fields
        hourlyWage:
          employeeType === "FLEX_WORKER" ? contractData.hourlyWage : undefined,
        minimumHours: employeeType === "FLEX_WORKER" ? "0" : undefined,
        maximumHours: employeeType === "FLEX_WORKER" ? "40" : undefined,
        callNotice: employeeType === "FLEX_WORKER" ? "4" : undefined,

        // Freelancer fields
        projectTitle:
          employeeType === "FREELANCER"
            ? `${contractData.position} werkzaamheden`
            : undefined,
        projectDescription:
          employeeType === "FREELANCER"
            ? `Uitvoering van ${contractData.position} taken voor ${contractData.department}`
            : undefined,
        deliverables:
          employeeType === "FREELANCER"
            ? "Te bepalen specifieke deliverables conform projectomschrijving"
            : undefined,
        projectValue:
          employeeType === "FREELANCER" && useProjectValue
            ? contractData.projectValue
            : undefined,
        paymentTerms:
          employeeType === "FREELANCER" ? "30 dagen na oplevering" : undefined,
        kvkNumber:
          employeeType === "FREELANCER" ? contractData.kvkNumber : undefined,
        btwNumber:
          employeeType === "FREELANCER" ? contractData.btwNumber : undefined,
        specificScope:
          employeeType === "FREELANCER"
            ? `Specifieke ${contractData.position} werkzaamheden voor afdeling ${contractData.department}`
            : undefined,

        // Default DBA compliance (for freelancers)
        independenceClause: employeeType === "FREELANCER",
        substitutionAllowed: employeeType === "FREELANCER",
        performanceBased: employeeType === "FREELANCER",
        ownRisk: employeeType === "FREELANCER",

        vacation: "25",
      };

      // Download appropriate contract type
      switch (employeeType) {
        case "FREELANCER":
          downloadFreelanceContract(contractDocument);
          break;
        case "FLEX_WORKER":
          downloadOnCallContract(contractDocument);
          break;
        default:
          downloadEmploymentContract(contractDocument);
          break;
      }

      onContractGenerated?.(contractData);
      onClose();
    } catch (error) {
      console.error("Error generating contract:", error);
    } finally {
      setGenerating(false);
    }
  };

  const isFormValid = () => {
    const baseValid =
      contractData.firstName &&
      contractData.lastName &&
      contractData.birthDate &&
      contractData.address &&
      contractData.email &&
      contractData.iban &&
      contractData.position &&
      contractData.department &&
      contractData.startDate;

    const salaryValid = getSalaryValue().trim() !== "";

    const freelancerValid =
      employeeType !== "FREELANCER" ||
      (contractData.kvkNumber && contractData.btwNumber);

    return baseValid && salaryValid && freelancerValid;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getContractTitle()}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            ⚡ Snelle Contract Generatie
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Vul alleen de essentiële gegevens in voor een basis contract. Dit
            template kan later worden aangepast met aanvullende voorwaarden.
          </p>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Persoonsgegevens
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Voornaam"
              value={contractData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              required
            />
            <Input
              label="Achternaam"
              value={contractData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Geboortedatum"
              type="date"
              value={contractData.birthDate}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={contractData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <Input
            label="Volledig Adres"
            value={contractData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            leftIcon={<HomeIcon className="h-5 w-5" />}
            placeholder="Straat 123, 1234AB Plaats"
            required
          />

          <Input
            label="IBAN Rekeningnummer"
            value={contractData.iban}
            onChange={(e) => handleInputChange("iban", e.target.value)}
            placeholder="NL91ABNA0417164300"
            required
          />
        </div>

        {/* Position Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Functie & Salaris
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Functie"
              value={contractData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
              placeholder="Bijv: Evenement Coördinator"
              required
            />
            <Input
              label="Afdeling"
              value={contractData.department}
              onChange={(e) => handleInputChange("department", e.target.value)}
              placeholder="Bijv: Operationeel"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Startdatum"
              type="date"
              value={contractData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />

            <div className="space-y-2">
              {/* Freelancer salary type selector */}
              {employeeType === "FREELANCER" && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Betalingswijze
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={useProjectValue}
                        onChange={() => setUseProjectValue(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Totaal bedrag
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!useProjectValue}
                        onChange={() => setUseProjectValue(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Uurtarief
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <Input
                label={getSalaryLabel()}
                type="number"
                step="0.01"
                value={getSalaryValue()}
                onChange={(e) => setSalaryValue(e.target.value)}
                leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
                placeholder={getSalaryPlaceholder()}
                required
              />
            </div>
          </div>
        </div>

        {/* Freelancer specific fields */}
        {employeeType === "FREELANCER" && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Bedrijfsgegevens
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="KVK Nummer"
                value={contractData.kvkNumber || ""}
                onChange={(e) => handleInputChange("kvkNumber", e.target.value)}
                placeholder="12345678"
                required
              />
              <Input
                label="BTW Nummer"
                value={contractData.btwNumber || ""}
                onChange={(e) => handleInputChange("btwNumber", e.target.value)}
                placeholder="NL123456789B01"
                required
              />
            </div>
          </div>
        )}

        {/* Contract Preview */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            📋 Contract Preview
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <strong>
                {contractData.firstName} {contractData.lastName}
              </strong>{" "}
              - {contractData.position}
            </p>
            <p>Start: {contractData.startDate || "Nog niet ingevuld"}</p>
            <p>
              Salaris: €{getSalaryValue() || "0"}{" "}
              {employeeType === "FREELANCER" && !useProjectValue
                ? "per uur"
                : employeeType === "FLEX_WORKER"
                ? "per uur"
                : employeeType === "FREELANCER"
                ? "totaal"
                : "per maand"}
            </p>
            <p>
              Type:{" "}
              {employeeType === "FREELANCER"
                ? "Freelance Overeenkomst"
                : employeeType === "FLEX_WORKER"
                ? "Oproepovereenkomst"
                : "Arbeidsovereenkomst"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={generateContract}
            disabled={!isFormValid() || generating}
            loading={generating}
            leftIcon={<DocumentTextIcon className="h-5 w-5" />}
          >
            {generating ? "Contract Genereren..." : "Contract Genereren"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
