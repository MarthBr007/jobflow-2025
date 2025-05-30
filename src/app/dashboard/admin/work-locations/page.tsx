"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Modal from "@/components/ui/Modal";

interface WorkLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function WorkLocations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorkLocation | null>(
    null
  );

  // Mock data - in real app this would come from API
  useEffect(() => {
    // Check admin access
    if (session && session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    // Mock data
    const mockLocations: WorkLocation[] = [
      {
        id: "1",
        name: "Hoofdkantoor Broers Verhuur",
        address: "Industrieweg 25",
        city: "Utrecht",
        postalCode: "3542 AD",
        country: "Nederland",
        description: "Hoofdkantoor en warehouse",
        isActive: true,
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        name: "Amsterdam RAI",
        address: "Europaplein 24",
        city: "Amsterdam",
        postalCode: "1078 GZ",
        country: "Nederland",
        description: "Evenementenlocatie",
        isActive: true,
        createdAt: "2024-01-20",
      },
      {
        id: "3",
        name: "DCRT Event Center",
        address: "Eventlaan 10",
        city: "Rotterdam",
        postalCode: "3000 AB",
        country: "Nederland",
        description: "Event decoratie centrum",
        isActive: true,
        createdAt: "2024-02-01",
      },
    ];

    setTimeout(() => {
      setLocations(mockLocations);
      setLoading(false);
    }, 500);
  }, [session, router]);

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLocation = () => {
    setEditingLocation(null);
    setShowAddModal(true);
  };

  const handleEditLocation = (location: WorkLocation) => {
    setEditingLocation(location);
    setShowAddModal(true);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm("Weet je zeker dat je deze locatie wilt verwijderen?")) {
      setLocations(locations.filter((loc) => loc.id !== id));
    }
  };

  const handleSubmitLocation = (formData: any) => {
    if (editingLocation) {
      // Update existing
      setLocations(
        locations.map((loc) =>
          loc.id === editingLocation.id ? { ...loc, ...formData } : loc
        )
      );
    } else {
      // Add new
      const newLocation: WorkLocation = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setLocations([...locations, newLocation]);
    }
    setShowAddModal(false);
    setEditingLocation(null);
  };

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Geen toegang
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Je hebt geen rechten om deze pagina te bekijken.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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
          { label: "Werklocaties" },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Werklocaties
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Beheer vaste werklocaties en adressen
          </p>
        </div>
        <Button
          onClick={handleAddLocation}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          variant="primary"
          size="md"
        >
          Nieuwe Locatie
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Zoek op naam, stad of adres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredLocations.map((location) => (
          <div
            key={location.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-3">
                      <MapPinIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {location.name}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {location.address}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {location.postalCode} {location.city}
                      </p>
                      {location.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      location.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {location.isActive ? "Actief" : "Inactief"}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Toegevoegd:{" "}
                  {new Date(location.createdAt).toLocaleDateString("nl-NL")}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleEditLocation(location)}
                    variant="outline"
                    size="sm"
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                  >
                    Bewerken
                  </Button>
                  <Button
                    onClick={() => handleDeleteLocation(location.id)}
                    variant="destructive"
                    size="sm"
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                  >
                    Verwijderen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Geen locaties gevonden
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? "Pas je zoekopdracht aan"
              : "Voeg je eerste werklocatie toe"}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <LocationModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingLocation(null);
        }}
        onSubmit={handleSubmitLocation}
        location={editingLocation}
      />
    </div>
  );
}

// Location Modal Component
interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  location?: WorkLocation | null;
}

function LocationModal({
  isOpen,
  onClose,
  onSubmit,
  location,
}: LocationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Nederland",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city,
        postalCode: location.postalCode,
        country: location.country,
        description: location.description || "",
        isActive: location.isActive,
      });
    } else {
      setFormData({
        name: "",
        address: "",
        city: "",
        postalCode: "",
        country: "Nederland",
        description: "",
        isActive: true,
      });
    }
  }, [location, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={location ? "Locatie Bewerken" : "Nieuwe Locatie"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Naam *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adres *
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Postcode *
            </label>
            <input
              type="text"
              required
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Stad *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Land
          </label>
          <select
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="Nederland">Nederland</option>
            <option value="België">België</option>
            <option value="Duitsland">Duitsland</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Beschrijving
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Locatie is actief
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" variant="primary">
            {location ? "Bijwerken" : "Toevoegen"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
