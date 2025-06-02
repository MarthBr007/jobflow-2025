"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  UserCircleIcon,
  BellIcon,
  KeyIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Modal from "@/components/ui/Modal";
import PermissionGuard from "@/components/ui/PermissionGuard";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  status: string;
  phone?: string;
  address?: string;
  hourlyRate?: number;
  kvkNumber?: string;
  btwNumber?: string;
  hasContract?: boolean;
  workTypes: string[];
  profileImage?: string;
  createdAt: string;
}

interface WorkType {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  isActive: boolean;
}

export default function Settings() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    workTypes: [] as string[],
    kvkNumber: "",
    btwNumber: "",
    hasContract: false,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    projectUpdates: true,
    timeTrackingReminders: true,
    availabilityReminders: true,
  });

  useEffect(() => {
    fetchUserProfile();
    fetchWorkTypes();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (response.ok) {
        setUserProfile(data);
        setProfileImage(data.profileImage || "");
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          workTypes: data.workTypes || [],
          kvkNumber: data.kvkNumber || "",
          btwNumber: data.btwNumber || "",
          hasContract: data.hasContract || false,
        });
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Er is iets misgegaan bij het ophalen van je profiel", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch("/api/work-types");
      const data = await response.json();

      if (response.ok) {
        setWorkTypes(data.filter((wt: WorkType) => wt.isActive));
      } else {
        console.error("Error fetching work types:", data.error);
      }
    } catch (error) {
      console.error("Error fetching work types:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const emailChanged = formData.email !== userProfile?.email;

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUserProfile(data);
        if (emailChanged) {
          showToast(
            "Profiel bijgewerkt! Je wordt uitgelogd om je nieuwe emailadres te activeren...",
            "success"
          );
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 2000);
        } else {
          showToast("Profiel succesvol bijgewerkt", "success");
        }
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(
        "Er is iets misgegaan bij het bijwerken van je profiel",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleWorkTypeToggle = (workType: string) => {
    setFormData((prev) => ({
      ...prev,
      workTypes: prev.workTypes.includes(workType)
        ? prev.workTypes.filter((wt) => wt !== workType)
        : [...prev.workTypes, workType],
    }));
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Alleen afbeeldingen zijn toegestaan", "error");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Afbeelding moet kleiner zijn dan 5MB", "error");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/user/profile/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfileImage(data.imageUrl);
        showToast("Profielfoto succesvol geüpload", "success");
        // Refresh user profile to get updated data
        fetchUserProfile();
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Er is een fout opgetreden bij het uploaden", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDelete = async () => {
    try {
      const response = await fetch("/api/user/profile/image", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setProfileImage("");
        showToast("Profielfoto verwijderd", "success");
        // Refresh user profile to get updated data
        fetchUserProfile();
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      showToast("Er is een fout opgetreden bij het verwijderen", "error");
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "MANAGER":
        return "Manager";
      case "FREELANCER":
        return "Freelancer";
      case "EMPLOYEE":
        return "Medewerker";
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "WORKING":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "UNAVAILABLE":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Beschikbaar";
      case "WORKING":
        return "Aan het werk";
      case "UNAVAILABLE":
        return "Niet beschikbaar";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">
          Profiel kon niet worden geladen
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mijn Profiel" },
        ]}
        className="mb-1 sm:mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            ⚙️ Mijn Profiel
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Beheer je persoonlijke gegevens en voorkeuren
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              } whitespace-nowrap py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm touch-manipulation min-h-[44px] flex items-center`}
            >
              <UserCircleIcon className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Profiel
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`${
                activeTab === "notifications"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              } whitespace-nowrap py-3 sm:py-4 px-4 sm:px-6 border-b-2 font-medium text-xs sm:text-sm touch-manipulation min-h-[44px] flex items-center`}
            >
              <BellIcon className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Notificaties
            </button>
          </nav>
        </div>

        <div className="p-3.5 sm:p-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              {/* Account Overview */}
              <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  <UserCircleIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Account Overzicht
                </h3>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Rol:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {getRoleText(userProfile.role)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Bedrijf:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {userProfile.company}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status:
                      </span>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          userProfile.status
                        )}`}
                      >
                        {getStatusText(userProfile.status)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Lid sinds:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(userProfile.createdAt)}
                      </span>
                    </div>

                    {userProfile.hourlyRate && (
                      <div className="flex items-center">
                        <span className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
                          Uurtarief:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          €{userProfile.hourlyRate}/uur
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                {/* Personal Information */}
                <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="flex items-center mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                    <UserCircleIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Persoonlijke Gegevens
                  </h3>

                  {/* Profile Photo Section */}
                  <div className="pb-6 mb-8 border-b border-blue-200 dark:border-blue-700">
                    <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profielfoto
                    </label>

                    <div className="flex items-center space-x-6">
                      {/* Current Photo Display */}
                      <div className="relative">
                        {profileImage || userProfile.profileImage ? (
                          <div className="relative w-24 h-24 overflow-hidden border-4 border-white rounded-full shadow-lg dark:border-gray-800">
                            <img
                              src={profileImage || userProfile.profileImage}
                              alt="Profielfoto"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-24 h-24 border-4 border-white rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 dark:border-gray-800">
                            <span className="text-2xl font-bold text-white">
                              {userProfile.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                        )}

                        {imageUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                            <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      {/* Upload/Delete Controls */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={triggerFileUpload}
                            disabled={imageUploading}
                            leftIcon={<CameraIcon className="w-4 h-4" />}
                          >
                            {profileImage || userProfile.profileImage
                              ? "Wijzigen"
                              : "Uploaden"}
                          </Button>

                          {(profileImage || userProfile.profileImage) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleImageDelete}
                              disabled={imageUploading}
                              leftIcon={<TrashIcon className="w-4 h-4" />}
                              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                            >
                              Verwijderen
                            </Button>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG of GIF. Maximaal 5MB.
                        </p>
                      </div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Input
                      label="Naam"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      leftIcon={<UserCircleIcon className="w-5 h-5" />}
                      variant="outlined"
                      inputSize="md"
                      required
                    />

                    <Input
                      label="Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      leftIcon={<KeyIcon className="w-5 h-5" />}
                      variant="outlined"
                      inputSize="md"
                      required
                    />

                    <Input
                      label="Telefoonnummer"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      leftIcon={<PhoneIcon className="w-5 h-5" />}
                      variant="outlined"
                      inputSize="md"
                      placeholder="+31 6 12345678"
                    />
                  </div>

                  {formData.email !== userProfile?.email && (
                    <div className="p-3 mt-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            <strong>Let op:</strong> Als je je emailadres
                            wijzigt, word je automatisch uitgelogd en moet je
                            opnieuw inloggen met je nieuwe emailadres.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <Input
                      label="Adres"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      leftIcon={<MapPinIcon className="w-5 h-5" />}
                      variant="outlined"
                      inputSize="md"
                      placeholder="Straat, Postcode, Stad"
                    />
                  </div>
                </div>

                {/* Work Types */}
                <div className="p-6 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    Werkzaamheden & Vaardigheden
                  </h3>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {workTypes.map((workType) => (
                      <label
                        key={workType.id}
                        className="flex items-center p-3 space-x-3 transition-colors border border-gray-200 rounded-lg cursor-pointer dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.workTypes.includes(workType.name)}
                          onChange={() => handleWorkTypeToggle(workType.name)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize dark:text-gray-300">
                          {workType.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Freelancer Information */}
                {userProfile.role === "FREELANCER" && (
                  <div className="p-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      <BuildingOfficeIcon className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                      Freelancer Gegevens
                    </h3>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <Input
                        label="KvK Nummer"
                        value={formData.kvkNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kvkNumber: e.target.value,
                          })
                        }
                        leftIcon={<DocumentTextIcon className="w-5 h-5" />}
                        variant="outlined"
                        inputSize="md"
                        placeholder="12345678"
                      />

                      <Input
                        label="BTW Nummer"
                        value={formData.btwNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            btwNumber: e.target.value,
                          })
                        }
                        leftIcon={<CurrencyEuroIcon className="w-5 h-5" />}
                        variant="outlined"
                        inputSize="md"
                        placeholder="NL123456789B01"
                      />
                    </div>

                    <div className="mt-6">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.hasContract}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hasContract: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Ik heb een contract getekend
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={saving}
                    leftIcon={
                      saving ? undefined : (
                        <CheckCircleIcon className="w-4 h-4" />
                      )
                    }
                  >
                    {saving ? "Opslaan..." : "Profiel Bijwerken"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                <BellIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Notificatie Voorkeuren
              </h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Notificaties
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ontvang updates via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Project Updates
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Notificaties over nieuwe projecten en wijzigingen
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.projectUpdates}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        projectUpdates: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tijd Registratie Herinneringen
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Herinneringen om je tijd bij te houden
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.timeTrackingReminders}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        timeTrackingReminders: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Beschikbaarheid Herinneringen
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Herinneringen om je beschikbaarheid bij te werken
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.availabilityReminders}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        availabilityReminders: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                >
                  Notificaties Opslaan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
