"use client";

import { Button } from "@/components/ui/button";
import { Download, Share2, Trash, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionBarProps {
  selectedCount: number;
  onBulkDownload: () => void;
  onBulkShare: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  onBulkDownload,
  onBulkShare,
  onBulkDelete,
  onClearSelection,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-card border rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-foreground/80 mr-2">
              {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
            </span>

            <div className="h-5 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDownload}
              className="rounded-xl gap-1.5"
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkShare}
              className="rounded-xl gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              className="rounded-xl gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash className="h-4 w-4" />
              Excluir
            </Button>

            <div className="h-5 w-px bg-border" />

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="rounded-xl h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
