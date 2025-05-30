"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Modal from "./Modal";

interface ImportedEmployee {
  name: string;
  email: string;
  role: string;
  company: string;
  phone?: string;
  address?: string;
  hourlyRate?: string;
  workTypes?: string[];
  kvkNumber?: string;
  btwNumber?: string;
  hasContract?: boolean;
  errors?: string[];
}

interface ExcelImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (employees: ImportedEmployee[]) => Promise<void>;
}

const REQUIRED_COLUMNS = ["name", "email", "role", "company"];
const VALID_ROLES = ["ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"];
const VALID_COMPANIES = [
  "Broers Verhuur",
  "DCRT Event Decorations",
  "DCRT in Building",
];

export default function ExcelImport({
  isOpen,
  onClose,
  onImport,
}: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedEmployee[]>([]);
  const [validData, setValidData] = useState<ImportedEmployee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing">(
    "upload"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setErrors(["Het Excel bestand is leeg"]);
        setIsProcessing(false);
        return;
      }

      // Validate and process data
      const processedData = validateAndProcessData(jsonData);
      setImportedData(processedData.all);
      setValidData(processedData.valid);
      setStep("preview");
    } catch (error) {
      console.error("Error processing file:", error);
      setErrors([
        "Fout bij het verwerken van het bestand. Controleer of het een geldig Excel bestand is.",
      ]);
    }

    setIsProcessing(false);
  };

  const validateAndProcessData = (data: any[]) => {
    const allData: ImportedEmployee[] = [];
    const validData: ImportedEmployee[] = [];
    const globalErrors: string[] = [];

    // Check if required columns exist
    const firstRow = data[0];
    const missingColumns = REQUIRED_COLUMNS.filter((col) => !(col in firstRow));
    if (missingColumns.length > 0) {
      globalErrors.push(`Ontbrekende kolommen: ${missingColumns.join(", ")}`);
      setErrors(globalErrors);
      return { all: [], valid: [] };
    }

    data.forEach((row, index) => {
      const employee: ImportedEmployee = {
        name: String(row.name || "").trim(),
        email: String(row.email || "")
          .trim()
          .toLowerCase(),
        role: String(row.role || "")
          .trim()
          .toUpperCase(),
        company: String(row.company || "").trim(),
        phone: row.phone ? String(row.phone).trim() : undefined,
        address: row.address ? String(row.address).trim() : undefined,
        hourlyRate: row.hourlyRate ? String(row.hourlyRate).trim() : undefined,
        workTypes: row.workTypes
          ? String(row.workTypes)
              .split(",")
              .map((t) => t.trim())
          : [],
        kvkNumber: row.kvkNumber ? String(row.kvkNumber).trim() : undefined,
        btwNumber: row.btwNumber ? String(row.btwNumber).trim() : undefined,
        hasContract: row.hasContract ? Boolean(row.hasContract) : false,
        errors: [],
      };

      // Validate each field
      if (!employee.name) {
        employee.errors!.push("Naam is verplicht");
      }

      if (!employee.email) {
        employee.errors!.push("Email is verplicht");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        employee.errors!.push("Ongeldig email formaat");
      }

      if (!employee.role) {
        employee.errors!.push("Rol is verplicht");
      } else if (!VALID_ROLES.includes(employee.role)) {
        employee.errors!.push(
          `Ongeldige rol. Moet een van de volgende zijn: ${VALID_ROLES.join(
            ", "
          )}`
        );
      }

      if (!employee.company) {
        employee.errors!.push("Bedrijf is verplicht");
      } else if (!VALID_COMPANIES.includes(employee.company)) {
        employee.errors!.push(
          `Ongeldig bedrijf. Moet een van de volgende zijn: ${VALID_COMPANIES.join(
            ", "
          )}`
        );
      }

      if (employee.hourlyRate && isNaN(Number(employee.hourlyRate))) {
        employee.errors!.push("Uurtarief moet een getal zijn");
      }

      if (employee.role === "FREELANCER") {
        if (!employee.kvkNumber) {
          employee.errors!.push("KvK nummer is verplicht voor freelancers");
        }
      }

      allData.push(employee);

      if (employee.errors!.length === 0) {
        validData.push(employee);
      }
    });

    return { all: allData, valid: validData };
  };

  const handleImport = async () => {
    if (validData.length === 0) return;

    console.log(
      "🚀 ExcelImport: Starting import of",
      validData.length,
      "employees"
    );
    setStep("importing");

    try {
      await onImport(validData);
      console.log("✅ ExcelImport: Import completed successfully");
      handleClose();
    } catch (error) {
      console.error("💥 ExcelImport: Import error:", error);

      // Provide more specific error messages
      let errorMessage = "Er is een fout opgetreden bij het importeren";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "De import duurde te lang en is geannuleerd";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "De import duurde te lang. Probeer het opnieuw met minder medewerkers";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage = "Netwerkfout. Controleer je internetverbinding";
        } else {
          errorMessage = error.message;
        }
      }

      setErrors([errorMessage]);
      setStep("preview");
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportedData([]);
    setValidData([]);
    setErrors([]);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Jan de Vries",
        email: "jan@example.com",
        role: "EMPLOYEE",
        company: "Broers Verhuur",
        phone: "+31612345678",
        address: "Hoofdstraat 1, 1234AB Amsterdam",
        hourlyRate: "25.50",
        workTypes: "wasstraat, orderpicker",
        kvkNumber: "", // Only for freelancers
        btwNumber: "", // Only for freelancers
        hasContract: false,
      },
      {
        name: "Marie Janssen",
        email: "marie@example.com",
        role: "FREELANCER",
        company: "DCRT Event Decorations",
        phone: "+31687654321",
        address: "Kerkstraat 10, 5678CD Rotterdam",
        hourlyRate: "35.00",
        workTypes: "op en afbouw werkzaamheden",
        kvkNumber: "12345678",
        btwNumber: "NL123456789B01",
        hasContract: true,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medewerkers Template");
    XLSX.writeFile(wb, "medewerkers_template.xlsx");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📊 Excel Import - Medewerkers"
      description="Importeer medewerkers en freelancers vanuit een Excel bestand"
      size="xl"
    >
      <div className="space-y-6">
        {step === "upload" && (
          <>
            {/* Template Download */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Excel Template
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Download eerst de template om te zien welke kolommen vereist
                    zijn.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="mt-3"
                    leftIcon={<DocumentArrowUpIcon className="h-4 w-4" />}
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Upload Excel Bestand
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Sleep een bestand hierheen of klik om te selecteren
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Ondersteunde formaten: .xlsx, .xls
                </p>
              </div>
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  leftIcon={<DocumentArrowUpIcon className="h-5 w-5" />}
                >
                  {isProcessing ? "Verwerken..." : "Bestand Selecteren"}
                </Button>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Fouten gevonden:
                    </h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === "preview" && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {importedData.length}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Totaal gevonden
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {validData.length}
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">
                  Geldig voor import
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {importedData.length - validData.length}
                </div>
                <div className="text-sm text-red-800 dark:text-red-200">
                  Met fouten
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Naam
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Bedrijf
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Fouten
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {importedData.map((employee, index) => (
                    <tr
                      key={index}
                      className={
                        employee.errors!.length > 0
                          ? "bg-red-50 dark:bg-red-900/10"
                          : ""
                      }
                    >
                      <td className="px-4 py-3">
                        {employee.errors!.length === 0 ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {employee.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {employee.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {employee.role}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {employee.company}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {employee.errors!.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                leftIcon={<DocumentArrowUpIcon className="h-4 w-4" />}
              >
                Ander Bestand
              </Button>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  Annuleren
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={validData.length === 0}
                  leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                >
                  {validData.length} Medewerkers Importeren
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "importing" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mt-4">
              Medewerkers worden geïmporteerd...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Dit kan even duren, even geduld alsjeblieft.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
