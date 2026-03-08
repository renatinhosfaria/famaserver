"use client";

import {
  FileIcon as LucideFileIcon,
  FileText,
  FolderIcon,
  Image,
  Music,
  Sheet,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileIconProps {
  mimeType: string;
  type: "file" | "folder";
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getIconConfig(mimeType: string, type: string) {
  if (type === "folder") {
    return {
      icon: FolderIcon,
      bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      fillClass: "fill-blue-500/20",
      label: "Pasta",
    };
  }
  if (mimeType.includes("pdf")) {
    return {
      icon: FileText,
      bgClass: "bg-red-500/10 text-red-600 dark:text-red-400",
      fillClass: "",
      label: "PDF",
    };
  }
  if (mimeType.includes("image")) {
    return {
      icon: Image,
      bgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      fillClass: "",
      label: "Imagem",
    };
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return {
      icon: Sheet,
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      fillClass: "",
      label: "Planilha",
    };
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return {
      icon: FileText,
      bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      fillClass: "",
      label: "Documento",
    };
  }
  if (mimeType.includes("video")) {
    return {
      icon: Video,
      bgClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      fillClass: "",
      label: "Video",
    };
  }
  if (mimeType.includes("audio")) {
    return {
      icon: Music,
      bgClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      fillClass: "",
      label: "Audio",
    };
  }
  return {
    icon: LucideFileIcon,
    bgClass: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
    fillClass: "",
    label: "Arquivo",
  };
}

const sizeMap = {
  sm: { container: "p-1.5 rounded-lg", icon: "h-4 w-4" },
  md: { container: "p-2 rounded-xl", icon: "h-5 w-5" },
  lg: { container: "p-3 rounded-xl", icon: "h-8 w-8" },
};

export function FileTypeIcon({ mimeType, type, size = "md", className }: FileIconProps) {
  const config = getIconConfig(mimeType, type);
  const Icon = config.icon;
  const sizeConfig = sizeMap[size];

  return (
    <div className={cn(sizeConfig.container, config.bgClass, "transition-colors duration-200", className)}>
      <Icon className={cn(sizeConfig.icon, config.fillClass)} />
    </div>
  );
}

// Also export the helper for getting type info (label + color for badges)
export function getFileTypeInfo(mimeType: string, type: string) {
  const config = getIconConfig(mimeType, type);
  // Return badge-style colors matching existing file-table.tsx patterns
  let badgeColor = "bg-zinc-100/50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400";

  if (type === "folder") badgeColor = "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  else if (mimeType.includes("pdf")) badgeColor = "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  else if (mimeType.includes("image")) badgeColor = "bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
  else if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) badgeColor = "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  else if (mimeType.includes("word") || mimeType.includes("document")) badgeColor = "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  else if (mimeType.includes("video")) badgeColor = "bg-orange-100/50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  else if (mimeType.includes("audio")) badgeColor = "bg-pink-100/50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";

  return { label: config.label, badgeColor };
}
