"use client";

import { useState } from "react";
import {
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  UserIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📧 Email Opstellen"
      size="xl"
    >
      <div className="space-y-8">
        {/* Contract Info - Enhanced styling */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Contract Bijlage
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                Het contract "
                <span className="font-medium">{contract.title}</span>" wordt
                automatisch als PDF bijlage toegevoegd aan deze email.
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Info - Enhanced layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 mb-3">
              <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Ontvanger
              </label>
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white pl-8">
              {contract.user.name}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 mb-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email Adres
              </label>
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white pl-8">
              {contract.user.email}
            </p>
          </div>
        </div>

        {/* Subject Field - Enhanced styling */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <label
              htmlFor="email-subject"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Email Onderwerp
            </label>
          </div>
          <div className="relative">
            <input
              type="text"
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 pl-11 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         dark:bg-gray-800 dark:text-white transition-all duration-200
                         hover:border-gray-300 dark:hover:border-gray-500"
              placeholder="Typ hier je email onderwerp..."
            />
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Content Field - Enhanced text area */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <label
              htmlFor="email-content"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Email Bericht
            </label>
          </div>
          <div className="relative">
            <textarea
              id="email-content"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         dark:bg-gray-800 dark:text-white resize-none transition-all duration-200
                         hover:border-gray-300 dark:hover:border-gray-500 leading-relaxed"
              placeholder="Schrijf hier je persoonlijke bericht...

Bijvoorbeeld:
- Begroeting aan de ontvanger
- Context over het contract  
- Instructies voor ondertekening
- Contactinformatie voor vragen
- Professionele afsluiting"
              style={{ fontFamily: '"Inter", -apple-system, sans-serif' }}
            />
          </div>
        </div>

        {/* Enhanced Tips Section */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                💡 Schrijftips voor Professionele Emails
              </h5>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li>
                  • <strong>Persoonlijke aansprekking:</strong> Gebruik de naam
                  van de ontvanger
                </li>
                <li>
                  • <strong>Duidelijke context:</strong> Vermeld de naam van het
                  contract
                </li>
                <li>
                  • <strong>Professionele toon:</strong> Houdt de tekst beleefd
                  en formeel
                </li>
                <li>
                  • <strong>Call-to-action:</strong> Geef duidelijke instructies
                  wat er moet gebeuren
                </li>
                <li>
                  • <strong>Contactinfo:</strong> Bied altijd een manier om
                  contact op te nemen
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enhanced Actions */}
        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            leftIcon={<XMarkIcon className="h-4 w-4" />}
            className="px-6 py-3"
          >
            Annuleren
          </Button>

          <Button
            variant="primary"
            onClick={handleSend}
            loading={loading}
            disabled={!subject.trim() || !content.trim()}
            leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
            className="px-8 py-3 font-semibold"
          >
            {loading ? "Versturen..." : "Email Versturen"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
