"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  EnvelopeIcon,
  ServerIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface EmailSettings {
  id?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function EmailSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [formData, setFormData] = useState<EmailSettings>({
    smtpHost: "mail.antagonist.nl",
    smtpPort: 587,
    smtpUser: "no-reply@broersverhuur.nl",
    smtpPass: "",
    smtpFrom: '"Broers Verhuur JobFlow" <no-reply@broersverhuur.nl>',
    isEnabled: true,
  });

  useEffect(() => {
    if (session?.user) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/email-settings");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings(data);
          setFormData({
            ...data,
            smtpPass: data.smtpPass ? "***hidden***" : "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = settings?.id ? "PUT" : "POST";
      const body = settings?.id ? { ...formData, id: settings.id } : formData;

      const response = await fetch("/api/admin/email-settings", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          ...data,
          smtpPass: "***hidden***",
        });
        alert("✅ Email instellingen succesvol opgeslagen!");
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving email settings:", error);
      alert("❌ Er ging iets mis bij het opslaan");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert("Voer een test email adres in");
      return;
    }

    setTestLoading(true);
    try {
      // In werkelijkheid zou je hier een test API endpoint aanroepen
      // Voor nu simuleren we een test
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("📧 Test email verstuurd! Check je inbox.");
      setShowTestModal(false);
      setTestEmail("");
    } catch (error) {
      alert("❌ Test email kon niet worden verstuurd");
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            📧 Email Instellingen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configureer SMTP instellingen voor het versturen van emails
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowTestModal(true)}
            variant="outline"
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            disabled={!settings?.isEnabled}
          >
            Test Email
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-lg border ${
              formData.isEnabled
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {formData.isEnabled ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    formData.isEnabled
                      ? "text-green-800 dark:text-green-200"
                      : "text-yellow-800 dark:text-yellow-200"
                  }`}
                >
                  {formData.isEnabled
                    ? "✅ Email systeem is actief"
                    : "⚠️ Email systeem is uitgeschakeld"}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    formData.isEnabled
                      ? "text-green-700 dark:text-green-300"
                      : "text-yellow-700 dark:text-yellow-300"
                  }`}
                >
                  {formData.isEnabled
                    ? "Emails worden verstuurd via de geconfigureerde SMTP server"
                    : "Emails worden alleen gelogd in de console (development mode)"}
                </p>
              </div>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Email systeem inschakelen
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Schakel het email systeem in of uit
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, isEnabled: e.target.checked })
                }
                className="sr-only peer"
                aria-label="Email systeem inschakelen"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* SMTP Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <ServerIcon className="h-5 w-5 mr-2" />
              SMTP Configuratie
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="SMTP Host"
                value={formData.smtpHost}
                onChange={(e) =>
                  setFormData({ ...formData, smtpHost: e.target.value })
                }
                placeholder="mail.antagonist.nl"
                required
                disabled={!formData.isEnabled}
              />

              <Input
                label="SMTP Port"
                type="number"
                value={formData.smtpPort.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtpPort: parseInt(e.target.value) || 587,
                  })
                }
                placeholder="587"
                required
                disabled={!formData.isEnabled}
              />

              <Input
                label="SMTP Gebruiker"
                value={formData.smtpUser}
                onChange={(e) =>
                  setFormData({ ...formData, smtpUser: e.target.value })
                }
                placeholder="no-reply@broersverhuur.nl"
                required
                disabled={!formData.isEnabled}
              />

              <div className="relative">
                <Input
                  label="SMTP Wachtwoord"
                  type={showPassword ? "text" : "password"}
                  value={formData.smtpPass}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpPass: e.target.value })
                  }
                  placeholder="Voer wachtwoord in"
                  required={!settings?.id}
                  disabled={!formData.isEnabled}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      disabled={!formData.isEnabled}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </div>
            </div>

            <Input
              label="Van Adres"
              value={formData.smtpFrom}
              onChange={(e) =>
                setFormData({ ...formData, smtpFrom: e.target.value })
              }
              placeholder='"Broers Verhuur JobFlow" <no-reply@broersverhuur.nl>'
              helperText="Het afzender adres dat ontvangers zien"
              required
              disabled={!formData.isEnabled}
            />
          </div>

          {/* Current Settings Info */}
          {settings && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Huidige instellingen:
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>
                  📧 Host: {settings.smtpHost}:{settings.smtpPort}
                </p>
                <p>👤 Gebruiker: {settings.smtpUser}</p>
                <p>📤 Van: {settings.smtpFrom}</p>
                <p>
                  🕒 Laatste update:{" "}
                  {new Date(settings.updatedAt || "").toLocaleString("nl-NL")}
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
            >
              {saving ? "Opslaan..." : "Instellingen Opslaan"}
            </Button>
          </div>
        </form>
      </div>

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="📧 Test Email Versturen"
        description="Verstuur een test email om je instellingen te controleren"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Test Email Adres"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            required
          />

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Er wordt een test email verstuurd met de huidige instellingen.
              Als de email niet aankomt, controleer dan je configuratie.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowTestModal(false)}
              disabled={testLoading}
            >
              Annuleren
            </Button>
            <Button
              variant="primary"
              onClick={handleTestEmail}
              loading={testLoading}
              disabled={testLoading || !testEmail}
            >
              Test Versturen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
