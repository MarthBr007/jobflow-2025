"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  PhotoIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

export default function CompanySettings() {
  return (
    <PermissionGuard permission="canManageSystemSettings">
      <CompanySettingsContent />
    </PermissionGuard>
  );
}

function CompanySettingsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [settings, setSettings] = useState({
    companyName: "JobFlow Solutions",
    companyDescription: "Complete werknemers en project management oplossing",
    contactEmail: "info@jobflow.nl",
    contactPhone: "+31 20 123 4567",
    website: "https://www.jobflow.nl",
    address: {
      street: "Hoofdstraat 123",
      postalCode: "1234AB",
      city: "Amsterdam",
      country: "Nederland",
    },
    businessInfo: {
      kvkNumber: "12345678",
      btwNumber: "NL123456789B01",
      iban: "NL91ABNA0417164300",
    },
    branding: {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      logo: "",
    },
    notifications: {
      systemName: "JobFlow",
      fromEmail: "noreply@jobflow.nl",
      replyToEmail: "support@jobflow.nl",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/company-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      showToast("Fout bij ophalen van instellingen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/company-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showToast("Bedrijfsinstellingen succesvol opgeslagen!", "success");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Fout bij opslaan van instellingen", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-32 h-32 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Bedrijfsinstellingen" },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-gray-900 dark:text-white">
              <BuildingOfficeIcon className="w-8 h-8 mr-3 text-indigo-600" />
              Bedrijfsinstellingen
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Beheer algemene bedrijfinformatie en configuratie
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => router.back()}>
              Terug
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Instellingen Opslaan
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Company Information */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <BuildingOfficeIcon className="w-6 h-6 mr-3 text-indigo-600" />
              Bedrijfsinformatie
            </h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Bedrijfsnaam"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                leftIcon={<BuildingOfficeIcon className="w-5 h-5" />}
                placeholder="Uw bedrijfsnaam"
                required
              />

              <Input
                label="Website"
                value={settings.website}
                onChange={(e) =>
                  setSettings({ ...settings, website: e.target.value })
                }
                leftIcon={<GlobeAltIcon className="w-5 h-5" />}
                placeholder="https://www.uwbedrijf.nl"
              />
            </div>

            <div className="mt-6">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Bedrijfsomschrijving
              </label>
              <textarea
                value={settings.companyDescription}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    companyDescription: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                placeholder="Korte omschrijving van uw bedrijf..."
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <PhoneIcon className="w-6 h-6 mr-3 text-green-600" />
              Contactgegevens
            </h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Contact e-mail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                placeholder="info@uwbedrijf.nl"
                required
              />

              <Input
                label="Telefoonnummer"
                type="tel"
                value={settings.contactPhone}
                onChange={(e) =>
                  setSettings({ ...settings, contactPhone: e.target.value })
                }
                leftIcon={<PhoneIcon className="w-5 h-5" />}
                placeholder="+31 20 123 4567"
              />
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <MapPinIcon className="w-6 h-6 mr-3 text-blue-600" />
              Adresgegevens
            </h3>

            <div className="space-y-6">
              <Input
                label="Straat en huisnummer"
                value={settings.address.street}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    address: { ...settings.address, street: e.target.value },
                  })
                }
                leftIcon={<MapPinIcon className="w-5 h-5" />}
                placeholder="Hoofdstraat 123"
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Input
                  label="Postcode"
                  value={settings.address.postalCode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      address: {
                        ...settings.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  placeholder="1234AB"
                />

                <Input
                  label="Plaats"
                  value={settings.address.city}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, city: e.target.value },
                    })
                  }
                  placeholder="Amsterdam"
                />

                <Input
                  label="Land"
                  value={settings.address.country}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, country: e.target.value },
                    })
                  }
                  placeholder="Nederland"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Business Information */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <DocumentTextIcon className="w-6 h-6 mr-3 text-purple-600" />
              Bedrijfsgegevens
            </h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Input
                label="KvK Nummer"
                value={settings.businessInfo.kvkNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessInfo: {
                      ...settings.businessInfo,
                      kvkNumber: e.target.value,
                    },
                  })
                }
                leftIcon={<DocumentTextIcon className="w-5 h-5" />}
                placeholder="12345678"
              />

              <Input
                label="BTW Nummer"
                value={settings.businessInfo.btwNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessInfo: {
                      ...settings.businessInfo,
                      btwNumber: e.target.value,
                    },
                  })
                }
                leftIcon={<DocumentTextIcon className="w-5 h-5" />}
                placeholder="NL123456789B01"
              />

              <Input
                label="IBAN"
                value={settings.businessInfo.iban}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessInfo: {
                      ...settings.businessInfo,
                      iban: e.target.value,
                    },
                  })
                }
                leftIcon={<CurrencyEuroIcon className="w-5 h-5" />}
                placeholder="NL91ABNA0417164300"
              />
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <PhotoIcon className="w-6 h-6 mr-3 text-pink-600" />
              Huisstijl & Branding
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primaire kleur
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.branding.primaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: {
                            ...settings.branding,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-600"
                    />
                    <Input
                      value={settings.branding.primaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: {
                            ...settings.branding,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Secundaire kleur
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.branding.secondaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: {
                            ...settings.branding,
                            secondaryColor: e.target.value,
                          },
                        })
                      }
                      className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-600"
                    />
                    <Input
                      value={settings.branding.secondaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: {
                            ...settings.branding,
                            secondaryColor: e.target.value,
                          },
                        })
                      }
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Logo URL
                </label>
                <Input
                  value={settings.branding.logo}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, logo: e.target.value },
                    })
                  }
                  leftIcon={<PhotoIcon className="w-5 h-5" />}
                  placeholder="https://example.com/logo.png"
                  helperText="URL naar uw bedrijfslogo (optioneel)"
                />
              </div>

              {/* Color Preview */}
              <div className="p-4 mt-6 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  Kleur voorbeeld:
                </h4>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600"
                      style={{
                        backgroundColor: settings.branding.primaryColor,
                      }}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Primair
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600"
                      style={{
                        backgroundColor: settings.branding.secondaryColor,
                      }}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Secundair
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* E-mail Instellingen */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <EnvelopeIcon className="w-6 h-6 mr-3 text-orange-600" />
              E-mail Instellingen
            </h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Input
                label="Systeem naam"
                value={settings.notifications.systemName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      systemName: e.target.value,
                    },
                  })
                }
                leftIcon={<ServerIcon className="w-5 h-5" />}
                placeholder="JobFlow"
                helperText="Naam die wordt gebruikt in e-mails"
              />

              <Input
                label="Verzender e-mail"
                type="email"
                value={settings.notifications.fromEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      fromEmail: e.target.value,
                    },
                  })
                }
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                placeholder="noreply@jobflow.nl"
                helperText="E-mail adres voor uitgaande berichten"
              />

              <Input
                label="Antwoord e-mail"
                type="email"
                value={settings.notifications.replyToEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      replyToEmail: e.target.value,
                    },
                  })
                }
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                placeholder="support@jobflow.nl"
                helperText="E-mail voor antwoorden van gebruikers"
              />
            </div>
          </div>
        </Card>

        {/* Company Overview - Preview */}
        <Card>
          <div className="p-6">
            <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              <BuildingOfficeIcon className="w-6 h-6 mr-3 text-indigo-600" />
              Bedrijf Overzicht
            </h3>

            <div className="p-6 border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl dark:border-indigo-800">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-100 rounded-lg dark:bg-indigo-800">
                  <BuildingOfficeIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {settings.companyName}
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {settings.companyDescription}
                  </p>

                  <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {settings.address.street}, {settings.address.postalCode}{" "}
                        {settings.address.city}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {settings.contactEmail}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {settings.contactPhone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        KvK: {settings.businessInfo.kvkNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Save Button at Bottom */}
      <div className="flex justify-end mt-8 space-x-3">
        <Button variant="outline" onClick={() => router.back()}>
          Terug
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}
