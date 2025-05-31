"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { hasPermission, UserRole, PermissionLevel } from "@/lib/permissions";
import {
  ShieldExclamationIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: keyof PermissionLevel;
  requiredRole?: UserRole | UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
  showFallback?: boolean;
}

export default function PermissionGuard({
  children,
  permission,
  requiredRole,
  fallback,
  redirectTo = "/dashboard",
  showFallback = true,
}: PermissionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasAccess = () => {
    if (status === "loading") return false;
    if (!session?.user) return false;

    const userRole = session.user.role as UserRole;

    // Check specific permission
    if (permission) {
      return hasPermission(userRole, permission);
    }

    // Check required role(s)
    if (requiredRole) {
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
      }
      return userRole === requiredRole;
    }

    // Default: allow access if authenticated
    return true;
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    if (!hasAccess() && !showFallback) {
      router.push(redirectTo);
    }
  }, [session, status, router, redirectTo, showFallback]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!session?.user) {
    return null; // Will redirect to login
  }

  // Has access
  if (hasAccess()) {
    return <>{children}</>;
  }

  // No access - show fallback or redirect
  if (showFallback) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                <ShieldExclamationIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Geen Toegang
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Je hebt geen rechten om deze pagina te bekijken.
                {permission && (
                  <span className="block mt-2 text-sm">
                    Vereiste permissie:{" "}
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      {permission}
                    </code>
                  </span>
                )}
                {requiredRole && (
                  <span className="block mt-2 text-sm">
                    Vereiste rol:{" "}
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      {Array.isArray(requiredRole)
                        ? requiredRole.join(", ")
                        : requiredRole}
                    </code>
                  </span>
                )}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push(redirectTo)}
                  variant="primary"
                  size="lg"
                  leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                  className="w-full"
                >
                  Terug naar Dashboard
                </Button>

                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Vorige Pagina
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Hulp nodig?</strong>
                  <br />
                  Neem contact op met je manager of administrator als je denkt
                  dat je toegang zou moeten hebben tot deze functie.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    );
  }

  return null; // Will redirect
}
