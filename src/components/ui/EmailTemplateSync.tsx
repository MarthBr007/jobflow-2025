"use client";

import { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  Cog6ToothIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface EmailProvider {
  id: string;
  name: string;
  type: "outlook" | "gmail" | "mailchimp" | "sendgrid" | "custom";
  isConnected: boolean;
  lastSync?: string;
  templatesCount?: number;
  config?: {
    apiKey?: string;
    clientId?: string;
    domain?: string;
    username?: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  provider: string;
  lastModified: string;
  isJobFlowTemplate: boolean;
  syncStatus: "synced" | "pending" | "error" | "conflict";
  recipientCount?: number;
  openRate?: number;
  clickRate?: number;
}

interface EmailTemplateSync {
  templates: EmailTemplate[];
  providers: EmailProvider[];
  onSync: (providerId: string, templateIds: string[]) => Promise<void>;
  onConnect: (provider: EmailProvider) => Promise<void>;
  onDisconnect: (providerId: string) => Promise<void>;
  onSendTest: (templateId: string, email: string) => Promise<void>;
  onCreateCampaign: (templateId: string, recipients: string[]) => Promise<void>;
}

export default function EmailTemplateSync({
  templates: initialTemplates = [],
  providers: initialProviders = [],
  onSync,
  onConnect,
  onDisconnect,
  onSendTest,
  onCreateCampaign,
}: EmailTemplateSync) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [providers, setProviders] = useState<EmailProvider[]>(initialProviders);
  const [loading, setLoading] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);

      // Mock email providers
      const mockProviders: EmailProvider[] = [
        {
          id: "outlook",
          name: "Microsoft Outlook",
          type: "outlook",
          isConnected: true,
          lastSync: new Date(Date.now() - 3600000).toISOString(),
          templatesCount: 12,
          config: { clientId: "xxx-xxx-xxx" },
        },
        {
          id: "gmail",
          name: "Gmail",
          type: "gmail",
          isConnected: false,
        },
        {
          id: "mailchimp",
          name: "Mailchimp",
          type: "mailchimp",
          isConnected: true,
          lastSync: new Date(Date.now() - 1800000).toISOString(),
          templatesCount: 8,
          config: { apiKey: "xxx-xxx-xxx" },
        },
        {
          id: "sendgrid",
          name: "SendGrid",
          type: "sendgrid",
          isConnected: false,
        },
      ];

      // Mock email templates
      const mockTemplates: EmailTemplate[] = [
        {
          id: "tpl_1",
          name: "Freelancer Contract Email",
          subject: "Uw freelance contract - {{company_name}}",
          content: `Beste {{employee_name}},

In de bijlage vindt u uw freelance contract voor de positie als {{job_title}} bij {{company_name}}.

**Contract Details:**
- Startdatum: {{start_date}}
- Uurtarief: €{{hourly_rate}}
- Project: {{project_name}}

Gelieve het contract te tekenen en terug te sturen voor {{start_date}}.

Met vriendelijke groet,
{{company_name}}`,
          provider: "outlook",
          lastModified: new Date().toISOString(),
          isJobFlowTemplate: true,
          syncStatus: "synced",
          recipientCount: 45,
          openRate: 92.3,
          clickRate: 78.9,
        },
        {
          id: "tpl_2",
          name: "Rooster Wijziging Notificatie",
          subject: "Rooster update voor {{schedule_date}}",
          content: `Hallo {{employee_name}},

Er is een wijziging in uw rooster voor {{schedule_date}}.

**Nieuwe roostertijden:**
- Start: {{shift_start}}
- Eind: {{shift_end}}
- Locatie: {{work_location}}
- Project: {{project_name}}

Neem contact op als u vragen heeft.

Groeten,
{{company_name}}`,
          provider: "mailchimp",
          lastModified: new Date(Date.now() - 86400000).toISOString(),
          isJobFlowTemplate: true,
          syncStatus: "pending",
          recipientCount: 23,
          openRate: 88.7,
          clickRate: 65.2,
        },
        {
          id: "tpl_3",
          name: "Externe Newsletter Template",
          subject: "Weekly Company Update",
          content: "External template not synced with JobFlow",
          provider: "outlook",
          lastModified: new Date(Date.now() - 172800000).toISOString(),
          isJobFlowTemplate: false,
          syncStatus: "conflict",
        },
      ];

      setProviders(mockProviders);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error("Error loading email data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (providerId?: string) => {
    const targetProvider = providerId || selectedProvider;
    if (!targetProvider) return;

    try {
      setLoading(true);
      setSyncStatus({ [targetProvider]: "syncing" });

      await onSync(targetProvider, selectedTemplates);

      // Update sync status
      setProviders((prev) =>
        prev.map((p) =>
          p.id === targetProvider
            ? { ...p, lastSync: new Date().toISOString() }
            : p
        )
      );

      setSyncStatus({ [targetProvider]: "success" });
      setSelectedTemplates([]);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus({ [targetProvider]: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: EmailProvider) => {
    try {
      await onConnect(provider);
      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id ? { ...p, isConnected: true } : p
        )
      );
      setShowConnectModal(null);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleSendTest = async (template: EmailTemplate) => {
    if (!testEmail) return;

    try {
      await onSendTest(template.id, testEmail);
      alert(`Test email verzonden naar ${testEmail}`);
      setTestEmail("");
    } catch (error) {
      console.error("Send test error:", error);
      alert("Fout bij verzenden test email");
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "outlook":
        return "📧";
      case "gmail":
        return "📧";
      case "mailchimp":
        return "📧";
      case "sendgrid":
        return "📧";
      default:
        return "📧";
    }
  };

  const getSyncStatusColor = (status: EmailTemplate["syncStatus"]) => {
    switch (status) {
      case "synced":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "conflict":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <EnvelopeIcon className="h-5 w-5" />
            <span>📧 Email Template Sync</span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Synchroniseer templates met email providers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
          >
            <option value="">Selecteer provider</option>
            {providers
              .filter((p) => p.isConnected)
              .map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {getProviderIcon(provider.type)} {provider.name}
                </option>
              ))}
          </select>

          <button
            onClick={() => handleSync()}
            disabled={
              !selectedProvider || selectedTemplates.length === 0 || loading
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Syncing..." : "Sync Selected"}
          </button>
        </div>
      </div>

      {/* Provider Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${
              provider.isConnected
                ? "border-green-200 dark:border-green-700"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {getProviderIcon(provider.type)}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {provider.name}
                </span>
              </div>

              {provider.isConnected ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                Status: {provider.isConnected ? "Verbonden" : "Niet verbonden"}
              </div>
              {provider.lastSync && (
                <div>
                  Laatste sync:{" "}
                  {new Date(provider.lastSync).toLocaleString("nl-NL")}
                </div>
              )}
              {provider.templatesCount && (
                <div>{provider.templatesCount} templates</div>
              )}
            </div>

            <div className="mt-3">
              {provider.isConnected ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSync(provider.id)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Sync Nu
                  </button>
                  <button
                    onClick={() => onDisconnect(provider.id)}
                    className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Verbreken
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConnectModal(provider.id)}
                  className="w-full px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Verbinden
                </button>
              )}
            </div>

            {/* Sync Status Indicator */}
            {syncStatus[provider.id] && (
              <div className="mt-2 text-xs">
                {syncStatus[provider.id] === "syncing" && (
                  <span className="text-blue-600 dark:text-blue-400">
                    🔄 Synchroniseren...
                  </span>
                )}
                {syncStatus[provider.id] === "success" && (
                  <span className="text-green-600 dark:text-green-400">
                    Sync succesvol
                  </span>
                )}
                {syncStatus[provider.id] === "error" && (
                  <span className="text-red-600 dark:text-red-400">
                    Sync mislukt
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Template List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Email Templates ({templates.length})
            </h4>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTemplates.length === templates.length}
                  onChange={(e) =>
                    setSelectedTemplates(
                      e.target.checked ? templates.map((t) => t.id) : []
                    )
                  }
                  className="rounded"
                />
                <span>Selecteer alles</span>
              </label>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedTemplates.includes(template.id)}
                  onChange={(e) =>
                    setSelectedTemplates((prev) =>
                      e.target.checked
                        ? [...prev, template.id]
                        : prev.filter((id) => id !== template.id)
                    )
                  }
                  className="mt-1 rounded"
                />

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h5>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSyncStatusColor(
                        template.syncStatus
                      )}`}
                    >
                      {template.syncStatus}
                    </span>

                    {template.isJobFlowTemplate && (
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                        JobFlow
                      </span>
                    )}

                    <span className="text-xs text-gray-500">
                      {getProviderIcon(
                        providers.find((p) => p.id === template.provider)
                          ?.type || "custom"
                      )}{" "}
                      {providers.find((p) => p.id === template.provider)?.name}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Onderwerp:</strong> {template.subject}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Gewijzigd:{" "}
                      {new Date(template.lastModified).toLocaleDateString(
                        "nl-NL"
                      )}
                    </span>
                    {template.recipientCount && (
                      <span>{template.recipientCount} ontvangers</span>
                    )}
                    {template.openRate && (
                      <span>{template.openRate}% geopend</span>
                    )}
                    {template.clickRate && (
                      <span>{template.clickRate}% geklikt</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPreview(template)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Voorbeeld bekijken"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>

                  <div className="relative group">
                    <button
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                      title="Test email versturen"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>

                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Test email adres"
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded mb-2"
                      />
                      <button
                        onClick={() => handleSendTest(template)}
                        disabled={!testEmail}
                        className="w-full px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Verstuur Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-2/3 max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Email Template Preview
                </h3>
                <button
                  onClick={() => setShowPreview(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Onderwerp:
                </h4>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {showPreview.subject}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Inhoud:
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded whitespace-pre-wrap text-sm">
                  {showPreview.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Provider Verbinden
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configureer de verbinding met{" "}
              {providers.find((p) => p.id === showConnectModal)?.name}
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="API Key / Client ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
              <input
                type="text"
                placeholder="Domain (optioneel)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConnectModal(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  const provider = providers.find(
                    (p) => p.id === showConnectModal
                  );
                  if (provider) handleConnect(provider);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Verbinden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
