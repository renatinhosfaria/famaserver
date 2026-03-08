"use client";

import { FileItem } from "@/types/file";
import { ViewMode } from "@/types/view-mode";
import { useViewMode } from "@/hooks/use-view-mode";
import { RowSelectionState } from "@tanstack/react-table";
import { useMemo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ViewModeToolbar } from "./view-mode-toolbar";
import { FileDetailsView } from "./views/file-details-view";
import { FileListView } from "./views/file-list-view";
import { FileGridView } from "./views/file-grid-view";
import { FileBlocksView } from "./views/file-blocks-view";
import { FileViewProps } from "./views/types";
import api from "@/lib/api";

interface FileExplorerProps {
  data: FileItem[];
  onDelete: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  onNavigate: (id: string) => void;
  onPreview?: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  selectedItems: RowSelectionState;
  onSelectionChange: (selection: RowSelectionState) => void;
  isPublicView?: boolean;
}

const viewComponents: Record<ViewMode, React.ComponentType<FileViewProps>> = {
  grid: FileGridView,
  list: FileListView,
  details: FileDetailsView,
  blocks: FileBlocksView,
};

export function FileExplorer({
  data,
  onDelete,
  onDownload,
  onNavigate,
  onPreview,
  onShare,
  selectedItems,
  onSelectionChange,
  isPublicView = false,
}: FileExplorerProps) {
  const { viewMode, setViewMode } = useViewMode();
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  // Sort data: folders first, then alphabetical
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  // Batch fetch thumbnail URLs for image files
  useEffect(() => {
    const imageFiles = data.filter(
      (f) => f.type === "file" && f.mimeType?.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setThumbnailUrls({});
      return;
    }

    const ids = imageFiles.map((f) => f.id);

    const endpoint = isPublicView ? "/files/public/thumbnails" : "/files/thumbnails";
    api.post(endpoint, { ids })
      .then((res) => {
        setThumbnailUrls(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch thumbnail URLs:", err);
      });
  }, [data, isPublicView]);

  const ActiveView = viewComponents[viewMode];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ViewModeToolbar viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <ActiveView
            data={sortedData}
            onDelete={onDelete}
            onDownload={onDownload}
            onNavigate={onNavigate}
            onPreview={onPreview}
            onShare={onShare}
            selectedItems={selectedItems}
            onSelectionChange={onSelectionChange}
            thumbnailUrls={thumbnailUrls}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
