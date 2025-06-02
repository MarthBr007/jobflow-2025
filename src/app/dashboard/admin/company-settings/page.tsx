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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/company-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Bedrijfsinstellingen opgeslagen!");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Fout bij opslaan van instellingen");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Systeeminstellingen",
            href: "/dashboard/admin/system-settings",
          },
          { label: "Bedrijfsinstellingen" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BuildingOfficeIcon className="h-7 w-7 mr-3 text-indigo-600" />
            Bedrijfsinstellingen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Algemene bedrijfinformatie en configuratie
          </p>
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Bedrijfsinformatie
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Bedrijfsnaam"
              value={settings.companyName}
              onChange={(e) =>
                setSettings({ ...settings, companyName: e.target.value })
              }
              leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
              placeholder="Uw bedrijfsnaam"
              required
            />

            <Input
              label="Website"
              value={settings.website}
              onChange={(e) =>
                setSettings({ ...settings, website: e.target.value })
              }
              leftIcon={<GlobeAltIcon className="h-5 w-5" />}
              placeholder="https://www.uwbedrijf.nl"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bedrijfsomschrijving
            </label>
            <textarea
              value={settings.companyDescription}
              onChange={(e) =>
                setSettings({ ...settings, companyDescription: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Korte omschrijving van uw bedrijf..."
            />
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
            Contactgegevens
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Contact e-mail"
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
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
              leftIcon={<PhoneIcon className="h-5 w-5" />}
              placeholder="+31 20 123 4567"
            />
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
            Adresgegevens
          </h3>

          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Straat en huisnummer"
              value={settings.address.street}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  address: { ...settings.address, street: e.target.value },
                })
              }
              leftIcon={<MapPinIcon className="h-5 w-5" />}
              placeholder="Hoofdstraat 123"
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
            Bedrijfsgegevens
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
              leftIcon={<DocumentTextIcon className="h-5 w-5" />}
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
              leftIcon={<DocumentTextIcon className="h-5 w-5" />}
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
              leftIcon={<CurrencyEuroIcon className="h-5 w-5" />}
              placeholder="NL91ABNA0417164300"
            />
          </div>
        </div>
      </Card>

      {/* Branding */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <PhotoIcon className="h-5 w-5 mr-2 text-pink-600" />
            Huisstijl & Branding
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
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

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              leftIcon={<PhotoIcon className="h-5 w-5" />}
              placeholder="https://example.com/logo.png"
              helperText="URL naar uw bedrijfslogo (optioneel)"
            />
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Kleur voorbeeld:
            </h4>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: settings.branding.primaryColor }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Primaire kleur
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: settings.branding.secondaryColor }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Secundaire kleur
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Notifications */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-yellow-600" />
            E-mail Instellingen
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              leftIcon={<ServerIcon className="h-5 w-5" />}
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
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              placeholder="noreply@uwbedrijf.nl"
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
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              placeholder="support@uwbedrijf.nl"
              helperText="E-mail voor antwoorden van gebruikers"
            />
          </div>
        </div>
      </Card>

      {/* Company Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Bedrijf Overzicht
          </h3>

          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                  {settings.companyName}
                </h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                  {settings.companyDescription}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {settings.address.street}, {settings.address.postalCode}{" "}
                    {settings.address.city}
                  </div>
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {settings.contactEmail}
                  </div>
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {settings.contactPhone}
                  </div>
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    KvK: {settings.businessInfo.kvkNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={() => router.push("/dashboard/admin/system-settings")}
          variant="outline"
        >
          Terug
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          leftIcon={<BuildingOfficeIcon className="h-4 w-4" />}
        >
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}
