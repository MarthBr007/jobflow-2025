"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { ArrowLeft, Save, Send, FileText, Mail, User } from "lucide-react";
import { ContractType } from "@prisma/client";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeType: string;
  company: string;
}

const CONTRACT_TYPES = [
  { value: "PERMANENT_FULL_TIME", label: "Vast contract voltijd" },
  { value: "PERMANENT_PART_TIME", label: "Vast contract deeltijd" },
  { value: "TEMPORARY_FULL_TIME", label: "Tijdelijk contract voltijd" },
  { value: "TEMPORARY_PART_TIME", label: "Tijdelijk contract deeltijd" },
  { value: "FREELANCE", label: "Freelance overeenkomst" },
  { value: "ZERO_HOURS", label: "0-urencontract" },
  { value: "INTERNSHIP", label: "Stage overeenkomst" },
  { value: "PROBATION", label: "Proeftijd contract" },
];

export default function CreateContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get("userId");
  const userName = searchParams?.get("userName");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    contractType: "" as ContractType,
    description: "",
    startDate: "",
    endDate: "",
    salary: "",
    notes: "",
  });

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }

    // Pre-fill title based on user
    if (userName) {
      setFormData((prev) => ({
        ...prev,
        title: `Arbeidscontract ${userName}`,
      }));
    }
  }, [userId, userName]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/personnel/${userId}`);
      const userData = await response.json();
      setUser(userData);

      // Update form with user details
      setFormData((prev) => ({
        ...prev,
        title: `Arbeidscontract ${userData.firstName} ${userData.lastName}`,
      }));
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (sendForSigning = false) => {
    if (!userId) {
      alert("Geen gebruiker geselecteerd");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId,
          status: sendForSigning ? "PENDING_SIGNATURE" : "DRAFT",
          sendForSigning,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (sendForSigning) {
          alert(`Contract verstuurd naar ${user?.email} voor ondertekening`);
        } else {
          alert("Contract opgeslagen als concept");
        }
        router.push("/dashboard/contracts");
      } else {
        alert(result.error || "Er is een fout opgetreden");
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      alert("Er is een fout opgetreden bij het opslaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Terug</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nieuw Contract Aanmaken</h1>
            <p className="text-gray-600">
              Maak een nieuw contract aan{" "}
              {user && `voor ${user.firstName} ${user.lastName}`}
            </p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Medewerker Informatie</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Naam
                </label>
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type Medewerker
                </label>
                <p className="text-sm font-medium">{user.employeeType}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Contract Form */}
      <Card>
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Contract Details</span>
          </h3>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Contract Titel *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Bijv. Arbeidscontract 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="contractType"
                className="block text-sm font-medium text-gray-700"
              >
                Contract Type *
              </label>
              <select
                value={formData.contractType}
                onChange={(e) =>
                  handleInputChange("contractType", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecteer contract type</option>
                {CONTRACT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Salary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Startdatum *
              </label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                Einddatum
              </label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                placeholder="Laat leeg voor onbepaalde tijd"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="salary"
                className="block text-sm font-medium text-gray-700"
              >
                Salaris/Tarief
              </label>
              <Input
                id="salary"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
                placeholder="Bijv. €3000/maand of €25/uur"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Omschrijving
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Beschrijf de functiebeschrijving en verantwoordelijkheden..."
              rows={4}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notities (intern)
            </label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Interne notities die niet in het contract verschijnen..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Digital Signing Process Info */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Digitaal Ondertekening Proces</span>
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              Hoe werkt het ondertekening proces?
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Contract wordt als PDF gegenereerd met alle details</li>
              <li>
                Een beveiligde e-mail wordt verstuurd naar de medewerker (
                {user?.email})
              </li>
              <li>
                De medewerker krijgt een unieke link om het contract te bekijken
              </li>
              <li>Na akkoord kan de medewerker digitaal ondertekenen</li>
              <li>Beiden partijen ontvangen een ondertekende kopie</li>
              <li>Het contract wordt automatisch opgeslagen in het systeem</li>
            </ol>
            <div className="mt-3 p-3 bg-white rounded border-l-4 border-green-400">
              <p className="text-sm">
                <strong>Veiligheid:</strong> Alle ondertekeningen zijn voorzien
                van SHA-256 encryptie en timestamp verificatie.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/contracts")}
        >
          Annuleren
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={
            loading ||
            !formData.title ||
            !formData.contractType ||
            !formData.startDate
          }
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Opslaan als Concept</span>
        </Button>

        <Button
          onClick={() => handleSave(true)}
          disabled={
            loading ||
            !formData.title ||
            !formData.contractType ||
            !formData.startDate
          }
          className="flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Versturen voor Ondertekening</span>
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Contract wordt verwerkt...</p>
        </div>
      )}
    </div>
  );
}
