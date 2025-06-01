"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FileText, Check, X, Clock, Shield, AlertTriangle } from "lucide-react";

interface Contract {
  id: string;
  title: string;
  contractType: string;
  description: string;
  startDate: string;
  endDate?: string;
  salary?: string;
  status: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const CONTRACT_TYPE_LABELS = {
  PERMANENT_FULL_TIME: "Vast contract voltijd",
  PERMANENT_PART_TIME: "Vast contract deeltijd",
  TEMPORARY_FULL_TIME: "Tijdelijk contract voltijd",
  TEMPORARY_PART_TIME: "Tijdelijk contract deeltijd",
  FREELANCE: "Freelance overeenkomst",
  ZERO_HOURS: "0-urencontract",
  INTERNSHIP: "Stage overeenkomst",
  PROBATION: "Proeftijd contract",
} as const;

export default function ContractSigningPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();

  const contractId = params.id;
  const token = searchParams?.token as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/contracts/${contractId}?token=${token}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Contract niet gevonden");
        } else if (response.status === 401) {
          setError("Geen toegang tot dit contract");
        } else {
          setError("Fout bij het laden van het contract");
        }
        return;
      }

      const data = await response.json();
      setContract(data);
    } catch (error) {
      console.error("Failed to fetch contract:", error);
      setError("Er is een fout opgetreden bij het laden van het contract");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!agreed) {
      alert(
        "Je moet akkoord gaan met de contractvoorwaarden om te kunnen ondertekenen"
      );
      return;
    }

    setSigning(true);
    try {
      const response = await fetch("/api/contracts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contractId,
          action: "sign",
          token,
        }),
      });

      if (response.ok) {
        alert(
          "Contract succesvol ondertekend! Je ontvangt een bevestiging per e-mail."
        );
        router.push("/dashboard"); // Redirect to dashboard or success page
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Fout bij het ondertekenen van het contract");
      }
    } catch (error) {
      console.error("Failed to sign contract:", error);
      alert("Er is een fout opgetreden bij het ondertekenen");
    } finally {
      setSigning(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Waarom wijs je dit contract af? (optioneel)");

    setSigning(true);
    try {
      const response = await fetch("/api/contracts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contractId,
          action: "reject",
          reason,
          token,
        }),
      });

      if (response.ok) {
        alert("Contract afgewezen. HR is op de hoogte gesteld.");
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Fout bij het afwijzen van het contract");
      }
    } catch (error) {
      console.error("Failed to reject contract:", error);
      alert("Er is een fout opgetreden");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Er is een probleem opgetreden
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Terug naar Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900">
              Contract niet gevonden
            </h1>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <Card>
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Contract Ondertekening
            </h1>
            <p className="text-gray-600">
              Bekijk je contract en onderteken digitaal
            </p>
          </div>
        </Card>

        {/* Contract Details */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contract Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Algemene Informatie
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Titel:</strong> {contract.title}
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    {
                      CONTRACT_TYPE_LABELS[
                        contract.contractType as keyof typeof CONTRACT_TYPE_LABELS
                      ]
                    }
                  </p>
                  <p>
                    <strong>Startdatum:</strong>{" "}
                    {new Date(contract.startDate).toLocaleDateString("nl-NL")}
                  </p>
                  {contract.endDate && (
                    <p>
                      <strong>Einddatum:</strong>{" "}
                      {new Date(contract.endDate).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                  {contract.salary && (
                    <p>
                      <strong>Salaris:</strong> {contract.salary}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Medewerker</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Naam:</strong> {contract.user.firstName}{" "}
                    {contract.user.lastName}
                  </p>
                  <p>
                    <strong>E-mail:</strong> {contract.user.email}
                  </p>
                </div>
              </div>
            </div>

            {contract.description && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Functiebeschrijving
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {contract.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Legal Terms */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Juridische Bepalingen
            </h2>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">
                Belangrijke Informatie
              </h3>
              <p className="text-sm text-yellow-700">
                Door dit contract te ondertekenen, ga je akkoord met alle
                voorwaarden zoals beschreven. Zorg ervoor dat je alle informatie
                hebt gelezen en begrepen voordat je ondertekent.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-medium">Digitale Ondertekening</h4>
                <p className="text-gray-600">
                  Je digitale ondertekening heeft dezelfde juridische waarde als
                  een handgeschreven handtekening.
                </p>
              </div>

              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium">Beveiliging</h4>
                <p className="text-gray-600">
                  Dit contract is beveiligd met SHA-256 encryptie en voorzien
                  van een timestamp voor verificatie.
                </p>
              </div>

              <div className="border-l-4 border-purple-400 pl-4">
                <h4 className="font-medium">Kopieën</h4>
                <p className="text-gray-600">
                  Na ondertekening ontvang je automatisch een ondertekende kopie
                  per e-mail.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Agreement and Actions */}
        <Card>
          <div className="p-6">
            <div className="space-y-6">
              {/* Agreement Checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="agreement" className="text-sm text-gray-700">
                  Ik bevestig dat ik dit contract volledig heb gelezen en
                  begrepen, en ga akkoord met alle voorwaarden zoals beschreven.
                  Ik begrijp dat mijn digitale ondertekening juridisch bindend
                  is.
                </label>
              </div>

              {/* Security Notice */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Beveiligd met SSL encryptie en digitale verificatie</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleSign}
                  disabled={!agreed || signing}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  {signing ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Aan het ondertekenen...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Akkoord & Ondertekenen</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={signing}
                  className="flex items-center justify-center space-x-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                  <span>Afwijzen</span>
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Door te ondertekenen bevestig je dat je gemachtigd bent om dit
                contract namens jezelf aan te gaan en dat alle verstrekte
                informatie correct is.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
