"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ComputerDesktopIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function KioskLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simple password check for kiosk access
      if (password === "kiosk2025") {
        router.push("/dashboard/kiosk");
      } else {
        setError("Ongeldig wachtwoord");
      }
    } catch (error) {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <ComputerDesktopIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kiosk Dashboard
          </h1>
          <p className="text-gray-600">JobFlow 2025 - Aanwezigheid Systeem</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <BuildingOfficeIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Toegang Vereist
            </h2>
            <p className="text-gray-600">
              Voer het kiosk wachtwoord in om toegang te krijgen tot het
              aanwezigheid dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                label="Kiosk Wachtwoord"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Voer kiosk wachtwoord in"
                variant="outlined"
                inputSize="lg"
                leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || !password}
            >
              {loading ? "Controleren..." : "Toegang Verkrijgen"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>Voor technische ondersteuning:</p>
              <p className="font-medium">Contact IT afdeling</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <ComputerDesktopIcon className="h-5 w-5 mr-2 text-blue-600" />
            Gebruiksinstructies
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Dit is een tablet/kiosk interface voor medewerkers</li>
            <li>• Medewerkers kunnen zichzelf in- en uitklokken</li>
            <li>• Ziek melden en verlof aanvragen is mogelijk</li>
            <li>• Real-time overzicht van aanwezige medewerkers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
