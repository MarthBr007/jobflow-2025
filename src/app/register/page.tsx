"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  HomeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"EMPLOYEE" | "FREELANCER">("EMPLOYEE");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
    availableDays: "",
    kvkNumber: "",
    btwNumber: "",
    iban: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Wachtwoorden komen niet overeen");
      return;
    }

    if (formData.password.length < 6) {
      alert("Wachtwoord moet minimaal 6 karakters lang zijn");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Registratie succesvol! ${
            data.message ||
            "Je account wacht op goedkeuring van een administrator."
          }`
        );
        router.push("/");
      } else {
        alert(data.error || "Er is een fout opgetreden");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Er is een fout opgetreden bij het registreren");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[{ label: "Login", href: "/" }, { label: "Registreren" }]}
          className="mb-6"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                Account Aanmaken
              </h1>
              <p className="text-blue-100 dark:text-blue-200">
                Registreer je als medewerker of freelancer
              </p>
            </div>
          </div>

          <div className="px-8 py-6">
            {/* Role Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Ik ben een:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("EMPLOYEE")}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    role === "EMPLOYEE"
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <UserIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Medewerker</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Oproepkracht of vaste medewerker
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("FREELANCER")}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    role === "FREELANCER"
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <BriefcaseIcon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Freelancer</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Zelfstandig ondernemer
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Persoonlijke Gegevens
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    label="Voornaam"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="Voornaam"
                    required
                  />

                  <Input
                    label="Achternaam"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="Achternaam"
                    required
                  />
                </div>

                <Input
                  label="E-mailadres"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="je@email.com"
                  required
                />

                <Input
                  label="Adres"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  leftIcon={<HomeIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="Straat 123, 1234 AB Plaats"
                  required
                />

                <Input
                  label="Telefoonnummer"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  leftIcon={<PhoneIcon className="h-5 w-5" />}
                  variant="outlined"
                  inputSize="md"
                  placeholder="+31 6 12345678"
                  required
                />
              </div>

              {/* Role-specific fields */}
              {role === "EMPLOYEE" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Beschikbaarheid
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Beschikbare dagen
                    </label>
                    <div className="relative">
                      <CalendarDaysIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500 z-10" />
                      <textarea
                        name="availableDays"
                        rows={3}
                        value={formData.availableDays}
                        onChange={handleInputChange}
                        className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:focus:ring-blue-400 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Bijv: Maandag t/m vrijdag, weekenden op afroep"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === "FREELANCER" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Bedrijfsgegevens
                  </h3>

                  <Input
                    label="KVK Nummer"
                    name="kvkNumber"
                    value={formData.kvkNumber}
                    onChange={handleInputChange}
                    leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="12345678"
                    required
                  />

                  <Input
                    label="BTW Nummer"
                    name="btwNumber"
                    value={formData.btwNumber}
                    onChange={handleInputChange}
                    leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="NL123456789B01"
                    required
                  />

                  <Input
                    label="IBAN"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                    leftIcon={<CreditCardIcon className="h-5 w-5" />}
                    variant="outlined"
                    inputSize="md"
                    placeholder="NL91 ABNA 0417 1643 00"
                    required
                  />
                </div>
              )}

              {/* Password fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Wachtwoord
                </h3>

                <Input
                  label="Wachtwoord"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                  variant="outlined"
                  inputSize="md"
                  placeholder="Minimaal 6 karakters"
                  helperText="Kies een sterk wachtwoord van minimaal 6 karakters"
                  required
                />

                <Input
                  label="Bevestig Wachtwoord"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                  variant="outlined"
                  inputSize="md"
                  placeholder="Herhaal je wachtwoord"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                >
                  Account Aanmaken
                </Button>
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Heb je al een account?{" "}
                <Link
                  href="/"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Inloggen
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
