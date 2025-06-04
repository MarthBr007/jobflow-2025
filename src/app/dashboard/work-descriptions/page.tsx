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
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  ChartBarIcon,
  UsersIcon,
  TagIcon,
  BookOpenIcon,
  FireIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MetricCard from "@/components/ui/MetricCard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useConfirm } from "@/hooks/useConfirm";

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

const TYPE_OPTIONS = [
  {
    value: "DRIVER",
    label: "Chauffeur",
    icon: <ClockIcon className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "ORDER_PICKER",
    label: "Orderpicker",
    icon: <ArchiveBoxIcon className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
];

const CATEGORY_OPTIONS = [
  {
    value: "LOADING",
    label: "Laden",
    icon: <ArchiveBoxIcon className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "CUSTOMER_SERVICE",
    label: "Klantenservice",
    icon: <UsersIcon className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "ROUTE_PLANNING",
    label: "Routeplanning",
    icon: <ChartBarIcon className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "SCANNER_USAGE",
    label: "Scanner gebruik",
    icon: <EyeIcon className="w-4 h-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "PACKAGING",
    label: "Verpakking",
    icon: <ArchiveBoxIcon className="w-4 h-4" />,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    value: "RFID_TUNNEL",
    label: "RFID Tunnel",
    icon: <TagIcon className="w-4 h-4" />,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    value: "OTHER",
    label: "Overig",
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
];

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
  const { toast, showToast, hideToast } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

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
        limit: "12",
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
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error fetching work descriptions:", error);
      showToast(
        "Er is iets misgegaan bij het ophalen van werkomschrijvingen",
        "error"
      );
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
        showToast("Werkomschrijving succesvol aangemaakt", "success");
        fetchDescriptions();
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating work description:", error);
      showToast(
        "Er is iets misgegaan bij het aanmaken van de werkomschrijving",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: "danger",
      title: "Werkomschrijving verwijderen",
      message:
        "Weet je zeker dat je deze werkomschrijving wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
      confirmText: "Verwijderen",
      cancelText: "Annuleren",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/work-descriptions/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Werkomschrijving succesvol verwijderd", "success");
        fetchDescriptions();
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error deleting work description:", error);
      showToast("Er is iets misgegaan bij het verwijderen", "error");
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
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error liking work description:", error);
      showToast("Er is iets misgegaan", "error");
    }
  };

  const handleView = async (id: string) => {
    try {
      const response = await fetch(`/api/work-descriptions/${id}/view`, {
        method: "POST",
      });

      if (response.ok) {
        fetchDescriptions();
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const getTypeConfig = (type: string) => {
    return (
      TYPE_OPTIONS.find((t) => t.value === type) || {
        value: type,
        label: type,
        icon: <DocumentTextIcon className="w-4 h-4" />,
        color: "text-gray-600 dark:text-gray-400",
      }
    );
  };

  const getCategoryConfig = (category: string) => {
    return (
      CATEGORY_OPTIONS.find((c) => c.value === category) || {
        value: category,
        label: category,
        icon: <TagIcon className="w-4 h-4" />,
        color: "text-gray-600 dark:text-gray-400",
      }
    );
  };

  // Calculate statistics
  const totalDescriptions = descriptions.length;
  const videoDescriptions = descriptions.filter((d) =>
    d.content.some((c) => c.type === "VIDEO")
  ).length;
  const totalViews = descriptions.reduce((sum, d) => sum + d.views, 0);
  const totalLikes = descriptions.reduce((sum, d) => sum + d.likes, 0);
  const mostPopular = descriptions.reduce(
    (prev, current) => (prev.views > current.views ? prev : current),
    descriptions[0]
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl font-semibold text-gray-700 dark:text-gray-300"
        >
          Loading...
        </motion.div>
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
      <ConfirmModal />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Werkomschrijvingen" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <DocumentTextIcon className="text-white h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Werkomschrijvingen
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Kennisbank met instructies en procedures voor alle
                  werkzaamheden
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{totalDescriptions} Instructies</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>{videoDescriptions} Met video</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    <span>{totalViews} Weergaven</span>
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setSelectedDescription(null);
                    setShowModal(true);
                  }}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  variant="primary"
                  size="md"
                  className="text-white bg-blue-600 shadow-sm hover:bg-blue-700"
                >
                  Nieuwe Instructie
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Totaal Instructies"
          value={totalDescriptions}
          icon={<BookOpenIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle werkomschrijvingen"
          trend={{
            value: 5,
            isPositive: true,
            label: "deze maand",
          }}
        />

        <MetricCard
          title="Video Instructies"
          value={videoDescriptions}
          icon={<VideoCameraIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Met video uitleg"
          trend={{
            value:
              Math.round((videoDescriptions / totalDescriptions) * 100) || 0,
            isPositive: true,
            label: "% van totaal",
          }}
        />

        <MetricCard
          title="Totaal Weergaven"
          value={totalViews}
          icon={<EyeIcon className="w-8 h-8" />}
          color="green"
          subtitle="Alle bekeken instructies"
          trend={{
            value: 12,
            isPositive: true,
            label: "% deze week",
          }}
        />

        <MetricCard
          title="Populairste"
          value={mostPopular?.views || 0}
          icon={<FireIcon className="w-8 h-8" />}
          color="orange"
          subtitle={mostPopular?.title.substring(0, 20) + "..." || "Geen data"}
          trend={{
            value: totalLikes,
            isPositive: true,
            label: "totaal likes",
          }}
        />
      </div>

      {/* Enhanced Filters */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters en Zoeken
              </h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.total} resultaten
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Alle types</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Categorie
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Alle categorieën</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Zoeken"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
                placeholder="Zoek op titel of beschrijving..."
                variant="outlined"
                inputSize="md"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sorteren op
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="createdAt">Datum</option>
                <option value="title">Titel</option>
                <option value="views">Bekeken</option>
                <option value="likes">Likes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Work Descriptions Grid */}
      {descriptions.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Geen werkomschrijvingen gevonden
          </h3>
          <p className="max-w-md mx-auto mb-6 text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "Maak je eerste werkomschrijving aan om aan de slag te gaan."
              : "Er zijn momenteel geen werkomschrijvingen beschikbaar."}
          </p>
          {isAdmin && (
            <Button
              onClick={() => {
                setSelectedDescription(null);
                setShowModal(true);
              }}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              variant="primary"
              size="md"
              className="text-white bg-blue-600 shadow-sm hover:bg-blue-700"
            >
              Eerste Instructie Maken
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {descriptions.map((description) => {
            const typeConfig = getTypeConfig(description.type);
            const categoryConfig = getCategoryConfig(description.category);
            const hasVideo = description.content.some(
              (c) => c.type === "VIDEO"
            );
            const videoContent = description.content.find(
              (c) => c.type === "VIDEO"
            );

            return (
              <motion.div
                key={description.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleView(description.id)}
                className="transition-all duration-200 bg-white border border-gray-200 shadow-sm cursor-pointer dark:bg-gray-800 rounded-xl dark:border-gray-700 hover:shadow-md group"
              >
                {/* Thumbnail/Video Preview */}
                {hasVideo && videoContent?.videoThumbnail && (
                  <div className="relative overflow-hidden h-48 rounded-t-xl">
                    <img
                      src={videoContent.videoThumbnail}
                      alt={description.title}
                      className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center justify-center w-16 h-16 text-white transition-all duration-200 bg-black bg-opacity-50 rounded-full group-hover:bg-opacity-70 group-hover:scale-110">
                        <PlayIcon className="w-8 h-8 ml-1" />
                      </div>
                    </div>
                    {videoContent?.videoDuration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium">
                        {Math.floor(videoContent.videoDuration / 60)}:
                        {(videoContent.videoDuration % 60)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {description.title}
                      </h3>
                    </div>
                    <span className="flex-shrink-0 ml-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                      v{description.version}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center mb-3 space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/20 ${typeConfig.color} border border-blue-200 dark:border-blue-700`}
                    >
                      {typeConfig.icon}
                      <span>{typeConfig.label}</span>
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/20 ${categoryConfig.color} border border-purple-200 dark:border-purple-700`}
                    >
                      {categoryConfig.icon}
                      <span>{categoryConfig.label}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {description.description}
                  </p>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        <span>{description.views}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(description.id);
                        }}
                        className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <HeartIcon className="w-4 h-4 mr-1" />
                        <span>{description.likes}</span>
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDescription(description);
                            setShowModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          leftIcon={<PencilIcon className="w-4 h-4" />}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                        >
                          Bewerk
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(description.id);
                          }}
                          variant="outline"
                          size="sm"
                          leftIcon={<TrashIcon className="w-4 h-4" />}
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                        >
                          Verwijder
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            onClick={() =>
              setPagination({
                ...pagination,
                currentPage: pagination.currentPage - 1,
              })
            }
            disabled={pagination.currentPage === 1}
            variant="outline"
            size="md"
          >
            Vorige
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Pagina {pagination.currentPage} van {pagination.totalPages}
          </span>
          <Button
            onClick={() =>
              setPagination({
                ...pagination,
                currentPage: pagination.currentPage + 1,
              })
            }
            disabled={pagination.currentPage === pagination.totalPages}
            variant="outline"
            size="md"
          >
            Volgende
          </Button>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
