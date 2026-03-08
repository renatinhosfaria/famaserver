"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileTypeIcon } from "../file-icon";
import { FileThumbnail } from "../file-thumbnail";
import { FileContextMenu } from "../file-context-menu";
import { FolderIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useCallback } from "react";
import { FileViewProps } from "./types";
import { useItemSelection } from "./use-item-selection";

export function FileGridView({
  data,
  onDelete,
  onDownload,
  onNavigate,
  onPreview,
  onShare,
  selectedItems,
  onSelectionChange,
  thumbnailUrls,
}: FileViewProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const { handleItemClick } = useItemSelection({
    items: sortedData,
    selectedItems,
    onSelectionChange,
  });

  const handleCheckboxChange = useCallback(
    (itemId: string, checked: boolean) => {
      const newSelection = { ...selectedItems };
      if (checked) {
        newSelection[itemId] = true;
      } else {
        delete newSelection[itemId];
      }
      onSelectionChange(newSelection);
    },
    [selectedItems, onSelectionChange],
  );

  if (sortedData.length === 0) {
    return (
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="h-48 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-4 rounded-full bg-muted/50">
              <FolderIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">Pasta vazia. Arraste arquivos aqui para enviar.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
    >
      <AnimatePresence>
        {sortedData.map((item) => {
          const isSelected = !!selectedItems[item.id];
          const hasThumbnail = !!(thumbnailUrls?.[item.id]);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "group relative rounded-xl border bg-card/50 overflow-hidden cursor-pointer select-none transition-all duration-200",
                "hover:bg-muted/10 hover:shadow-md",
                isSelected && "ring-2 ring-primary",
              )}
              onClick={(e) => handleItemClick(e, item, onNavigate, onPreview)}
            >
              {/* Checkbox top-left + Context menu top-right */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                <div
                  className={cn(
                    "transition-opacity duration-150",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(value) => handleCheckboxChange(item.id, !!value)}
                    aria-label="Selecionar item"
                  />
                </div>
                <div
                  className={cn(
                    "transition-opacity duration-150",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileContextMenu
                    item={item}
                    onDelete={onDelete}
                    onDownload={onDownload}
                    onShare={onShare}
                  />
                </div>
              </div>

              {/* Thumbnail / Icon area */}
              <div className="flex items-center justify-center h-[120px] bg-muted/10">
                {item.type === "file" && hasThumbnail ? (
                  <FileThumbnail
                    file={item}
                    thumbnailUrl={thumbnailUrls?.[item.id]}
                    size="lg"
                  />
                ) : (
                  <FileTypeIcon mimeType={item.mimeType} type={item.type} size="lg" />
                )}
              </div>

              {/* Name + size */}
              <div className="p-3">
                <p className="font-medium text-sm text-foreground/90 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.type === "folder" ? "Pasta" : formatBytes(item.size)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
