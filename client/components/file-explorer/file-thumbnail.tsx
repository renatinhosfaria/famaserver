"use client";

import { FileItem } from "@/types/file";
import { FileTypeIcon } from "./file-icon";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FileThumbnailProps {
  file: FileItem;
  thumbnailUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-20 h-20",
  lg: "w-32 h-32",
};

export function FileThumbnail({ file, thumbnailUrl, size = "md", className }: FileThumbnailProps) {
  const [error, setError] = useState(false);

  // Show thumbnail image if URL is available and no error
  if (thumbnailUrl && !error) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-muted/30", sizeClasses[size], className)}>
        <img
          src={thumbnailUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Fallback to icon
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <FileTypeIcon mimeType={file.mimeType} type={file.type} size={size} />
    </div>
  );
}
