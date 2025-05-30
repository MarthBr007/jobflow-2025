import React from "react";
import Avatar, { AvatarSize } from "./Avatar";

interface TeamMember {
  id: string;
  name: string;
  src?: string;
  status?: "online" | "offline" | "away" | "busy";
}

interface AvatarStackProps {
  members: TeamMember[];
  size?: AvatarSize;
  maxVisible?: number;
  showStatus?: boolean;
  className?: string;
  onMemberClick?: (member: TeamMember) => void;
  onMoreClick?: () => void;
}

const AvatarStack: React.FC<AvatarStackProps> = ({
  members,
  size = "sm",
  maxVisible = 3,
  showStatus = false,
  className = "",
  onMemberClick,
  onMoreClick,
}) => {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);

  // Spacing based on size
  const spacingClasses = {
    xs: "-space-x-1",
    sm: "-space-x-1.5",
    md: "-space-x-2",
    lg: "-space-x-2.5",
    xl: "-space-x-3",
  };

  // Plus button sizes
  const plusSizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-15 h-15 text-base",
    xl: "w-20 h-20 text-lg",
  };

  return (
    <div className={`flex items-center ${spacingClasses[size]} ${className}`}>
      {visibleMembers.map((member, index) => (
        <div
          key={member.id}
          className="relative ring-2 ring-white dark:ring-gray-800 rounded-full"
          style={{ zIndex: maxVisible - index }}
        >
          <Avatar
            src={member.src}
            name={member.name}
            size={size}
            status={member.status}
            showStatus={showStatus}
            onClick={() => onMemberClick?.(member)}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className="relative ring-2 ring-white dark:ring-gray-800 rounded-full"
          style={{ zIndex: 0 }}
        >
          <div
            className={`
              ${plusSizes[size]}
              bg-gray-100 dark:bg-gray-700 
              hover:bg-gray-200 dark:hover:bg-gray-600
              rounded-full flex items-center justify-center
              cursor-pointer transition-colors
              text-gray-600 dark:text-gray-300 font-medium
            `}
            onClick={onMoreClick}
          >
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarStack;
