"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface WorkType {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    name: string;
    email: string;
  };
}

export default function WorkTypes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(
    null
  );
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "",
    isActive: true,
  });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    fetchWorkTypes();
  }, [includeInactive]);

  // Focus management for modal
  useEffect(() => {
    if (showModal && nameRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        nameRef.current?.focus();
      }, 150);
    }
  }, [showModal]);

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch(
        `/api/work-types?includeInactive=${includeInactive}`
      );
      const data = await response.json();

      if (response.ok) {
        setWorkTypes(data);
      } else {
        console.error("Error fetching work types:", data.error);
      }
    } catch (error) {
      console.error("Error fetching work types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/work-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setSelectedWorkType(null);
        setFormData({ name: "", description: "", emoji: "", isActive: true });
        fetchWorkTypes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating work type:", error);
      alert("Er is iets misgegaan bij het aanmaken van de werkzaamheid");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkType) return;

    try {
      const response = await fetch(`/api/work-types/${selectedWorkType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setSelectedWorkType(null);
        setFormData({ name: "", description: "", emoji: "", isActive: true });
        fetchWorkTypes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating work type:", error);
      alert("Er is iets misgegaan bij het bijwerken van de werkzaamheid");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze werkzaamheid wilt verwijderen?"))
      return;

    try {
      const response = await fetch(`/api/work-types/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        fetchWorkTypes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting work type:", error);
      alert("Er is iets misgegaan bij het verwijderen van de werkzaamheid");
    }
  };

  const handleEdit = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setFormData({
      name: workType.name,
      description: workType.description || "",
      emoji: workType.emoji || "",
      isActive: workType.isActive,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedWorkType(null);
    setFormData({ name: "", description: "", emoji: "", isActive: true });
    setShowModal(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-gray-900 dark:text-white">Niet ingelogd</div>
    );
  }

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MANAGER";

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Geen toegang
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Je hebt geen rechten om werkzaamheden te beheren.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-6 h-6 text-blue-500" />
          Werkzaamheden Beheer
        </h1>
        <Button onClick={handleNew} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Nieuwe Werkzaamheid
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Toon inactieve werkzaamheden
            </span>
          </label>
        </div>
      </div>

      {/* Work Types List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Werkzaamheden ({workTypes.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {workTypes.map((workType) => (
            <div
              key={workType.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{workType.emoji || "🔧"}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {workType.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          workType.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {workType.isActive ? "Actief" : "Inactief"}
                      </span>
                    </div>
                    {workType.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {workType.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Aangemaakt door {workType.creator.name} op{" "}
                      {new Date(workType.createdAt).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(workType)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                    title="Bewerken"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(workType.id)}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                    title="Verwijderen"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {workTypes.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Geen werkzaamheden gevonden
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedWorkType(null);
          setFormData({ name: "", description: "", emoji: "", isActive: true });
        }}
        title={
          selectedWorkType
            ? "🔧 Werkzaamheid Bewerken"
            : "➕ Nieuwe Werkzaamheid"
        }
        description={
          selectedWorkType
            ? "Pas de gegevens van deze werkzaamheid aan"
            : "Voeg een nieuwe werkzaamheid toe aan het systeem"
        }
        size="lg"
        disableAutoFocus={true}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <form
            onSubmit={selectedWorkType ? handleUpdate : handleCreate}
            className="space-y-8"
          >
            {/* Basic Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Basis Informatie
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Naam van de werkzaamheid *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    ref={nameRef}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                    placeholder="Bijv. Chauffeur, Orderpicker, Magazijnmedewerker"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Geef een duidelijke naam voor deze werkzaamheid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Beschrijving
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base resize-none"
                    placeholder="Beschrijf wat deze werkzaamheid inhoudt, welke taken erbij horen, etc."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Optioneel: Geef meer details over deze werkzaamheid
                  </p>
                </div>
              </div>
            </div>

            {/* Visual & Status Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="text-2xl mr-2">🎨</span>
                Weergave & Status
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Emoji (optioneel)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) =>
                        setFormData({ ...formData, emoji: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base text-center text-2xl"
                      placeholder="🚚"
                      maxLength={2}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Kies een emoji die past bij deze werkzaamheid
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Suggesties:
                    </span>
                    {[
                      "🚚",
                      "📦",
                      "🏗️",
                      "🔧",
                      "📋",
                      "🏢",
                      "🚛",
                      "⚙️",
                      "📞",
                      "💼",
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji })}
                        className="text-lg hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-2 py-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Status
                  </label>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Werkzaamheid is actief
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.isActive
                            ? "Medewerkers kunnen deze werkzaamheid selecteren"
                            : "Werkzaamheid is verborgen voor medewerkers"}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setShowModal(false);
                  setSelectedWorkType(null);
                  setFormData({
                    name: "",
                    description: "",
                    emoji: "",
                    isActive: true,
                  });
                }}
                className="px-6"
              >
                ❌ Annuleren
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="px-6"
              >
                {selectedWorkType ? "✅ Bijwerken" : "➕ Aanmaken"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
