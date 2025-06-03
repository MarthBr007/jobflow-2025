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
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Input from "@/components/ui/Input";
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

    // Convert date range to string format for API
    const projectData = {
      ...newProject,
      startDate: projectDateRange.startDate?.toISOString() || "",
      endDate: projectDateRange.endDate?.toISOString() || "",
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      if (response.ok) {
        setProjects([...projects, data]);
        setShowAddModal(false);
        setNewProject({
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
        setProjectDateRange({ startDate: null, endDate: null });
        showToast("Project succesvol toegevoegd!", "success");
      } else {
        console.error("Error adding project:", data.error);
        showToast(`Fout: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error adding project:", error);
      showToast(
        "Er is een fout opgetreden bij het toevoegen van het project",
        "error"
      );
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedProject),
      });

      const data = await response.json();
      if (response.ok) {
        setProjects(
          projects.map((proj) => (proj.id === selectedProject.id ? data : proj))
        );
        setShowEditModal(false);
        setSelectedProject(null);
      } else {
        console.error("Error updating project:", data.error);
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit project wilt verwijderen?")) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects(projects.filter((proj) => proj.id !== id));
      } else {
        const data = await response.json();
        console.error("Error deleting project:", data.error);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Actief";
      case "completed":
        return "Voltooid";
      case "cancelled":
        return "Geannuleerd";
      case "pending":
        return "In afwachting";
      default:
        return status;
    }
  };

  const getFilteredProjects = () => {
    if (isAdminOrManager) {
      switch (activeTab) {
        case "open":
          return projects.filter(
            (p) =>
              p.status === "ACTIVE" &&
              (!p.assignedEmployees || p.assignedEmployees.length === 0)
          );
        case "filled":
          return projects.filter(
            (p) =>
              p.status === "ACTIVE" &&
              p.assignedEmployees &&
              p.assignedEmployees.length > 0
          );
        case "archive":
          return projects.filter(
            (p) => p.status === "COMPLETED" || p.status === "CANCELLED"
          );
        default:
          return projects;
      }
    } else {
      // Employee/Freelancer view
      switch (activeTab) {
        case "open":
          return projects.filter((p) => p.status === "ACTIVE");
        case "my":
          return projects.filter((p) =>
            p.assignedEmployees?.some((emp) => emp.id === session?.user?.id)
          );
        case "closed":
          return projects.filter(
            (p) => p.status === "COMPLETED" || p.status === "CANCELLED"
          );
        default:
          return projects;
      }
    }
  };

  const getTabLabel = (tab: string) => {
    if (isAdminOrManager) {
      switch (tab) {
        case "open":
          return "Alle Openstaande Klussen";
        case "filled":
          return "Gevulde Klussen";
        case "archive":
          return "Archief";
        default:
          return tab;
      }
    } else {
      switch (tab) {
        case "open":
          return "Openstaande Klussen";
        case "my":
          return "Mijn Klussen";
        case "closed":
          return "Gesloten Klussen";
        default:
          return tab;
      }
    }
  };

  const getTabCount = (tab: string) => {
    return getFilteredProjects().length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const filteredProjects = getFilteredProjects();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten" },
        ]}
        className="mb-2 sm:mb-4"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Projecten
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {isAdminOrManager
              ? "Beheer projecten en volg de voortgang"
              : "Bekijk beschikbare projecten en toon interesse"}
          </p>
        </div>
        {isAdminOrManager && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              variant="primary"
              size="md"
              className="w-full sm:w-auto touch-manipulation"
            >
              <span className="sm:hidden">Nieuw Project</span>
              <span className="hidden sm:inline">Nieuw Project</span>
            </Button>
          </div>
        )}
      </div>

      {/* Projects Container */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex px-3 sm:px-6" aria-label="Tabs">
            {isAdminOrManager ? (
              <>
                {["open", "filled", "archive"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm mr-4 sm:mr-8 touch-manipulation min-h-[44px] ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                    }`}
                  >
                    {getTabLabel(tab)}
                    <span className="ml-1 sm:ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 py-0.5 px-1.5 sm:px-2.5 rounded-full text-xs">
                      {getTabCount(tab)}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <>
                {["open", "my", "closed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm mr-4 sm:mr-8 touch-manipulation min-h-[44px] ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                    }`}
                  >
                    {getTabLabel(tab)}
                    <span className="ml-1 sm:ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 py-0.5 px-1.5 sm:px-2.5 rounded-full text-xs">
                      {getTabCount(tab)}
                    </span>
                  </button>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Projects Grid */}
        <div className="p-3 sm:p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-6 sm:py-12">
              <ClipboardDocumentListIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Geen projecten gevonden
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {activeTab === "open"
                  ? "Er zijn momenteel geen openstaande projecten."
                  : "Er zijn geen projecten in deze categorie."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 touch-manipulation"
                >
                  <div className="p-3.5 sm:p-6">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 truncate">
                          {project.name}
                        </h3>
                        {project.projectNumber && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                            #{project.projectNumber}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ml-2 ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {getStatusText(project.status)}
                      </span>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                        <span className="truncate">{project.company}</span>
                      </div>

                      {project.location && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate">
                          {format(new Date(project.startDate), "dd MMM", {
                            locale: nl,
                          })}{" "}
                          -{" "}
                          {format(new Date(project.endDate), "dd MMM", {
                            locale: nl,
                          })}
                        </span>
                        <span className="flex items-center flex-shrink-0 ml-2">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {project.assignmentCount || 0}
                        </span>
                      </div>

                      {/* Team Members Avatar Stack */}
                      {project.assignments &&
                        project.assignments.length > 0 && (
                          <div className="mt-2 sm:mt-3 flex items-center justify-between">
                            <AvatarStack
                              members={project.assignments.map(
                                (assignment) => ({
                                  id: assignment.user.id,
                                  name: assignment.user.name || "",
                                  src: assignment.user.profileImage,
                                  status:
                                    assignment.user.status === "WORKING"
                                      ? "online"
                                      : "offline",
                                })
                              )}
                              size="xs"
                              maxVisible={3}
                              showStatus={true}
                              onMemberClick={(member) => {
                                console.log("Show member details:", member);
                              }}
                              onMoreClick={() => {
                                console.log("Show all team members");
                              }}
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {project.assignments.length} lid
                              {project.assignments.length !== 1 ? "en" : ""}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                      {project.description}
                    </p>

                    {/* Work Description */}
                    {project.workDescription && (
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                          Werkzaamheden:
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 pl-6 line-clamp-2">
                          {project.workDescription}
                        </p>
                      </div>
                    )}

                    {/* Assigned Employees */}
                    {project.assignedEmployees &&
                      project.assignedEmployees.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <UserGroupIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                            Toegewezen:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {project.assignedEmployees
                              .slice(0, 3)
                              .map((employee) => (
                                <span
                                  key={employee.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                >
                                  {employee.name.split(" ")[0]}{" "}
                                  {/* Show first name only on mobile */}
                                </span>
                              ))}
                            {project.assignedEmployees.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                +{project.assignedEmployees.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Interested Employees (Admin/Manager view) */}
                    {isAdminOrManager &&
                      project.interestedEmployees &&
                      project.interestedEmployees.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <HeartIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                            Interesse getoond:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {project.interestedEmployees
                              .filter((emp) => emp.status === "INTERESTED")
                              .slice(0, 3)
                              .map((employee) => (
                                <span
                                  key={employee.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  title={employee.notes}
                                >
                                  {employee.name.split(" ")[0]}
                                </span>
                              ))}
                            {project.interestedEmployees.filter(
                              (emp) => emp.status === "INTERESTED"
                            ).length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                +
                                {project.interestedEmployees.filter(
                                  (emp) => emp.status === "INTERESTED"
                                ).length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Action Buttons */}
                    <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {isAdminOrManager ? (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedProject(project);
                                setNewProject({
                                  name: project.name,
                                  description: project.description,
                                  startDate: project.startDate,
                                  endDate: project.endDate,
                                  company: project.company,
                                  projectNumber: project.projectNumber || "",
                                  location: project.location || "",
                                  workDescription:
                                    project.workDescription || "",
                                  duration: project.duration || "",
                                });
                                setShowEditModal(true);
                              }}
                              variant="outline"
                              size="sm"
                              leftIcon={<PencilIcon className="h-4 w-4" />}
                              className="flex-1 sm:flex-none touch-manipulation"
                            >
                              <span className="sm:hidden">Bewerken</span>
                              <span className="hidden sm:inline">Bewerken</span>
                            </Button>
                            <Button
                              onClick={() =>
                                router.push(`/dashboard/projects/${project.id}`)
                              }
                              variant="outline"
                              size="sm"
                              leftIcon={<EyeIcon className="h-4 w-4" />}
                              className="flex-1 sm:flex-none touch-manipulation"
                            >
                              <span className="sm:hidden">Details</span>
                              <span className="hidden sm:inline">Bekijken</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowInterestModal(true);
                              }}
                              variant="primary"
                              size="sm"
                              leftIcon={<HeartIcon className="h-4 w-4" />}
                              className="flex-1 sm:flex-none touch-manipulation"
                              disabled={project.interestedEmployees?.some(
                                (emp) => emp.id === session?.user?.id
                              )}
                            >
                              {project.interestedEmployees?.some(
                                (emp) =>
                                  emp.id === session?.user?.id &&
                                  emp.status === "INTERESTED"
                              ) ? (
                                <>
                                  <span className="sm:hidden">
                                    Interesse getoond
                                  </span>
                                  <span className="hidden sm:inline">
                                    Interesse getoond
                                  </span>
                                </>
                              ) : project.interestedEmployees?.some(
                                  (emp) =>
                                    emp.id === session?.user?.id &&
                                    emp.status === "NOT_INTERESTED"
                                ) ? (
                                <>
                                  <span className="sm:hidden">
                                    Niet beschikbaar
                                  </span>
                                  <span className="hidden sm:inline">
                                    Niet beschikbaar
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="sm:hidden">Interesse</span>
                                  <span className="hidden sm:inline">
                                    Toon interesse
                                  </span>
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() =>
                                router.push(`/dashboard/projects/${project.id}`)
                              }
                              variant="outline"
                              size="sm"
                              leftIcon={<EyeIcon className="h-4 w-4" />}
                              className="flex-1 sm:flex-none touch-manipulation"
                            >
                              <span className="sm:hidden">Details</span>
                              <span className="hidden sm:inline">Bekijken</span>
                            </Button>
                          </>
                        )}
                      </div>
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
