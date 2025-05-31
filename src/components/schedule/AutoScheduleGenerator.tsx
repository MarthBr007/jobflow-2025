"use client";

import { useState } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { nl } from "date-fns/locale";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";

interface AutoScheduleGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentDate: string;
}

export default function AutoScheduleGenerator({
  isOpen,
  onClose,
  onSuccess,
  currentDate,
}: AutoScheduleGeneratorProps) {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(currentDate)
  );
  const [endDate, setEndDate] = useState<Date | null>(
    addDays(new Date(currentDate), 6)
  );
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    generatedShifts: number;
    skippedShifts: number;
    errors: string[];
    message: string;
  } | null>(null);

  const handleQuickSelect = (type: "week" | "month" | "nextWeek") => {
    const current = new Date(currentDate);
    switch (type) {
      case "week":
        setStartDate(startOfWeek(current, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(current, { weekStartsOn: 1 }));
        break;
      case "nextWeek":
        const nextWeek = addWeeks(current, 1);
        setStartDate(startOfWeek(nextWeek, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(nextWeek, { weekStartsOn: 1 }));
        break;
      case "month":
        setStartDate(new Date(current.getFullYear(), current.getMonth(), 1));
        setEndDate(new Date(current.getFullYear(), current.getMonth() + 1, 0));
        break;
    }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert("Selecteer een start- en einddatum");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/schedule/auto-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          overwriteExisting,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return (
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Automatisch Rooster Genereren"
      description="Genereer roosters op basis van vaste patronen voor medewerkers"
      size="lg"
    >
      <div className="space-y-6">
        {!result && (
          <>
            {/* Quick Select Options */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-2" />
                Snelle Selectie
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("week")}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Deze Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("nextWeek")}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Volgende Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("month")}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Deze Maand
                </Button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker
                label="Startdatum"
                value={startDate}
                onChange={setStartDate}
                placeholder="Selecteer startdatum"
                context="near-future"
                required
              />
              <DatePicker
                label="Einddatum"
                value={endDate}
                onChange={setEndDate}
                placeholder="Selecteer einddatum"
                context="near-future"
                minDate={startDate || undefined}
                required
              />
            </div>

            {/* Summary */}
            {startDate && endDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-900 dark:text-green-200">
                      📅 Periode Overzicht
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Van {format(startDate, "EEEE d MMMM", { locale: nl })} tot{" "}
                      {format(endDate, "EEEE d MMMM yyyy", { locale: nl })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {calculateDays()}
                    </span>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      dagen
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Options */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                ⚙️ Opties
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Bestaande diensten overschrijven
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Vervang bestaande diensten als er overlap is
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Let op
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Deze actie genereert automatisch diensten voor alle
                    medewerkers met vaste rooster toewijzingen.
                    {overwriteExisting &&
                      " Bestaande diensten worden overschreven."}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Annuleren
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!startDate || !endDate || loading}
                leftIcon={
                  loading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )
                }
              >
                {loading ? "Genereren..." : "Rooster Genereren"}
              </Button>
            </div>
          </>
        )}

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ✅ Rooster Gegenereerd!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {result.message}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.generatedShifts}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Aangemaakt
                </div>
              </div>

              {result.skippedShifts > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {result.skippedShifts}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    Overgeslagen
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.errors.length}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Fouten
                  </div>
                </div>
              )}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Fouten opgetreden:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={onClose}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              className="mx-auto"
            >
              Sluiten
            </Button>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
