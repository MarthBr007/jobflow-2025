"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  VideoCameraIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  ClockIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface WorkDescription {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  content: {
    id: string;
    type: "TEXT" | "IMAGE" | "VIDEO";
    content: string;
    order: number;
    videoThumbnail?: string;
    videoDuration?: number;
    altText?: string;
  }[];
  views: number;
  likes: number;
  version: number;
}

export default function WorkDescriptions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [descriptions, setDescriptions] = useState<WorkDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDescription, setSelectedDescription] =
    useState<WorkDescription | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    fetchDescriptions();
  }, [filters, pagination.currentPage]);

  const fetchDescriptions = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.currentPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/work-descriptions?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setDescriptions(data.descriptions);
        setPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.pages,
          total: data.pagination.total,
        });
      } else {
        console.error("Error fetching work descriptions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching work descriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: FormData) => {
    try {
      const content = [];
      const contentElements = formData.getAll("content");
      const contentTypes = formData.getAll("contentType");

      for (let i = 0; i < contentElements.length; i++) {
        if (contentElements[i]) {
          content.push({
            type: contentTypes[i],
            content: contentElements[i],
            videoThumbnail: formData.get(`videoThumbnail_${i}`),
            videoDuration: formData.get(`videoDuration_${i}`),
            altText: formData.get(`altText_${i}`),
          });
        }
      }

      const response = await fetch("/api/work-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.get("title"),
          type: formData.get("type"),
          category: formData.get("category"),
          description: formData.get("description"),
          content,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setSelectedDescription(null);
        fetchDescriptions();
      } else {
        console.error("Error creating work description:", data.error);
      }
    } catch (error) {
      console.error("Error creating work description:", error);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!selectedDescription) return;

    try {
      const content = [];
      const contentElements = formData.getAll("content");
      const contentTypes = formData.getAll("contentType");

      for (let i = 0; i < contentElements.length; i++) {
        if (contentElements[i]) {
          content.push({
            type: contentTypes[i],
            content: contentElements[i],
            videoThumbnail: formData.get(`videoThumbnail_${i}`),
            videoDuration: formData.get(`videoDuration_${i}`),
            altText: formData.get(`altText_${i}`),
          });
        }
      }

      const response = await fetch(
        `/api/work-descriptions/${selectedDescription.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.get("title"),
            type: formData.get("type"),
            category: formData.get("category"),
            description: formData.get("description"),
            content,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setSelectedDescription(null);
        fetchDescriptions();
      } else {
        console.error("Error updating work description:", data.error);
      }
    } catch (error) {
      console.error("Error updating work description:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm("Weet je zeker dat je deze werkomschrijving wilt verwijderen?")
    )
      return;

    try {
      const response = await fetch(`/api/work-descriptions/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        fetchDescriptions();
      } else {
        console.error("Error deleting work description:", data.error);
      }
    } catch (error) {
      console.error("Error deleting work description:", error);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`/api/work-descriptions/${id}/like`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        fetchDescriptions();
      } else {
        console.error("Error liking work description:", data.error);
      }
    } catch (error) {
      console.error("Error liking work description:", error);
    }
  };

  const handleView = async (id: string) => {
    try {
      const response = await fetch(`/api/work-descriptions/${id}/view`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        fetchDescriptions();
      } else {
        console.error("Error recording view:", data.error);
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6 text-blue-500" />
          Werkomschrijvingen
        </h1>
        {isAdmin && (
          <Button
            onClick={() => {
              setSelectedDescription(null);
              setShowModal(true);
            }}
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Nieuwe Werkomschrijving
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Type
            </label>
            <select
              id="type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle types</option>
              <option value="DRIVER">Chauffeur</option>
              <option value="ORDER_PICKER">Orderpicker</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Categorie
            </label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle categorieën</option>
              <option value="LOADING">Laden</option>
              <option value="CUSTOMER_SERVICE">Klantenservice</option>
              <option value="ROUTE_PLANNING">Routeplanning</option>
              <option value="SCANNER_USAGE">Scanner gebruik</option>
              <option value="PACKAGING">Verpakking</option>
              <option value="RFID_TUNNEL">RFID Tunnel</option>
              <option value="OTHER">Overig</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Zoeken
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Zoek op titel of beschrijving..."
            />
          </div>
          <div>
            <label
              htmlFor="sortBy"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Sorteren op
            </label>
            <select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="createdAt">Datum</option>
              <option value="title">Titel</option>
              <option value="views">Bekeken</option>
              <option value="likes">Likes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Descriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {descriptions.map((description) => (
          <div
            key={description.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow cursor-pointer"
            onClick={() => handleView(description.id)}
          >
            {description.content.find((c) => c.type === "VIDEO")
              ?.videoThumbnail && (
              <div className="relative h-48">
                <img
                  src={
                    description.content.find((c) => c.type === "VIDEO")
                      ?.videoThumbnail
                  }
                  alt={description.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  {Math.floor(
                    (description.content.find((c) => c.type === "VIDEO")
                      ?.videoDuration || 0) / 60
                  )}
                  :
                  {(
                    (description.content.find((c) => c.type === "VIDEO")
                      ?.videoDuration || 0) % 60
                  )
                    .toString()
                    .padStart(2, "0")}
                </div>
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {description.title}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  v{description.version}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {description.views}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(description.id);
                    }}
                    className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <HeartIcon className="h-4 w-4 mr-1" />
                    {description.likes}
                  </button>
                </div>
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDescription(description);
                        setShowModal(true);
                      }}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(description.id);
                      }}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() =>
              setPagination({
                ...pagination,
                currentPage: pagination.currentPage - 1,
              })
            }
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Vorige
          </button>
          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            Pagina {pagination.currentPage} van {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination({
                ...pagination,
                currentPage: pagination.currentPage + 1,
              })
            }
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Volgende
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDescription(null);
        }}
        title={
          selectedDescription
            ? "Werkomschrijving Bewerken"
            : "Werkomschrijving Toevoegen"
        }
        description={
          selectedDescription
            ? "Wijzig de details van deze werkomschrijving"
            : "Maak een nieuwe werkomschrijving aan voor medewerkers"
        }
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (selectedDescription) {
              handleUpdate(formData);
            } else {
              handleCreate(formData);
            }
          }}
          className="space-y-6"
        >
          <div className="space-y-6">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basis Informatie
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel
              </label>
              <input
                type="text"
                name="title"
                defaultValue={selectedDescription?.title}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="Beschrijvende titel voor de werkomschrijving"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  defaultValue={selectedDescription?.type}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                >
                  <option value="DRIVER">Chauffeur</option>
                  <option value="ORDER_PICKER">Orderpicker</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <select
                  name="category"
                  defaultValue={selectedDescription?.category}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                >
                  <option value="LOADING">Laden</option>
                  <option value="CUSTOMER_SERVICE">Klantenservice</option>
                  <option value="ROUTE_PLANNING">Routeplanning</option>
                  <option value="SCANNER_USAGE">Scanner gebruik</option>
                  <option value="PACKAGING">Verpakking</option>
                  <option value="RFID_TUNNEL">RFID Tunnel</option>
                  <option value="OTHER">Overig</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={selectedDescription?.description}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="Korte beschrijving van de werkomschrijving"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              Content
            </h4>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Voeg verschillende soorten content toe zoals tekst,
                    afbeeldingen en video's om een complete werkomschrijving te
                    maken.
                  </p>
                </div>
              </div>
            </div>

            <div id="contentContainer" className="space-y-4">
              {selectedDescription?.content.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-900">
                      Content Item {index + 1}
                    </h5>
                    <select
                      name="contentType"
                      defaultValue={item.type}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm"
                    >
                      <option value="TEXT">Tekst</option>
                      <option value="IMAGE">Afbeelding</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>

                  {item.type === "TEXT" && (
                    <textarea
                      name="content"
                      defaultValue={item.content}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      placeholder="Voer de tekst content in"
                    />
                  )}
                  {item.type === "IMAGE" && (
                    <input
                      type="text"
                      name="content"
                      defaultValue={item.content}
                      placeholder="Afbeelding URL"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    />
                  )}
                  {item.type === "VIDEO" && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="content"
                        defaultValue={item.content}
                        placeholder="Video URL"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      />
                      <input
                        type="text"
                        name={`videoThumbnail_${index}`}
                        defaultValue={item.videoThumbnail}
                        placeholder="Video thumbnail URL"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      />
                      <input
                        type="number"
                        name={`videoDuration_${index}`}
                        defaultValue={item.videoDuration}
                        placeholder="Video duur (seconden)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    name={`altText_${index}`}
                    defaultValue={item.altText}
                    placeholder="Alt tekst (voor toegankelijkheid)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const container = document.getElementById("contentContainer");
                if (container) {
                  const div = document.createElement("div");
                  div.className =
                    "p-4 border border-gray-200 rounded-lg space-y-3";
                  div.innerHTML = `
                    <div class="flex items-center justify-between">
                      <h5 class="text-sm font-medium text-gray-900">Content Item ${
                        container.children.length + 1
                      }</h5>
                      <select name="contentType" class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm">
                        <option value="TEXT">Tekst</option>
                        <option value="IMAGE">Afbeelding</option>
                        <option value="VIDEO">Video</option>
                      </select>
                    </div>
                    <textarea name="content" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20" placeholder="Voer de content in"></textarea>
                    <input type="text" name="altText_${
                      container.children.length
                    }" placeholder="Alt tekst (voor toegankelijkheid)" class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20" />
                  `;
                  container.appendChild(div);
                }
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Content Item Toevoegen
            </Button>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setSelectedDescription(null);
              }}
            >
              Annuleren
            </Button>
            <Button type="submit" variant="primary">
              {selectedDescription ? "Bijwerken" : "Toevoegen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
