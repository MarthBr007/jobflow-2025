"use client";

import { useState, useRef, useCallback } from "react";
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  TableCellsIcon,
  ListBulletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CodeBracketIcon,
  Squares2X2Icon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";

interface TemplateBlock {
  id: string;
  type:
    | "text"
    | "image"
    | "table"
    | "list"
    | "variable"
    | "signature"
    | "header"
    | "footer";
  content: any;
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    padding?: number;
    margin?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    border?: string;
    borderRadius?: number;
    width?: string;
    height?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VisualTemplateBuilderProps {
  initialBlocks?: TemplateBlock[];
  onSave?: (blocks: TemplateBlock[]) => void;
  templateVariables?: string[];
  availableImages?: { id: string; url: string; name: string }[];
  onImageUpload?: (file: File) => Promise<string>;
}

export default function VisualTemplateBuilder({
  initialBlocks = [],
  onSave,
  templateVariables = [],
  availableImages = [],
  onImageUpload,
}: VisualTemplateBuilderProps) {
  const [blocks, setBlocks] = useState<TemplateBlock[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<TemplateBlock | null>(null);
  const [showCodeView, setShowCodeView] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block templates
  const blockTemplates = [
    {
      type: "text" as const,
      label: "Tekst",
      icon: DocumentTextIcon,
      defaultContent: "Voer hier uw tekst in...",
    },
    {
      type: "image" as const,
      label: "Afbeelding",
      icon: PhotoIcon,
      defaultContent: { src: "", alt: "Afbeelding", caption: "" },
    },
    {
      type: "table" as const,
      label: "Tabel",
      icon: TableCellsIcon,
      defaultContent: {
        rows: 3,
        cols: 3,
        data: Array(3).fill(Array(3).fill("")),
      },
    },
    {
      type: "list" as const,
      label: "Lijst",
      icon: ListBulletIcon,
      defaultContent: { items: ["Item 1", "Item 2", "Item 3"], ordered: false },
    },
    {
      type: "variable" as const,
      label: "Variabele",
      icon: CodeBracketIcon,
      defaultContent: { variable: "", label: "" },
    },
    {
      type: "signature" as const,
      label: "Handtekening",
      icon: PaintBrushIcon,
      defaultContent: { type: "signature", label: "Handtekening" },
    },
  ];

  // Create new block
  const createBlock = useCallback(
    (type: TemplateBlock["type"], position?: { x: number; y: number }) => {
      const template = blockTemplates.find((t) => t.type === type);
      if (!template) return;

      const newBlock: TemplateBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: template.defaultContent,
        style: {
          fontSize: 14,
          fontFamily: "Inter, sans-serif",
          color: "#000000",
          backgroundColor: "transparent",
          padding: 10,
          margin: 5,
          textAlign: "left",
          width: "auto",
          height: "auto",
        },
        position: {
          x: position?.x || 50,
          y: position?.y || 50,
          width: type === "image" ? 200 : 300,
          height: type === "image" ? 150 : 100,
        },
      };

      setBlocks((prev) => [...prev, newBlock]);
      setSelectedBlock(newBlock.id);
    },
    [blockTemplates]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (block: TemplateBlock, e: React.DragEvent) => {
      setDraggedBlock(block);
      setIsDragging(true);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  // Handle drop on canvas
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!canvasRef.current || !draggedBlock) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setBlocks((prev) =>
        prev.map((block) =>
          block.id === draggedBlock.id
            ? { ...block, position: { ...block.position, x, y } }
            : block
        )
      );

      setIsDragging(false);
      setDraggedBlock(null);
    },
    [draggedBlock]
  );

  // Handle new block drop
  const handleNewBlockDrop = useCallback(
    (type: TemplateBlock["type"], e: React.DragEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      createBlock(type, { x, y });
    },
    [createBlock]
  );

