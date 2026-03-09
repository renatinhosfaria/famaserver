"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileTypeIcon, getFileTypeInfo } from "../file-icon";
import { FileContextMenu } from "../file-context-menu";
import { format } from "date-fns";
import { FolderIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useCallback } from "react";
import { FileViewProps } from "./types";
import { useItemSelection } from "./use-item-selection";

export function FileListView({
  data,
  onDelete,
  onDownload,
  onNavigate,
  onPreview,
  onShare,
  selectedItems,
  onSelectionChange,
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

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const newSelection: Record<string, boolean> = {};
        sortedData.forEach((item) => {
          newSelection[item.id] = true;
        });
        onSelectionChange(newSelection);
      } else {
        onSelectionChange({});
      }
    },
    [sortedData, onSelectionChange],
  );

  const isAllSelected = sortedData.length > 0 && sortedData.every((item) => selectedItems[item.id]);
  const isSomeSelected = sortedData.some((item) => selectedItems[item.id]) && !isAllSelected;

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
    <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 h-10 bg-muted/20 border-b border-muted/50">
        <div className="flex-shrink-0">
          <Checkbox
            checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
            onCheckedChange={(value) => handleSelectAll(!!value)}
            aria-label="Selecionar todos"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex-1 ml-7">
          Nome
        </span>
        <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider w-24 hidden sm:block">
          Tipo
        </span>
        <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider w-20 hidden md:block text-right">
          Tamanho
        </span>
        <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider w-36 hidden lg:block text-right">
          Modificado
        </span>
        <div className="w-9 flex-shrink-0" />
      </div>

      {/* List items */}
      <div className="divide-y divide-muted/30">
        <AnimatePresence>
          {sortedData.map((item) => {
            const isSelected = !!selectedItems[item.id];
            const { label, badgeColor } = getFileTypeInfo(item.mimeType, item.type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-3 px-4 h-10 transition-colors duration-200 cursor-pointer select-none",
                  "hover:bg-muted/20",
                  isSelected
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "border-l-2 border-l-transparent",
                )}
                onClick={(e) => handleItemClick(e, item, onNavigate, onPreview)}
              >
                <div className="flex-shrink-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(value) => handleCheckboxChange(item.id, !!value)}
                    aria-label="Selecionar item"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <FileTypeIcon mimeType={item.mimeType} type={item.type} size="sm" />

                <span className="font-semibold text-[14px] text-foreground/90 truncate flex-1">
                  {item.name}
                </span>

                <span className={cn("text-[12px] font-medium px-2.5 py-1 rounded-md w-24 text-center hidden sm:inline-block", badgeColor)}>
                  {label}
                </span>

                <span className="text-[13px] text-muted-foreground font-medium w-20 text-right hidden md:block">
                  {item.type === "folder" ? "-" : formatBytes(item.size)}
                </span>

                <span className="text-[13px] text-muted-foreground font-medium w-36 text-right hidden lg:block">
                  {format(new Date(item.updatedAt || item.createdAt), "dd MMM yyyy, HH:mm")}
                </span>

                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <FileContextMenu
                    item={item}
                    onDelete={onDelete}
                    onDownload={onDownload}
                    onShare={onShare}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
