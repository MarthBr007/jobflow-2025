"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface AlertProps {
  type: "error" | "warning" | "success" | "info";
  message: string;
}

const Alert = ({ type, message }: AlertProps) => {
  const styles = {
    error: {
      bg: "bg-red-50 dark:bg-red-900/50",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon: (
        <svg
          className="h-5 w-5 text-red-400 dark:text-red-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/50",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
      icon: (
        <svg
          className="h-5 w-5 text-yellow-400 dark:text-yellow-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    success: {
      bg: "bg-green-50 dark:bg-green-900/50",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      icon: (
        <svg
          className="h-5 w-5 text-green-400 dark:text-green-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/50",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      icon: (
        <svg
          className="h-5 w-5 text-blue-400 dark:text-blue-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`rounded-lg border px-4 py-3 ${styles[type].bg} ${styles[type].border}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">{styles[type].icon}</div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${styles[type].text}`}>
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    type: AlertProps["type"];
    message: string;
  } | null>(null);

  useEffect(() => {
    // Check system preference and stored preference for dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const storedPreference = localStorage.getItem("darkMode");

    if (storedPreference) {
      setIsDarkMode(storedPreference === "true");
    } else {
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // Apply dark mode to HTML element and store preference
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setAlertInfo({
            type: "error",
            message: "Ongeldige inloggegevens",
          });
        } else {
          setAlertInfo({
            type: "success",
            message: "Succesvol ingelogd! Je wordt doorgestuurd...",
          });
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        }
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          throw new Error("Registratie mislukt");
        }

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setAlertInfo({
            type: "error",
            message: "Inloggen na registratie mislukt",
          });
        } else {
          setAlertInfo({
            type: "success",
            message: "Account succesvol aangemaakt! Je wordt doorgestuurd...",
          });
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        }
      }
    } catch (error) {
      setAlertInfo({
        type: "error",
        message: isLogin
          ? "Er is iets misgegaan bij het inloggen"
          : "Er is iets misgegaan bij het registreren",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`w-full max-w-md mx-auto space-y-8 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode
            ? "bg-gray-800/90 border border-gray-700/50"
            : "bg-white/90 border border-gray-200/50"
        }`}
      >
        {/* Header */}
        <div className="text-center relative">
          {/* Dark mode toggle */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 hover:scale-110 touch-manipulation ${
                isDarkMode
                  ? "text-yellow-400 hover:bg-gray-700 bg-gray-800/50"
                  : "text-orange-500 hover:bg-orange-50 bg-orange-100/50"
              }`}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`text-3xl sm:text-4xl font-bold mb-2 ${
              isDarkMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400"
                : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}
          >
            JobFlow
          </motion.h1>
          <h2
            className={`text-xl sm:text-2xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {isLogin ? "Welkom terug!" : "Maak een account aan"}
          </h2>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {isLogin
              ? "Log in om door te gaan naar je dashboard"
              : "Vul je gegevens in om te registreren"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-4">
            {!isLogin && (
              <Input
                label="Naam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="h-5 w-5" />}
                variant="outlined"
                inputSize="md"
                placeholder="Jouw volledige naam"
                required
              />
            )}

            <Input
              label="E-mailadres"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              variant="outlined"
              inputSize="md"
              placeholder="naam@bedrijf.nl"
              autoComplete="email"
              required
            />

            <Input
              label="Wachtwoord"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`transition-colors touch-manipulation p-1 rounded ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title={
                    showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"
                  }
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {isLogin && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`h-4 w-4 rounded transition-colors focus:ring-2 focus:ring-offset-2 touch-manipulation ${
                      isDarkMode
                        ? "text-blue-400 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                        : "text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-offset-white"
                    }`}
                  />
                  <label
                    htmlFor="remember-me"
                    className={`ml-2 block text-sm select-none ${
                      isDarkMode ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    Onthoud mij
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className={`font-medium transition-colors touch-manipulation ${
                      isDarkMode
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-600 hover:text-blue-500"
                    }`}
                  >
                    Wachtwoord vergeten?
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Alert */}
          {alertInfo && (
            <AnimatePresence>
              <Alert type={alertInfo.type} message={alertInfo.message} />
            </AnimatePresence>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
            className="w-full touch-manipulation"
          >
            {isLogin ? "Inloggen" : "Account aanmaken"}
          </Button>
        </form>

        {/* Toggle Login/Register */}
        <div className="text-center space-y-3 pt-4">
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full touch-manipulation"
          >
            {isLogin
              ? "Nog geen account? Registreer hier"
              : "Al een account? Log hier in"}
          </Button>

          {isLogin && (
            <div>
              <Link
                href="/register"
                className={`text-sm font-medium transition-colors block sm:inline touch-manipulation ${
                  isDarkMode
                    ? "text-green-400 hover:text-green-300"
                    : "text-green-600 hover:text-green-500"
                }`}
              >
                → Uitgebreide registratie voor medewerkers/freelancers
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
