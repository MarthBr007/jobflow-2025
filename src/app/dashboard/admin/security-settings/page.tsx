"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  KeyIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import PermissionGuard from "@/components/ui/PermissionGuard";

export default function SecuritySettings() {
  return (
    <PermissionGuard permission="canManageSystemSettings">
      <SecuritySettingsContent />
    </PermissionGuard>
  );
}

function SecuritySettingsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    passwordMinLength: 8,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    allowMultipleSessions: true,
    auditLogging: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/security-settings");
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
      const response = await fetch("/api/admin/security-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Beveiligingsinstellingen opgeslagen!");
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
          { label: "Systeem Beveiliging" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ShieldCheckIcon className="h-7 w-7 mr-3 text-red-600" />
            Systeem Beveiliging
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Beheer gebruikersrollen, toegangsrechten en beveiligingsinstellingen
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          onClick={() => router.push("/dashboard/admin/user-roles")}
          variant="outline"
          leftIcon={<UserGroupIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Gebruikersrollen
        </Button>
        <Button
          onClick={() => router.push("/dashboard/personnel")}
          variant="outline"
          leftIcon={<KeyIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Gebruikers Beheren
        </Button>
        <Button
          onClick={() => alert("Audit logs functionaliteit komt binnenkort")}
          variant="outline"
          leftIcon={<EyeIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Audit Logs
        </Button>
        <Button
          onClick={() => alert("Sessie management komt binnenkort")}
          variant="outline"
          leftIcon={<ComputerDesktopIcon className="h-5 w-5" />}
          className="justify-start"
        >
          Actieve Sessies
        </Button>
      </div>

      {/* Password Policy */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <LockClosedIcon className="h-5 w-5 mr-2 text-red-600" />
            Wachtwoord Beleid
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Minimale wachtwoord lengte"
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  passwordMinLength: parseInt(e.target.value),
                })
              }
              min="6"
              max="20"
            />

            <Input
              label="Maximale inlogpogingen"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxLoginAttempts: parseInt(e.target.value),
                })
              }
              min="3"
              max="10"
            />
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.requireTwoFactor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    requireTwoFactor: e.target.checked,
                  })
                }
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Verplichte twee-factor authenticatie voor alle gebruikers
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Session Management */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-orange-600" />
            Sessie Beheer
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Sessie timeout (uren)"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sessionTimeout: parseInt(e.target.value),
                })
              }
              min="1"
              max="168"
              helperText="Na hoeveel uur inactiviteit wordt een gebruiker automatisch uitgelogd"
            />
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowMultipleSessions}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowMultipleSessions: e.target.checked,
                  })
                }
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Sta meerdere gelijktijdige sessies toe per gebruiker
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Audit & Logging */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <EyeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Audit & Logging
          </h3>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.auditLogging}
                onChange={(e) =>
                  setSettings({ ...settings, auditLogging: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Activeer audit logging voor alle gebruikersacties
              </span>
            </label>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Info:</strong> Audit logs worden 90 dagen bewaard en
                  bevatten informatie over inlog-pogingen, wijzigingen aan
                  gebruikersgegevens, en andere beveiligingsrelevante acties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Status */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Beveiligingsstatus
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    SSL/TLS Actief
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Verbinding is beveiligd
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LockClosedIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Database Beveiliging
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Encryptie actief
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    2FA Status
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Optioneel voor gebruikers
                  </p>
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
          leftIcon={<ShieldCheckIcon className="h-4 w-4" />}
        >
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}
