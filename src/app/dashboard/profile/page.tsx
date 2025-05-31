"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  HomeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyEuroIcon,
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import ContractViewer from "@/components/ui/ContractViewer";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType?: string;
  status: string;
  company: string;
  phone?: string;
  address?: string;
  hourlyRate?: string;
  monthlySalary?: string;
  hourlyWage?: string;
  hasContract?: boolean;
  contractStatus?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContracts, setShowContracts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // Only allow EMPLOYEE and FREELANCER roles
    if (session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") {
      router.push("/dashboard");
      return;
    }

    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError("Kon profiel niet laden");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeTypeText = (type?: string) => {
    switch (type) {
      case "PERMANENT":
        return "Vaste medewerker";
      case "FREELANCER":
        return "Freelancer";
      case "FLEX_WORKER":
        return "Flexwerker";
      default:
        return "Onbekend";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "EMPLOYEE":
        return "Medewerker";
      case "FREELANCER":
        return "Freelancer";
      default:
        return role;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Profiel laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <Button onClick={fetchProfile}>Opnieuw proberen</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Profiel niet gevonden</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Mijn Profiel" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Mijn Profiel
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bekijk je persoonlijke informatie en contracten
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Persoonlijke Informatie
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Naam
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.name}
                    </dd>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Email
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.email}
                    </dd>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Bedrijf
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.company}
                    </dd>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        Telefoon
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.phone}
                      </dd>
                    </div>
                  </div>
                )}
              </div>

              {/* Employment Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Functie
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {getRoleText(profile.role)}
                    </dd>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">
                      Type
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {getEmployeeTypeText(profile.employeeType)}
                    </dd>
                  </div>
                </div>

                {profile.address && (
                  <div className="flex items-center space-x-3">
                    <HomeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        Adres
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.address}
                      </dd>
                    </div>
                  </div>
                )}

                {(profile.monthlySalary ||
                  profile.hourlyWage ||
                  profile.hourlyRate) && (
                  <div className="flex items-center space-x-3">
                    <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        {profile.monthlySalary ? "Maandsalaris" : "Uurtarief"}
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.monthlySalary ||
                          profile.hourlyWage ||
                          profile.hourlyRate}
                      </dd>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contract Status */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Contract Status
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {profile.hasContract ? (
                  <>
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Actief Contract
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Je hebt een geldig contract
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Geen Contract
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Er is nog geen actief contract gevonden
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                leftIcon={<EyeIcon className="h-4 w-4" />}
                onClick={() => setShowContracts(true)}
              >
                Contracten Bekijken
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Snelle Acties
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                onClick={() => setShowContracts(true)}
                className="justify-start"
              >
                Mijn Contracten
              </Button>
              <Button
                variant="outline"
                leftIcon={<CalendarDaysIcon className="h-4 w-4" />}
                onClick={() => router.push("/dashboard/schedule")}
                className="justify-start"
              >
                Mijn Rooster
              </Button>
              <Button
                variant="outline"
                leftIcon={<ClockIcon className="h-4 w-4" />}
                onClick={() => router.push("/dashboard")}
                className="justify-start"
              >
                Tijd Registratie
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Viewer Modal */}
      {profile && (
        <ContractViewer
          isOpen={showContracts}
          onClose={() => setShowContracts(false)}
          userId={profile.id}
          userName={profile.name}
          viewMode="employee"
        />
      )}
    </>
  );
}
