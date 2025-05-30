import React from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "away" | "busy" | null;

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  showStatus?: boolean;
  hasStory?: boolean;
  className?: string;
  onClick?: () => void;
  fallbackColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = "",
  size = "md",
  status = null,
  showStatus = false,
  hasStory = false,
  className = "",
  onClick,
  fallbackColor = "bg-gradient-to-r from-blue-500 to-indigo-500",
}) => {
  // Size configurations based on uinkits recommendations
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-15 h-15 text-lg",
    xl: "w-20 h-20 text-xl",
  };

  // Status indicator sizes
  const statusSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
  };

  // Status colors
  const statusColors = {
    online: "bg-green-400 border-white",
    offline: "bg-gray-400 border-white",
    away: "bg-yellow-400 border-white",
    busy: "bg-red-400 border-white",
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "U";
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const avatarClasses = `
    ${sizeClasses[size]}
    relative inline-flex items-center justify-center
    rounded-full overflow-hidden
    ${hasStory ? "ring-2 ring-blue-500 ring-offset-2" : ""}
    ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
    ${className}
  `;

  return (
    <div className={avatarClasses} onClick={onClick}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center text-white font-semibold ${fallbackColor}`}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Status Indicator */}
      {showStatus && status && (
        <div
          className={`
            absolute bottom-0 right-0 
            ${statusSizes[size]} 
            ${statusColors[status]}
            rounded-full border-2
            ${size === "xs" ? "border" : "border-2"}
          `}
        />
      )}
    </div>
  );
};

export default Avatar;
