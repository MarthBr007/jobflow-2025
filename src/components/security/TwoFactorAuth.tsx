"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  KeyIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface TwoFactorAuthProps {
  userId: string;
  isEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

export default function TwoFactorAuth({
  userId,
  isEnabled,
  onStatusChange,
}: TwoFactorAuthProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"scan" | "verify" | "backup">("scan");

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setManualKey(data.manualEntryKey);
        setShowSetupModal(true);
        setStep("scan");
      } else {
        alert("Failed to setup 2FA");
      }
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      alert("Error setting up 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes);
        setStep("backup");
        onStatusChange(true);
      } else {
        const error = await response.json();
        alert(error.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      alert("Error verifying 2FA");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* 2FA Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-lg ${
                isEnabled
                  ? "bg-green-100 dark:bg-green-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              }`}
            >
              <ShieldCheckIcon
                className={`h-6 w-6 ${
                  isEnabled
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isEnabled
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </div>
            {isEnabled ? (
              <Button
                onClick={() => setShowDisableModal(true)}
                variant="destructive"
                size="sm"
              >
                Disable
              </Button>
            ) : (
              <Button
                onClick={handleSetup2FA}
                variant="primary"
                size="sm"
                loading={loading}
                leftIcon={<KeyIcon className="h-4 w-4" />}
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </div>

        {/* 2FA Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How it works
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Install an authenticator app</li>
              <li>• Scan the QR code or enter the key</li>
              <li>• Enter the 6-digit code to login</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Recommended Apps
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Google Authenticator</li>
              <li>• Microsoft Authenticator</li>
              <li>• Authy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Setup Two-Factor Authentication"
        description="Follow the steps to secure your account"
        size="lg"
      >
        <div className="space-y-6">
          {step === "scan" && (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Step 1: Scan QR Code</h3>
              {qrCode && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Manual Entry Key:</h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-sm">
                    {manualKey}
                  </code>
                  <Button
                    onClick={() => copyToClipboard(manualKey)}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <Button onClick={() => setStep("verify")} variant="primary">
                Next: Verify
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">
                  Step 2: Verify Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              <div className="max-w-xs mx-auto">
                <Input
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="123456"
                  variant="outlined"
                  className="text-center text-xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <div className="flex justify-between">
                <Button onClick={() => setStep("scan")} variant="outline">
                  Back
                </Button>
                <Button
                  onClick={handleVerify2FA}
                  variant="primary"
                  loading={loading}
                  disabled={verificationCode.length !== 6}
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  2FA Enabled Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Save these backup codes in a safe place
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Backup Codes</h4>
                  <Button
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    variant="outline"
                    size="sm"
                  >
                    {showBackupCodes ? "Hide" : "Show"}
                  </Button>
                </div>

                {showBackupCodes && (
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 p-2 rounded text-center font-mono text-sm"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  setShowSetupModal(false);
                  setStep("scan");
                  setVerificationCode("");
                }}
                variant="primary"
                className="w-full"
              >
                Complete Setup
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
