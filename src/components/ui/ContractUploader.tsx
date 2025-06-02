"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import Toast from "./Toast";
import { useToast } from "@/hooks/useToast";

interface ContractUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onContractUploaded?: (contractId: string) => void;
}

export default function ContractUploader({
  isOpen,
  onClose,
  userId,
  userName,
  onContractUploaded,
}: ContractUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [contractData, setContractData] = useState({
    title: "",
    description: "",
    contractType: "PERMANENT_FULL_TIME",
    startDate: "",
    endDate: "",
    salary: "",
    notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      // Auto-generate title from filename if not set
      if (!contractData.title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setContractData((prev) => ({
          ...prev,
          title: `${nameWithoutExt} - ${userName}`,
        }));
      }
    } else {
      showToast("Alleen PDF bestanden zijn toegestaan", "error");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setContractData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const uploadContract = async () => {
    if (!file) {
      showToast("Selecteer eerst een PDF bestand", "warning");
      return;
    }

    if (!contractData.title || !contractData.startDate) {
      showToast("Vul alle verplichte velden in", "warning");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          contractType: contractData.contractType,
          title: contractData.title,
          description: contractData.description,
          startDate: contractData.startDate,
          endDate: contractData.endDate || null,
          salary: contractData.salary,
          notes: contractData.notes,
          fileContent: fileData,
          fileName: file.name,
        }),
      });

      if (response.ok) {
        const contract = await response.json();
        onContractUploaded?.(contract.id);
        onClose();
        showToast("Contract succesvol geüpload", "success");

        // Reset form
        setFile(null);
        setContractData({
          title: "",
          description: "",
          contractType: "PERMANENT_FULL_TIME",
          startDate: "",
          endDate: "",
          salary: "",
          notes: "",
        });
      } else {
        console.error("Failed to upload contract");
        showToast(
          "Er is een fout opgetreden bij het uploaden van het contract",
          "error"
        );
      }
    } catch (error) {
      console.error("Error uploading contract:", error);
      showToast(
        "Er is een fout opgetreden bij het uploaden van het contract",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const isFormValid = () => {
    return file && contractData.title && contractData.startDate;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contract Uploaden - ${userName}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            PDF Document
          </h3>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Sleep PDF bestand hierheen of klik om te selecteren
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Alleen PDF bestanden zijn toegestaan
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
                id="contract-file"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("contract-file")?.click()
                }
              >
                Bestand Selecteren
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  leftIcon={<XMarkIcon className="h-4 w-4" />}
                >
                  Verwijderen
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Contract Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Contract Informatie
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contract Titel"
              value={contractData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Bijv: Arbeidsovereenkomst 2024"
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
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="PERMANENT_FULL_TIME">
                  Vast contract (voltijd)
                </option>
                <option value="PERMANENT_PART_TIME">
                  Vast contract (deeltijd)
                </option>
                <option value="TEMPORARY_FULL_TIME">
                  Tijdelijk contract (voltijd)
                </option>
                <option value="TEMPORARY_PART_TIME">
                  Tijdelijk contract (deeltijd)
                </option>
                <option value="FREELANCE">Freelance overeenkomst</option>
                <option value="ZERO_HOURS">Oproepovereenkomst</option>
                <option value="INTERNSHIP">Stage overeenkomst</option>
                <option value="PROBATION">Proeftijd contract</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Startdatum"
              type="date"
              value={contractData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />

            <Input
              label="Einddatum (optioneel)"
              type="date"
              value={contractData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              helperText="Laat leeg voor onbepaalde tijd"
            />
          </div>

          <Input
            label="Salaris/Tarief"
            value={contractData.salary}
            onChange={(e) => handleInputChange("salary", e.target.value)}
            placeholder="Bijv: €3500/maand of €25/uur"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Beschrijving
            </label>
            <textarea
              value={contractData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Optionele beschrijving van het contract..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Opmerkingen
            </label>
            <textarea
              value={contractData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={2}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Interne opmerkingen..."
            />
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
            onClick={uploadContract}
            disabled={!isFormValid() || uploading}
            loading={uploading}
            leftIcon={<CloudArrowUpIcon className="h-5 w-5" />}
          >
            {uploading ? "Contract Uploaden..." : "Contract Uploaden"}
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </Modal>
  );
}