  // Update block content
  const updateBlockContent = useCallback((blockId: string, content: any) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, content } : block
      )
    );
  }, []);

  // Update block style
  const updateBlockStyle = useCallback(
    (blockId: string, style: Partial<TemplateBlock["style"]>) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId
            ? { ...block, style: { ...block.style, ...style } }
            : block
        )
      );
    },
    []
  );

  // Delete block
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
    setSelectedBlock(null);
  }, []);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const imageUrl = await onImageUpload(file);

      // Create image block with uploaded image
      createBlock("image");

      // Update the latest image block with the uploaded image
      setTimeout(() => {
        const latestBlock = blocks[blocks.length - 1];
        if (latestBlock && latestBlock.type === "image") {
          updateBlockContent(latestBlock.id, {
            src: imageUrl,
            alt: file.name,
            caption: file.name,
          });
        }
      }, 100);
    } catch (error) {
      console.error("Image upload failed:", error);
    }
  };

  // Render block based on type
  const renderBlock = (block: TemplateBlock) => {
    const isSelected = selectedBlock === block.id;
    const style = {
      position: "absolute" as const,
      left: block.position.x,
      top: block.position.y,
      width: block.position.width,
      minHeight: block.position.height,
      border: isSelected ? "2px solid #3b82f6" : "1px solid transparent",
      borderRadius: block.style.borderRadius || 4,
      padding: block.style.padding,
      margin: block.style.margin,
      backgroundColor: block.style.backgroundColor,
      color: block.style.color,
      fontSize: block.style.fontSize,
      fontFamily: block.style.fontFamily,
      textAlign: block.style.textAlign,
      cursor: "move",
    };

    const content = (() => {
      switch (block.type) {
        case "text":
          return (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                updateBlockContent(block.id, e.currentTarget.textContent)
              }
              className="outline-none"
            >
              {block.content}
            </div>
          );

        case "image":
          return (
            <div className="relative group">
              {block.content.src ? (
                <img
                  src={block.content.src}
                  alt={block.content.alt}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              {block.content.caption && (
                <div className="text-xs text-gray-600 mt-1 text-center">
                  {block.content.caption}
                </div>
              )}
            </div>
          );

        case "table":
          return (
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {Array(block.content.rows)
                  .fill(0)
                  .map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array(block.content.cols)
                        .fill(0)
                        .map((_, colIndex) => (
                          <td
                            key={colIndex}
                            className="border border-gray-300 p-2"
                            contentEditable
                            suppressContentEditableWarning
                          >
                            {block.content.data[rowIndex]?.[colIndex] || ""}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          );

        case "list":
          const ListTag = block.content.ordered ? "ol" : "ul";
          return (
            <ListTag
              className={
                block.content.ordered ? "list-decimal pl-5" : "list-disc pl-5"
              }
            >
              {block.content.items.map((item: string, index: number) => (
                <li key={index} className="mb-1">
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = e.currentTarget.textContent || "";
                      updateBlockContent(block.id, {
                        ...block.content,
                        items: newItems,
                      });
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ListTag>
          );

        case "variable":
          return (
            <div className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded inline-block">
              <span className="text-yellow-800 dark:text-yellow-200 font-mono text-sm">
                {block.content.variable
                  ? `{{${block.content.variable}}}`
                  : "Selecteer variabele"}
              </span>
            </div>
          );

        case "signature":
          return (
            <div className="border-2 border-dashed border-gray-300 p-4 text-center">
              <PaintBrushIcon className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Handtekening veld</span>
            </div>
          );

        default:
          return <div>Onbekend blok type</div>;
      }
    })();

    return (
      <div
        key={block.id}
        style={style}
        onClick={() => setSelectedBlock(block.id)}
        draggable
        onDragStart={(e) => handleDragStart(block, e)}
        className="hover:shadow-lg transition-shadow"
      >
        {content}

        {/* Block controls */}
        {isSelected && (
          <div className="absolute -top-8 left-0 flex space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg px-2 py-1">
            <button
              onClick={() => deleteBlock(block.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Verwijderen"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visual Template Builder
          </h3>

          {/* Block Templates */}
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Template Blokken
            </h4>
            {blockTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("blockType", template.type);
                  }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => createBlock(template.type)}
                >
                  <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {template.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Snelle Acties
            </h4>
            <button
              onClick={() => setShowImagePanel(true)}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <PhotoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Afbeelding Uploaden
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Logo Toevoegen
              </span>
            </button>
          </div>

          {/* Variables */}
          {templateVariables.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Beschikbare Variabelen
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {templateVariables.map((variable) => (
                  <div
                    key={variable}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("variable", variable);
                    }}
                    className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded cursor-move hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                  >
                    <span className="text-xs font-mono text-yellow-800 dark:text-yellow-200">
                      {`{{${variable}}}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Template Canvas
              </h2>
              <span className="text-sm text-gray-500">
                {blocks.length} blokken
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCodeView(!showCodeView)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  showCodeView
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                }`}
              >
                <CodeBracketIcon className="h-4 w-4 inline mr-1" />
                {showCodeView ? "Visual" : "Code"}
              </button>
              <button
                onClick={() => onSave?.(blocks)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          {showCodeView ? (
            <div className="p-4">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(blocks, null, 2)}
              </pre>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="relative min-h-full w-full"
              style={{ height: "1000px", background: "#ffffff" }}
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern
                      id="grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#000"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Render blocks */}
              {blocks.map(renderBlock)}

              {/* Drop zone indicator */}
              {isDragging && (
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-600 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Sleep hier om blok te plaatsen
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedBlock && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚙️ Blok Eigenschappen
            </h3>

            {/* Block styling controls would go here */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Grootte
                </label>
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={
                    blocks.find((b) => b.id === selectedBlock)?.style
                      .fontSize || 14
                  }
                  onChange={(e) =>
                    updateBlockStyle(selectedBlock, {
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tekst Kleur
                </label>
                <input
                  type="color"
                  value={
                    blocks.find((b) => b.id === selectedBlock)?.style.color ||
                    "#000000"
                  }
                  onChange={(e) =>
                    updateBlockStyle(selectedBlock, { color: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
