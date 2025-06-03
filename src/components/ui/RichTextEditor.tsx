"use client";

import { useState, useRef, useEffect } from "react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

// Custom numbered list icon component
const NumberedListIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

interface CustomFont {
  name: string;
  family: string;
  url?: string;
  file?: File;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  showPreview?: boolean;
  allowFileUpload?: boolean;
  templateVariables?: string[];
  allowFontCustomization?: boolean;
  customFonts?: CustomFont[];
  onFontUpload?: (font: File) => Promise<string>; // Returns font URL
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Begin met typen...",
  className = "",
  minHeight = 200,
  maxHeight = 600,
  showPreview = true,
  allowFileUpload = false,
  templateVariables = [],
  allowFontCustomization = false,
  customFonts = [],
  onFontUpload,
}: RichTextEditorProps) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showVariables, setShowVariables] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(minHeight);

  // Font customization state
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(14);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [uploadedFonts, setUploadedFonts] = useState<CustomFont[]>(customFonts);
  const [isUploadingFont, setIsUploadingFont] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);

  // Available system fonts
  const systemFonts = [
    { name: "Inter (Standaard)", family: "Inter, sans-serif" },
    { name: "Arial", family: "Arial, sans-serif" },
    { name: "Helvetica", family: "Helvetica, sans-serif" },
    { name: "Times New Roman", family: "Times New Roman, serif" },
    { name: "Georgia", family: "Georgia, serif" },
    { name: "Courier New", family: "Courier New, monospace" },
    { name: "Verdana", family: "Verdana, sans-serif" },
    { name: "Trebuchet MS", family: "Trebuchet MS, sans-serif" },
    { name: "Palatino", family: "Palatino, serif" },
    { name: "Impact", family: "Impact, sans-serif" },
  ];

  const fontSizes = [
    10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 64,
  ];

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = `${minHeight}px`;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, minHeight, maxHeight]);

  // Insert formatting at cursor position
  const insertFormat = (startTag: string, endTag: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText;
    if (selectedText) {
      // Wrap selected text
      newText =
        value.substring(0, start) +
        startTag +
        selectedText +
        endTag +
        value.substring(end);
    } else {
      // Insert at cursor
      newText =
        value.substring(0, start) + startTag + endTag + value.substring(end);
    }

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = selectedText
          ? start + startTag.length + selectedText.length + endTag.length
          : start + startTag.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Insert template variable
  const insertVariable = (variable: string) => {
    insertFormat(`{{${variable}}}`);
    setShowVariables(false);
  };

  // Render formatted preview
  const renderPreview = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>")
      .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>");
  };

  const toolbarButtons = [
    {
      icon: BoldIcon,
      label: "Vet",
      action: () => insertFormat("**", "**"),
      shortcut: "Ctrl+B",
    },
    {
      icon: ItalicIcon,
      label: "Cursief",
      action: () => insertFormat("*", "*"),
      shortcut: "Ctrl+I",
    },
    {
      icon: UnderlineIcon,
      label: "Onderstrepen",
      action: () => insertFormat("__", "__"),
      shortcut: "Ctrl+U",
    },
    {
      icon: ListBulletIcon,
      label: "Opsomming",
      action: () => insertFormat("\n- ", ""),
    },
    {
      icon: NumberedListIcon,
      label: "Genummerde lijst",
      action: () => insertFormat("\n1. ", ""),
    },
    {
      icon: LinkIcon,
      label: "Link",
      action: () => insertFormat("[link tekst](url)", ""),
    },
    {
      icon: CodeBracketIcon,
      label: "Code",
      action: () => insertFormat("`", "`"),
    },
  ];

  // Handle custom font upload
  const handleFontUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [".woff", ".woff2", ".ttf", ".otf"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!validTypes.includes(fileExtension)) {
      alert("Alleen .woff, .woff2, .ttf en .otf bestanden zijn toegestaan");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert("Bestand mag maximaal 5MB groot zijn");
      return;
    }

    setIsUploadingFont(true);

    try {
      let fontUrl: string;

      if (onFontUpload) {
        // Use custom upload handler
        fontUrl = await onFontUpload(file);
      } else {
        // Create local URL for preview
        fontUrl = URL.createObjectURL(file);
      }

      const fontName = file.name.replace(/\.[^/.]+$/, "");
      const customFont: CustomFont = {
        name: fontName,
        family: fontName,
        url: fontUrl,
        file: file,
      };

      // Load font using CSS Font Loading API
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);

      setUploadedFonts((prev) => [...prev, customFont]);
      setSelectedFont(fontName);

      // Clear input
      if (fontInputRef.current) {
        fontInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Font upload error:", error);
      alert("Er ging iets mis bij het uploaden van de font");
    } finally {
      setIsUploadingFont(false);
    }
  };

  return (
    <div
      className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              onClick={button.action}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
              title={`${button.label} (${button.shortcut || ""})`}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Font Controls */}
          {allowFontCustomization && (
            <>
              <div className="flex items-center space-x-2">
                {/* Font Family */}
                <div className="relative">
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 min-w-[120px]"
                    style={{
                      fontFamily:
                        systemFonts.find((f) => f.name.includes(selectedFont))
                          ?.family ||
                        uploadedFonts.find((f) => f.name === selectedFont)
                          ?.family,
                    }}
                  >
                    <optgroup label="Systeem Fonts">
                      {systemFonts.map((font) => (
                        <option key={font.name} value={font.name.split(" ")[0]}>
                          {font.name}
                        </option>
                      ))}
                    </optgroup>
                    {uploadedFonts.length > 0 && (
                      <optgroup label="Geüploade Fonts">
                        {uploadedFonts.map((font) => (
                          <option key={font.name} value={font.name}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Font Size */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Verkleinen"
                  >
                    -
                  </button>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-1 py-1 w-16 text-center"
                  >
                    {fontSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setFontSize(Math.min(64, fontSize + 1))}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Vergroten"
                  >
                    +
                  </button>
                </div>

                {/* Font Panel Toggle */}
                <button
                  onClick={() => setShowFontPanel(!showFontPanel)}
                  className={`p-2 rounded-md transition-colors ${
                    showFontPanel
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                  title="Font instellingen"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            </>
          )}

          {/* Template Variables */}
          {templateVariables.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                🏷️ Variabelen
              </button>

              {showVariables && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Beschikbare Variabelen
                    </h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {templateVariables.map((variable) => (
                      <button
                        key={variable}
                        onClick={() => insertVariable(variable)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-600 px-1 rounded">
                          {`{{${variable}}}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          {allowFileUpload && (
            <>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
              <button
                onClick={() => {
                  /* File upload logic */
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                title="Afbeelding uploaden"
              >
                <PhotoIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  /* Document upload logic */
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                title="Document uploaden"
              >
                <DocumentTextIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Preview Toggle */}
        {showPreview && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                previewMode
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              }`}
            >
              <EyeIcon className="h-4 w-4 inline mr-1" />
              {previewMode ? "Bewerken" : "Voorbeeld"}
            </button>
          </div>
        )}
      </div>

      {/* Font Panel */}
      {allowFontCustomization && showFontPanel && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Font Upload */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                🔤 Custom Font Uploaden
              </h4>
              <div className="space-y-3">
                <input
                  ref={fontInputRef}
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  onChange={handleFontUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fontInputRef.current?.click()}
                  disabled={isUploadingFont}
                  className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-center space-y-2"
                >
                  <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isUploadingFont
                      ? "Uploading..."
                      : "Klik om font te uploaden"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    .woff, .woff2, .ttf, .otf (max 5MB)
                  </span>
                </button>
              </div>
            </div>

            {/* Font Preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                👁️ Font Voorbeeld
              </h4>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <p
                  className="text-gray-900 dark:text-white"
                  style={{
                    fontFamily:
                      systemFonts.find((f) => f.name.includes(selectedFont))
                        ?.family ||
                      uploadedFonts.find((f) => f.name === selectedFont)
                        ?.family,
                    fontSize: `${fontSize}px`,
                  }}
                >
                  The quick brown fox jumps over the lazy dog.
                  <br />
                  <span className="font-bold">Vette tekst</span> en{" "}
                  <span className="italic">cursieve tekst</span>.
                  <br />
                  1234567890 !@#$%^&*()
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Fonts List */}
          {uploadedFonts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                📁 Geüploade Fonts
              </h4>
              <div className="flex flex-wrap gap-2">
                {uploadedFonts.map((font) => (
                  <div
                    key={font.name}
                    className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2"
                  >
                    <span
                      className="text-sm"
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </span>
                    <button
                      onClick={() => {
                        setUploadedFonts((prev) =>
                          prev.filter((f) => f.name !== font.name)
                        );
                        if (selectedFont === font.name) {
                          setSelectedFont("Inter");
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="Font verwijderen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor/Preview Content */}
      <div className="relative">
        {previewMode ? (
          <div
            className="p-4 prose prose-sm max-w-none dark:prose-invert"
            style={{
              minHeight: `${textareaHeight}px`,
              fontFamily:
                systemFonts.find((f) => f.name.includes(selectedFont))
                  ?.family ||
                uploadedFonts.find((f) => f.name === selectedFont)?.family,
              fontSize: `${fontSize}px`,
            }}
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none"
            style={{
              height: `${textareaHeight}px`,
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
              fontFamily:
                systemFonts.find((f) => f.name.includes(selectedFont))
                  ?.family ||
                uploadedFonts.find((f) => f.name === selectedFont)?.family,
              fontSize: `${fontSize}px`,
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <span>{value.length} karakters</span>
          <span>{value.split("\n").length} regels</span>
          <span>{value.split(/\s+/).filter(Boolean).length} woorden</span>
          {allowFontCustomization && (
            <>
              <span>•</span>
              <span>
                {selectedFont} {fontSize}px
              </span>
            </>
          )}
        </div>
        <div className="text-xs">
          <span className="text-blue-600 dark:text-blue-400">💡 Tip:</span>
          <span className="ml-1">
            Gebruik ** voor vet, * voor cursief
            {allowFontCustomization && ", 🔤 voor fonts"}, en {`{{variabelen}}`}{" "}
            voor dynamische waarden
          </span>
        </div>
      </div>
    </div>
  );
}
