"use client";

import { useState, useEffect } from "react";
import {
  ClockIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  blocks?: any[]; // For visual builder data
  metadata: {
    name: string;
    description: string;
    author: string;
    createdAt: string;
    changeNote?: string;
    tags?: string[];
    isAutoSave?: boolean;
    size?: number;
  };
  diff?: {
    added: number;
    removed: number;
    modified: number;
  };
}

interface TemplateVersionHistoryProps {
  templateId: string;
  currentVersion?: TemplateVersion;
  onRestore?: (version: TemplateVersion) => void;
  onPreview?: (version: TemplateVersion) => void;
  onCreateTag?: (versionId: string, tag: string) => void;
  onDeleteVersion?: (versionId: string) => void;
  maxVersions?: number;
}

export default function TemplateVersionHistory({
  templateId,
  currentVersion,
  onRestore,
  onPreview,
  onCreateTag,
  onDeleteVersion,
  maxVersions = 50,
}: TemplateVersionHistoryProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState<string | null>(null);
  const [tagName, setTagName] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "manual" | "auto">("all");
  const [sortBy, setSortBy] = useState<"date" | "version">("date");

  useEffect(() => {
    fetchVersionHistory();
  }, [templateId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);

      // Mock version history data
      const mockVersions: TemplateVersion[] = [
        {
          id: "v_1",
          templateId,
          version: 5,
          content: `**FREELANCER CONTRACT** (v5)

Beste {{employee_name}},

Hierbij bieden wij u een freelance opdracht aan bij {{company_name}}.

**Contractgegevens:**
- Naam: {{employee_name}}
- Email: {{employee_email}}
- Functie: {{job_title}}
- Uurtarief: €{{hourly_rate}}
- Startdatum: {{start_date}}

**Nieuwe clausule toegevoegd:**
- Intellectueel eigendom blijft bij opdrachtnemer

Met vriendelijke groet,
{{company_name}}`,
          metadata: {
            name: "Freelancer Contract",
            description: "IP clausule toegevoegd",
            author: "Marthen Bakker",
            createdAt: new Date().toISOString(),
            changeNote:
              "Intellectueel eigendom clausule toegevoegd voor betere rechtsbescherming",
            tags: ["approved", "legal-review"],
            isAutoSave: false,
            size: 1250,
          },
          diff: { added: 45, removed: 0, modified: 12 },
        },
        {
          id: "v_2",
          templateId,
          version: 4,
          content: `**FREELANCER CONTRACT** (v4)

Beste {{employee_name}},

Hierbij bieden wij u een freelance opdracht aan bij {{company_name}}.

**Contractgegevens:**
- Naam: {{employee_name}}
- Email: {{employee_email}}
- Functie: {{job_title}}
- Uurtarief: €{{hourly_rate}}
- Startdatum: {{start_date}}

Met vriendelijke groet,
{{company_name}}`,
          metadata: {
            name: "Freelancer Contract",
            description: "Automatische opslag",
            author: "System",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            isAutoSave: true,
            size: 945,
          },
          diff: { added: 0, removed: 15, modified: 5 },
        },
        {
          id: "v_3",
          templateId,
          version: 3,
          content: `**FREELANCER CONTRACT** (v3)

Beste {{employee_name}},

Hierbij bieden wij u een freelance opdracht aan bij {{company_name}}.

**Contractgegevens:**
- Naam: {{employee_name}}
- Email: {{employee_email}}
- Functie: {{job_title}}
- Uurtarief: €{{hourly_rate}}
- Startdatum: {{start_date}}
- Extra voorwaarden toegevoegd

Met vriendelijke groet,
{{company_name}}`,
          metadata: {
            name: "Freelancer Contract",
            description: "Voorwaarden update",
            author: "Jan de Vries",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            changeNote: "Extra voorwaarden en termijnen toegevoegd",
            tags: ["draft"],
            isAutoSave: false,
            size: 1120,
          },
          diff: { added: 35, removed: 8, modified: 20 },
        },
      ];

      setVersions(mockVersions);
    } catch (error) {
      console.error("Error fetching version history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: TemplateVersion) => {
    if (
      window.confirm(
        `Weet je zeker dat je wilt terugkeren naar versie ${version.version}?`
      )
    ) {
      onRestore?.(version);
    }
  };

  const handleCreateTag = async () => {
    if (!showTagModal || !tagName.trim()) return;

    try {
      await onCreateTag?.(showTagModal, tagName.trim());

      // Update local state
      setVersions((prev) =>
        prev.map((v) =>
          v.id === showTagModal
            ? {
                ...v,
                metadata: {
                  ...v.metadata,
                  tags: [...(v.metadata.tags || []), tagName.trim()],
                },
              }
            : v
        )
      );

      setShowTagModal(null);
      setTagName("");
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    if (window.confirm("Weet je zeker dat je deze versie wilt verwijderen?")) {
      onDeleteVersion?.(versionId);
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
    }
  };

  const filteredVersions = versions
    .filter((version) => {
      if (filterBy === "manual") return !version.metadata.isAutoSave;
      if (filterBy === "auto") return version.metadata.isAutoSave;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "version") return b.version - a.version;
      return (
        new Date(b.metadata.createdAt).getTime() -
        new Date(a.metadata.createdAt).getTime()
      );
    });

  const getVersionBadgeColor = (version: TemplateVersion) => {
    if (version.metadata.tags?.includes("approved"))
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (version.metadata.tags?.includes("draft"))
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (version.metadata.isAutoSave)
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Versie Geschiedenis
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {versions.length} versies beschikbaar
          </p>
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center space-x-3">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1"
          >
            <option value="all">Alle versies</option>
            <option value="manual">Handmatig opgeslagen</option>
            <option value="auto">Automatisch opgeslagen</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1"
          >
            <option value="date">Sorteer op datum</option>
            <option value="version">Sorteer op versie</option>
          </select>
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-4">
        {filteredVersions.map((version, index) => (
          <div
            key={version.id}
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
              currentVersion?.id === version.id ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Version Header */}
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    v{version.version}
                  </span>

                  {currentVersion?.id === version.id && (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                      Huidige versie
                    </span>
                  )}

                  {version.metadata.tags?.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getVersionBadgeColor(
                        version
                      )}`}
                    >
                      {tag}
                    </span>
                  ))}

                  {version.metadata.isAutoSave && (
                    <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                      Auto-opslag
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-900 dark:text-white font-medium mb-1">
                  {version.metadata.description}
                </p>

                {version.metadata.changeNote && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {version.metadata.changeNote}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{version.metadata.author}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {format(
                        new Date(version.metadata.createdAt),
                        "dd MMM yyyy 'om' HH:mm",
                        {
                          locale: nl,
                        }
                      )}
                    </span>
                  </div>

                  {version.metadata.size && (
                    <span>
                      {Math.round((version.metadata.size / 1024) * 100) / 100}kb
                    </span>
                  )}
                </div>

                {/* Diff Stats */}
                {version.diff && (
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    {version.diff.added > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        +{version.diff.added} toegevoegd
                      </span>
                    )}
                    {version.diff.removed > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        -{version.diff.removed} verwijderd
                      </span>
                    )}
                    {version.diff.modified > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        ~{version.diff.modified} gewijzigd
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onPreview?.(version)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Voorbeeld bekijken"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setShowTagModal(version.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Tag toevoegen"
                >
                  <TagIcon className="h-4 w-4" />
                </button>

                {currentVersion?.id !== version.id && (
                  <button
                    onClick={() => handleRestore(version)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                    title="Terugzetten naar deze versie"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                  </button>
                )}

                {!version.metadata.isAutoSave && index > 0 && (
                  <button
                    onClick={() => handleDeleteVersion(version.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Versie verwijderen"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tag Toevoegen
            </h3>

            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Tag naam (bijv. approved, draft, review)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              onKeyPress={(e) => e.key === "Enter" && handleCreateTag()}
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTagModal(null);
                  setTagName("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateTag}
                disabled={!tagName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tag Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVersions.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Geen versies gevonden
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Er zijn nog geen versies beschikbaar voor deze template.
          </p>
        </div>
      )}
    </div>
  );
}
