"use client";

import { useState } from "react";
import {
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Modal from "./Modal";
import Button from "./Button";

interface Contract {
  id: string;
  title: string;
  user: {
    name: string;
    email: string;
  };
}

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onSendEmail: (
    contractId: string,
    subject: string,
    content: string
  ) => Promise<void>;
  loading: boolean;
}

export default function EmailComposer({
  isOpen,
  onClose,
  contract,
  onSendEmail,
  loading,
}: EmailComposerProps) {
  const [subject, setSubject] = useState(
    `Contract: ${contract.title} - ${contract.user.name}`
  );
  const [content, setContent] = useState(`Beste ${contract.user.name},

Hierbij ontvang je het contract "${contract.title}" ter ondertekening.

Gelieve het contract zorgvuldig door te lezen en bij akkoord te ondertekenen.

Heb je vragen? Neem dan contact met ons op.

Met vriendelijke groet,
Broers Verhuur`);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      return;
    }

    try {
      await onSendEmail(contract.id, subject.trim(), content.trim());
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Opstellen" size="xl">
      <div className="space-y-6">
        {/* Contract Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-start space-x-3">
            <DocumentTextIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Contract Bijlage
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Het contract "{contract.title}" wordt automatisch als PDF
                bijlage toegevoegd aan deze email.
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Naar:
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {contract.user.name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email:
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {contract.user.email}
            </p>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="email-subject"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Onderwerp
          </label>
          <input
            type="text"
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Email onderwerp..."
          />
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="email-content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Bericht
          </label>
          <textarea
            id="email-content"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none"
            placeholder="Schrijf hier je bericht..."
            style={{ fontFamily: "monospace" }}
          />
        </div>

        {/* Formatting Tips */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Tip:</strong> Je kunt eenvoudige opmaak gebruiken zoals
                regels overslaan en inspring voor een professionele layout.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="outline"
            onClick={onClose}
            leftIcon={<XMarkIcon className="h-4 w-4" />}
          >
            Annuleren
          </Button>

          <Button
            variant="primary"
            onClick={handleSend}
            loading={loading}
            disabled={!subject.trim() || !content.trim()}
            leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
          >
            Email Versturen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
