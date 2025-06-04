"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  MapPinIcon,
  DocumentTextIcon,
  FunnelIcon,
  EyeIcon,
  HeartIcon,
  XMarkIcon,
  ChartBarIcon,
  BriefcaseIcon,
  FireIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
import MetricCard from "@/components/ui/MetricCard";
import DateRangePicker from "@/components/ui/DateRangePicker";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import AvatarStack from "@/components/ui/AvatarStack";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  company: string;
  projectNumber?: string;
  location?: string;
  workDescription?: string;
  duration?: string;
  assignedEmployees: {
    id: string;
    name: string;
    role?: string;
  }[];
  interestedEmployees?: Array<{
    id: string;
    name: string;
    status: "INTERESTED" | "NOT_INTERESTED";
    notes?: string;
  }>;
  assignmentCount?: number;
  assignments?: Array<{
    user: {
      id: string;
      name: string;
      status: string;
      profileImage?: string;
    };
  }>;
}

export default function Projects() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [interestNotes, setInterestNotes] = useState("");
  const [activeTab, setActiveTab] = useState<
    "open" | "my" | "closed" | "filled" | "archive"
  >("open");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    company: "",
    projectNumber: "",
    location: "",
    workDescription: "",
    duration: "",
  });
  const [projectDateRange, setProjectDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });
  const { toast, showToast, hideToast } = useToast();

  const isAdminOrManager =
    session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  useEffect(() => {
    fetchProjects();
  }, []);

  // Set default tab based on user role
  useEffect(() => {
    if (session?.user) {
      const isAdminOrManager =
        session.user.role === "ADMIN" || session.user.role === "MANAGER";
      if (isAdminOrManager && activeTab === "my") {
        setActiveTab("open");
      }
    }
  }, [session, activeTab]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
      } else {
        console.error("Error fetching projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async (
    projectId: string,
    interested: boolean
  ) => {
    if (!selectedProject) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interested,
          notes: interested ? interestNotes : "Niet beschikbaar",
        }),
      });

      if (response.ok) {
        await fetchProjects();

        // Send notification to admins/managers if interested
        if (interested) {
          try {
            await fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "PROJECT",
                message: `${session?.user?.name} heeft interesse getoond in project: ${selectedProject.name}`,
              }),
            });
          } catch (notificationError) {
            console.error("Error sending notification:", notificationError);
          }
        }

        setShowInterestModal(false);
        setInterestNotes("");

        // Show success toast
        const data = await response.json();
        showToast(
          data.message ||
            (interested
              ? "Interesse geregistreerd"
              : "Gemarkeerd als niet beschikbaar"),
          "success"
        );
      } else {
        const data = await response.json();
        console.error("Error expressing interest:", data.error);
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error expressing interest:", error);
      showToast(
        "Er is iets misgegaan bij het registreren van je keuze",
        "error"
      );
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would go here
    console.log("Add project functionality");
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would go here
    console.log("Edit project functionality");
  };

  const handleDeleteProject = async (id: string) => {
    // Implementation would go here
    console.log("Delete project functionality for:", id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-700";
      case "IN_PROGRESS":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      case "COMPLETED":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700";
      case "CANCELLED":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      default:
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Open";
      case "IN_PROGRESS":
        return "In Behandeling";
      case "COMPLETED":
        return "Voltooid";
      case "CANCELLED":
        return "Geannuleerd";
      default:
        return status;
    }
  };

  const getFilteredProjects = () => {
    const filtered = projects.filter((project) => {
      switch (activeTab) {
        case "open":
          return project.status === "OPEN";
        case "my":
          return project.assignedEmployees.some(
            (emp) => emp.id === session?.user?.id
          );
        case "closed":
          return project.status === "COMPLETED";
        case "filled":
          return project.status === "IN_PROGRESS";
        case "archive":
          return project.status === "CANCELLED";
        default:
          return true;
      }
    });
    return filtered;
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "open":
        return "Open Projecten";
      case "my":
        return "Mijn Projecten";
      case "closed":
        return "Afgesloten";
      case "filled":
        return "In Behandeling";
      case "archive":
        return "Archief";
      default:
        return tab;
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "open":
        return projects.filter((p) => p.status === "OPEN").length;
      case "my":
        return projects.filter((p) =>
          p.assignedEmployees.some((emp) => emp.id === session?.user?.id)
        ).length;
      case "closed":
        return projects.filter((p) => p.status === "COMPLETED").length;
      case "filled":
        return projects.filter((p) => p.status === "IN_PROGRESS").length;
      case "archive":
        return projects.filter((p) => p.status === "CANCELLED").length;
      default:
        return 0;
    }
  };

  // Calculate statistics
  const totalProjects = projects.length;
  const openProjects = projects.filter((p) => p.status === "OPEN").length;
  const myProjects = projects.filter((p) =>
    p.assignedEmployees.some((emp) => emp.id === session?.user?.id)
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <BriefcaseIcon className="text-white h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isAdminOrManager ? "Projecten Beheer" : "Mijn Projecten"}
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {isAdminOrManager
                    ? "Beheer alle projecten en klussen in het systeem"
                    : "Bekijk beschikbare projecten en beheer je toewijzingen"}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{totalProjects} Totaal</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{openProjects} Open</span>
                  </span>
                  {!isAdminOrManager && (
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>{myProjects} Mijn projecten</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {isAdminOrManager && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  variant="primary"
                  size="md"
                  className="text-white bg-blue-600 shadow-sm hover:bg-blue-700"
                >
                  Nieuw Project
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Totaal Projecten"
          value={totalProjects}
          icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Alle projecten"
          trend={{
            value: 5,
            isPositive: true,
            label: "deze maand",
          }}
        />

        <MetricCard
          title={isAdminOrManager ? "Open Projecten" : "Beschikbaar"}
          value={openProjects}
          icon={<SparklesIcon className="w-8 h-8" />}
          color="green"
          subtitle={
            isAdminOrManager ? "Wachten op toewijzing" : "Voor mij beschikbaar"
          }
          trend={{
            value: openProjects > 0 ? openProjects : 0,
            isPositive: true,
            label: "nieuwe kansen",
          }}
        />

        <MetricCard
          title={isAdminOrManager ? "In Behandeling" : "Mijn Projecten"}
          value={
            isAdminOrManager
              ? projects.filter((p) => p.status === "IN_PROGRESS").length
              : myProjects
          }
          icon={<UserIcon className="w-8 h-8" />}
          color="orange"
          subtitle={
            isAdminOrManager ? "Actieve projecten" : "Toegewezen aan mij"
          }
          trend={{
            value: 2,
            isPositive: true,
            label: "deze week",
          }}
        />

        <MetricCard
          title="Voltooid"
          value={completedProjects}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color="purple"
          subtitle="Afgeronde projecten"
          trend={{
            value: Math.round((completedProjects / totalProjects) * 100) || 0,
            isPositive: true,
            label: "% van totaal",
          }}
        />
      </div>

      {/* Advanced Filters Section */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Filters en Zoeken
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-1 lg:col-span-1">
              <Input
                placeholder="Zoek projecten..."
                value=""
                onChange={() => {}}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                label="Zoeken"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bedrijf
              </label>
              <select
                value=""
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle bedrijven</option>
                <option value="Broers Verhuur">🚛 Broers Verhuur</option>
                <option value="DCRT Event Decorations">
                  🎉 DCRT Event Decorations
                </option>
                <option value="DCRT in Building">🏢 DCRT in Building</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value=""
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle statussen</option>
                <option value="OPEN">🟢 Open</option>
                <option value="IN_PROGRESS">🔄 In Behandeling</option>
                <option value="COMPLETED">✅ Voltooid</option>
                <option value="CANCELLED">❌ Geannuleerd</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Locatie
              </label>
              <select
                value=""
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Alle locaties</option>
                <option value="Amsterdam">📍 Amsterdam</option>
                <option value="Rotterdam">📍 Rotterdam</option>
                <option value="Utrecht">📍 Utrecht</option>
                <option value="Den Haag">📍 Den Haag</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              {getFilteredProjects().length} van {projects.length} projecten
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto">
            {[
              isAdminOrManager ? "open" : "my",
              "open",
              ...(isAdminOrManager ? ["filled"] : []),
              "closed",
              ...(isAdminOrManager ? ["archive"] : []),
            ]
              .filter((tab, index, arr) => arr.indexOf(tab) === index)
              .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{getTabLabel(tab)}</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activeTab === tab
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {getTabCount(tab)}
                    </span>
                  </div>
                </button>
              ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Projects Grid */}
          {getFilteredProjects().length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Geen projecten gevonden
              </h3>
              <p className="max-w-md mx-auto mb-6 text-gray-500 dark:text-gray-400">
                {activeTab === "my"
                  ? "Je bent nog aan geen projecten toegewezen."
                  : "Er zijn momenteel geen projecten in deze categorie."}
              </p>
              {isAdminOrManager && activeTab === "open" && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  variant="primary"
                  size="md"
                  className="text-white bg-blue-600 shadow-sm hover:bg-blue-700"
                >
                  Eerste Project Maken
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredProjects().map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="transition-all duration-200 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700 hover:shadow-md group"
                >
                  <div className="p-6">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 shadow-sm bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                          <BriefcaseIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </h3>
                          {project.projectNumber && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              #{project.projectNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {getStatusText(project.status)}
                      </span>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <BuildingOfficeIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{project.company}</span>
                      </div>

                      {project.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {formatDate(project.startDate)} -{" "}
                          {formatDate(project.endDate)}
                        </span>
                      </div>

                      {project.duration && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{project.duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {project.description}
                      </p>
                    )}

                    {/* Assigned Team */}
                    {project.assignedEmployees.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <UserGroupIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Team ({project.assignedEmployees.length})
                          </span>
                        </div>
                        <AvatarStack
                          members={project.assignedEmployees.map((emp) => ({
                            id: emp.id,
                            name: emp.name,
                            role: emp.role,
                          }))}
                          maxVisible={3}
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex space-x-2">
                        {!isAdminOrManager && project.status === "OPEN" && (
                          <Button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowInterestModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            leftIcon={<HeartIcon className="w-4 h-4" />}
                            className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                          >
                            Interesse
                          </Button>
                        )}

                        <Button
                          onClick={() => {
                            // View project details logic
                          }}
                          variant="outline"
                          size="sm"
                          leftIcon={<EyeIcon className="w-4 h-4" />}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                        >
                          Details
                        </Button>
                      </div>

                      {isAdminOrManager && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowEditModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            leftIcon={<PencilIcon className="w-4 h-4" />}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                          >
                            Bewerk
                          </Button>
                          <Button
                            onClick={() => handleDeleteProject(project.id)}
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Project Toevoegen"
        description="Maak een nieuw project aan en stel de details in"
        size="lg"
      >
        <form onSubmit={handleAddProject} className="space-y-6">
          <div className="space-y-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Basis Informatie
            </h4>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Project Naam"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                leftIcon={<ClipboardDocumentListIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                placeholder="Naam van het project"
                required
              />
              <Input
                label="Project Nummer"
                value={newProject.projectNumber}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    projectNumber: e.target.value,
                  })
                }
                leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                placeholder="Optioneel referentienummer"
              />
            </div>

            <Input
              label="Beschrijving"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              variant="outlined"
              inputSize="md"
              placeholder="Korte beschrijving van het project"
              required
            />
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Bedrijf & Locatie
            </h4>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bedrijf
                </label>
                <select
                  value={newProject.company}
                  onChange={(e) =>
                    setNewProject({ ...newProject, company: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecteer bedrijf</option>
                  <option value="Broers Verhuur">Broers Verhuur</option>
                  <option value="DCRT Event Decorations">
                    DCRT Event Decorations
                  </option>
                  <option value="DCRT in Building">DCRT in Building</option>
                </select>
              </div>

              <Input
                label="Locatie"
                value={newProject.location}
                onChange={(e) =>
                  setNewProject({ ...newProject, location: e.target.value })
                }
                leftIcon={<MapPinIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                placeholder="Projectlocatie"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Planning
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Periode
              </label>
              <DateRangePicker
                value={projectDateRange}
                onChange={setProjectDateRange}
                placeholder="Selecteer start- en einddatum"
                minDate={new Date()}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Kies de start- en einddatum voor het project
              </p>
            </div>

            <Input
              label="Geschatte Duur"
              value={newProject.duration}
              onChange={(e) =>
                setNewProject({ ...newProject, duration: e.target.value })
              }
              leftIcon={<ClockIcon className="h-5 w-5" />}
              variant="outlined"
              inputSize="md"
              placeholder="Bijv. 2 weken, 3 dagen"
            />
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Werkzaamheden
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Werkzaamheden Beschrijving
              </label>
              <textarea
                value={newProject.workDescription}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    workDescription: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Beschrijf de specifieke werkzaamheden die uitgevoerd moeten worden"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" variant="primary">
              Project Toevoegen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Interest Modal */}
      <Modal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        title="Interesse Tonen"
        description="Laat weten dat je beschikbaar bent voor dit project"
        size="md"
        type="info"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-400 dark:text-blue-300" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  {selectedProject?.name}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Door interesse te tonen geef je aan dat je beschikbaar bent
                  voor dit project. De projectmanager kan je dan toewijzen aan
                  het project.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Notities (optioneel)"
            value={interestNotes}
            onChange={(e) => setInterestNotes(e.target.value)}
            leftIcon={<DocumentTextIcon className="h-5 w-5" />}
            variant="outlined"
            inputSize="md"
            placeholder="Eventuele opmerkingen, vragen of beschikbaarheid..."
            helperText="Voeg eventuele opmerkingen toe over je beschikbaarheid of ervaring"
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowInterestModal(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                selectedProject &&
                handleExpressInterest(selectedProject.id, true)
              }
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
            >
              Interesse Bevestigen
            </Button>
          </div>
        </div>
      </Modal>

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
