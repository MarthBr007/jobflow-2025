"use client";

import { useState, useEffect } from "react";
import {
  PencilSquareIcon,
  DocumentCheckIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  EyeIcon,
  LinkIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface DocuSignAccount {
  id: string;
  accountName: string;
  isConnected: boolean;
  apiKey?: string;
  userId?: string;
  baseUrl?: string;
  lastSync?: string;
  templatesCount?: number;
}

interface SignatureRequest {
  id: string;
  templateId: string;
  templateName: string;
  status: "draft" | "sent" | "completed" | "declined" | "voided" | "expired";
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  expiresAt?: string;
  signingUrl?: string;
  documentUrl?: string;
  reminders: number;
  customMessage?: string;
}

interface DocuSignTemplate {
  id: string;
  name: string;
  description: string;
  isJobFlowTemplate: boolean;
  lastUsed?: string;
  totalSignatures: number;
  completionRate: number;
  averageSignTime?: number; // in hours
  requiresFieldMapping: boolean;
  fieldMappings: Record<string, string>;
}

interface DocuSignIntegrationProps {
  onConnect?: (account: DocuSignAccount) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  onSendForSignature?: (
    templateId: string,
    recipient: { name: string; email: string },
    message?: string
  ) => Promise<string>;
  onCreateTemplate?: (name: string, content: string) => Promise<string>;
  onGetSigningUrl?: (requestId: string) => Promise<string>;
  onDownloadDocument?: (requestId: string) => Promise<string>;
}

export default function DocuSignIntegration({
  onConnect,
  onDisconnect,
  onSendForSignature,
  onCreateTemplate,
  onGetSigningUrl,
  onDownloadDocument,
}: DocuSignIntegrationProps) {
  const [account, setAccount] = useState<DocuSignAccount | null>(null);
  const [templates, setTemplates] = useState<DocuSignTemplate[]>([]);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "templates" | "requests"
  >("overview");
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState<string | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    apiKey: "",
    userId: "",
    baseUrl: "https://demo.docusign.net",
    accountName: "",
  });
  const [sendForm, setSendForm] = useState({
    recipientName: "",
    recipientEmail: "",
    customMessage: "",
    expirationDays: 30,
  });

  useEffect(() => {
    loadDocuSignData();
  }, []);

  const loadDocuSignData = async () => {
    try {
      setLoading(true);

      // Mock DocuSign account
      const mockAccount: DocuSignAccount = {
        id: "docusign_1",
        accountName: "JobFlow DocuSign Account",
        isConnected: true,
        apiKey: "xxx-xxx-xxx",
        userId: "user-123",
        baseUrl: "https://demo.docusign.net",
        lastSync: new Date(Date.now() - 1800000).toISOString(),
        templatesCount: 5,
      };

      // Mock DocuSign templates
      const mockTemplates: DocuSignTemplate[] = [
        {
          id: "tpl_ds_1",
          name: "Freelancer Contract Template",
          description:
            "Standaard freelance contract met elektronische handtekening",
          isJobFlowTemplate: true,
          lastUsed: new Date(Date.now() - 86400000).toISOString(),
          totalSignatures: 127,
          completionRate: 94.5,
          averageSignTime: 3.2,
          requiresFieldMapping: true,
          fieldMappings: {
            employee_name: "Full Name",
            employee_email: "Email",
            start_date: "Start Date",
            hourly_rate: "Hourly Rate",
            job_title: "Position",
          },
        },
        {
          id: "tpl_ds_2",
          name: "NDA Template",
          description: "Non-disclosure agreement voor freelancers",
          isJobFlowTemplate: true,
          lastUsed: new Date(Date.now() - 172800000).toISOString(),
          totalSignatures: 89,
          completionRate: 98.9,
          averageSignTime: 1.8,
          requiresFieldMapping: false,
          fieldMappings: {},
        },
        {
          id: "tpl_ds_3",
          name: "Wijziging Contract",
          description: "Template voor contractwijzigingen",
          isJobFlowTemplate: true,
          lastUsed: new Date(Date.now() - 259200000).toISOString(),
          totalSignatures: 34,
          completionRate: 91.2,
          averageSignTime: 2.1,
          requiresFieldMapping: true,
          fieldMappings: {
            employee_name: "Employee Name",
            change_date: "Effective Date",
            new_rate: "New Rate",
          },
        },
      ];

      // Mock signature requests
      const mockRequests: SignatureRequest[] = [
        {
          id: "req_1",
          templateId: "tpl_ds_1",
          templateName: "Freelancer Contract Template",
          status: "completed",
          recipientEmail: "jan.de.vries@email.com",
          recipientName: "Jan de Vries",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          sentAt: new Date(Date.now() - 172800000 + 300000).toISOString(),
          completedAt: new Date(Date.now() - 86400000).toISOString(),
          reminders: 1,
          customMessage:
            "Gelieve uw freelance contract te tekenen voor aanvang van het project.",
        },
        {
          id: "req_2",
          templateId: "tpl_ds_1",
          templateName: "Freelancer Contract Template",
          status: "sent",
          recipientEmail: "marie.janssen@email.com",
          recipientName: "Marie Janssen",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          sentAt: new Date(Date.now() - 86400000 + 600000).toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 29).toISOString(),
          reminders: 0,
          customMessage: "Uw contract staat klaar voor ondertekening.",
          signingUrl: "https://demo.docusign.net/signing/xxx",
        },
        {
          id: "req_3",
          templateId: "tpl_ds_2",
          templateName: "NDA Template",
          status: "declined",
          recipientEmail: "peter.van.dijk@email.com",
          recipientName: "Peter van Dijk",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          sentAt: new Date(Date.now() - 259200000 + 900000).toISOString(),
          reminders: 2,
        },
      ];

      setAccount(mockAccount);
      setTemplates(mockTemplates);
      setRequests(mockRequests);
    } catch (error) {
      console.error("Error loading DocuSign data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const accountData: DocuSignAccount = {
        id: `docusign_${Date.now()}`,
        accountName: connectionForm.accountName,
        isConnected: false,
        apiKey: connectionForm.apiKey,
        userId: connectionForm.userId,
        baseUrl: connectionForm.baseUrl,
      };

      await onConnect?.(accountData);
      setAccount({ ...accountData, isConnected: true });
      setShowConnectionModal(false);
      setConnectionForm({
        apiKey: "",
        userId: "",
        baseUrl: "https://demo.docusign.net",
        accountName: "",
      });
    } catch (error) {
      console.error("Connection error:", error);
      alert("Fout bij verbinding maken met DocuSign");
    }
  };

  const handleSendForSignature = async (templateId: string) => {
    if (!sendForm.recipientName || !sendForm.recipientEmail) return;

    try {
      const requestId = await onSendForSignature?.(
        templateId,
        {
          name: sendForm.recipientName,
          email: sendForm.recipientEmail,
        },
        sendForm.customMessage
      );

      // Add to requests
      const newRequest: SignatureRequest = {
        id: requestId || `req_${Date.now()}`,
        templateId,
        templateName:
          templates.find((t) => t.id === templateId)?.name ||
          "Unknown Template",
        status: "sent",
        recipientEmail: sendForm.recipientEmail,
        recipientName: sendForm.recipientName,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + sendForm.expirationDays * 24 * 60 * 60 * 1000
        ).toISOString(),
        reminders: 0,
        customMessage: sendForm.customMessage,
      };

      setRequests((prev) => [newRequest, ...prev]);
      setShowSendModal(null);
      setSendForm({
        recipientName: "",
        recipientEmail: "",
        customMessage: "",
        expirationDays: 30,
      });
    } catch (error) {
      console.error("Send signature error:", error);
      alert("Fout bij versturen handtekening verzoek");
    }
  };

  const getStatusIcon = (status: SignatureRequest["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "sent":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "declined":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "expired":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case "voided":
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DocumentCheckIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SignatureRequest["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "expired":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "voided":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (!account?.isConnected) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          DocuSign Integratie
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Verbind met DocuSign om elektronische handtekeningen te gebruiken voor
          contracten en documenten.
        </p>
        <button
          onClick={() => setShowConnectionModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Verbinden met DocuSign
        </button>

        {/* Connection Modal */}
        {showConnectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                DocuSign Configureren
              </h3>

              <div className="space-y-4">
                <input
                  type="text"
                  value={connectionForm.accountName}
                  onChange={(e) =>
                    setConnectionForm({
                      ...connectionForm,
                      accountName: e.target.value,
                    })
                  }
                  placeholder="Account naam"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                <input
                  type="text"
                  value={connectionForm.apiKey}
                  onChange={(e) =>
                    setConnectionForm({
                      ...connectionForm,
                      apiKey: e.target.value,
                    })
                  }
                  placeholder="API Key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                <input
                  type="text"
                  value={connectionForm.userId}
                  onChange={(e) =>
                    setConnectionForm({
                      ...connectionForm,
                      userId: e.target.value,
                    })
                  }
                  placeholder="User ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                <input
                  type="text"
                  value={connectionForm.baseUrl}
                  onChange={(e) =>
                    setConnectionForm({
                      ...connectionForm,
                      baseUrl: e.target.value,
                    })
                  }
                  placeholder="Base URL"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!connectionForm.apiKey || !connectionForm.userId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

  return (
    <div className="space-y-6">
      {/* Header & Account Status */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                DocuSign Integratie
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verbonden met {account.accountName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              <div className="text-gray-900 dark:text-white font-medium">
                {templates.length} Templates
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {requests.filter((r) => r.status === "completed").length}{" "}
                Voltooid
              </div>
            </div>

            <button
              onClick={() => onDisconnect?.()}
              className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Verbreken
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 py-4">
            {[
              { id: "overview", label: "Overzicht", count: requests.length },
              {
                id: "templates",
                label: "Templates",
                count: templates.length,
              },
              {
                id: "requests",
                label: "Handtekeningen",
                count: requests.filter((r) => r.status === "sent").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {requests.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Totaal Verzoeken
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {requests.filter((r) => r.status === "completed").length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Voltooid
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {requests.filter((r) => r.status === "sent").length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    In Behandeling
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(
                      (requests.filter((r) => r.status === "completed").length /
                        requests.length) *
                        100
                    ) || 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completion Rate
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Recente Activiteit
                </h4>
                <div className="space-y-3">
                  {requests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {getStatusIcon(request.status)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.recipientName} - {request.templateName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(
                            new Date(request.createdAt),
                            "dd MMM yyyy 'om' HH:mm",
                            { locale: nl }
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  DocuSign Templates
                </h4>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Nieuwe Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h5>
                      <button
                        onClick={() => setShowSendModal(template.id)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>

                    <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Gebruikt:</span>
                        <span>{template.totalSignatures}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completion:</span>
                        <span>{template.completionRate}%</span>
                      </div>
                      {template.averageSignTime && (
                        <div className="flex justify-between">
                          <span>Gem. tijd:</span>
                          <span>{template.averageSignTime}u</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Handtekening Verzoeken
              </h4>

              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {request.recipientName}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.recipientEmail}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Template: {request.templateName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>

                        {request.status === "sent" && request.signingUrl && (
                          <button
                            onClick={() =>
                              window.open(request.signingUrl, "_blank")
                            }
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                            title="Open signing URL"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </button>
                        )}

                        {request.status === "completed" && (
                          <button
                            onClick={() => onDownloadDocument?.(request.id)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md"
                            title="Download document"
                          >
                            <DocumentCheckIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>
                        Aangemaakt:{" "}
                        {format(
                          new Date(request.createdAt),
                          "dd MMM yyyy 'om' HH:mm",
                          { locale: nl }
                        )}
                      </div>
                      {request.sentAt && (
                        <div>
                          Verzonden:{" "}
                          {format(
                            new Date(request.sentAt),
                            "dd MMM yyyy 'om' HH:mm",
                            { locale: nl }
                          )}
                        </div>
                      )}
                      {request.completedAt && (
                        <div>
                          Voltooid:{" "}
                          {format(
                            new Date(request.completedAt),
                            "dd MMM yyyy 'om' HH:mm",
                            { locale: nl }
                          )}
                        </div>
                      )}
                      {request.expiresAt && request.status === "sent" && (
                        <div>
                          Verloopt:{" "}
                          {format(new Date(request.expiresAt), "dd MMM yyyy", {
                            locale: nl,
                          })}
                        </div>
                      )}
                      {request.reminders > 0 && (
                        <div>Herinneringen: {request.reminders}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send for Signature Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Verstuur voor Handtekening
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                value={sendForm.recipientName}
                onChange={(e) =>
                  setSendForm({ ...sendForm, recipientName: e.target.value })
                }
                placeholder="Naam ontvanger"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
              <input
                type="email"
                value={sendForm.recipientEmail}
                onChange={(e) =>
                  setSendForm({ ...sendForm, recipientEmail: e.target.value })
                }
                placeholder="Email ontvanger"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
              <textarea
                value={sendForm.customMessage}
                onChange={(e) =>
                  setSendForm({ ...sendForm, customMessage: e.target.value })
                }
                placeholder="Persoonlijk bericht (optioneel)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
              <input
                type="number"
                value={sendForm.expirationDays}
                onChange={(e) =>
                  setSendForm({
                    ...sendForm,
                    expirationDays: Number(e.target.value),
                  })
                }
                placeholder="Vervaldatum (dagen)"
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSendModal(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleSendForSignature(showSendModal)}
                disabled={!sendForm.recipientName || !sendForm.recipientEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Versturen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
