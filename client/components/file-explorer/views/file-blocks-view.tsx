"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getFileTypeInfo } from "../file-icon";
import { FileThumbnail } from "../file-thumbnail";
import { FileContextMenu } from "../file-context-menu";
import { format } from "date-fns";
import { Download, FolderIcon, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useCallback } from "react";
import { FileViewProps } from "./types";
import { useItemSelection } from "./use-item-selection";

export function FileBlocksView({
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
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
    >
      <AnimatePresence>
        {sortedData.map((item) => {
          const isSelected = !!selectedItems[item.id];
          const { label, badgeColor } = getFileTypeInfo(item.mimeType, item.type);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "group relative rounded-xl border bg-card/50 p-4 flex flex-col gap-3 cursor-pointer select-none transition-all duration-200",
                "hover:bg-muted/10 hover:shadow-md",
                isSelected && "ring-2 ring-primary",
              )}
              onClick={(e) => handleItemClick(e, item, onNavigate, onPreview)}
            >
              {/* Top row: Checkbox + Thumbnail + Name + Context menu */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 transition-opacity duration-150",
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

                <div className="flex-shrink-0">
                  <FileThumbnail
                    file={item}
                    thumbnailUrl={thumbnailUrls?.[item.id]}
                    size="md"
                  />
                </div>

                <span className="font-semibold text-sm text-foreground/90 truncate flex-1 min-w-0">
                  {item.name}
                </span>

                <div
                  className="flex-shrink-0"
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

              {/* Middle: Metadata */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Tipo:</span>
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", badgeColor)}>
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Tamanho:</span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.type === "folder" ? "-" : formatBytes(item.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Modificado:</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(new Date(item.updatedAt || item.createdAt), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
              </div>

              {/* Bottom: Action buttons */}
              <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {item.type === "file" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                    onClick={() => onDownload(item.id, item.name)}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Baixar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-lg"
                  onClick={() => onShare(item)}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
