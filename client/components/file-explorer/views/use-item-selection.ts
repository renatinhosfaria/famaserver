"use client";

import { useCallback, useRef } from "react";

interface UseItemSelectionProps {
  items: { id: string }[];
  selectedItems: Record<string, boolean>;
  onSelectionChange: (selection: Record<string, boolean>) => void;
}

export function useItemSelection({ items, selectedItems, onSelectionChange }: UseItemSelectionProps) {
  const lastSelectedIdRef = useRef<string | null>(null);

  const activateItem = useCallback(
    (
      item: { id: string; type: string },
      onNavigate: (id: string) => void,
      onPreview?: (item: any) => void,
    ) => {
      if (item.type === "folder") {
        onNavigate(item.id);
      } else if (onPreview) {
        onPreview(item);
      }
    },
    [],
  );

  const handleItemClick = useCallback(
    (
      e: React.MouseEvent,
      item: { id: string; type: string },
      onNavigate: (id: string) => void,
      onPreview?: (item: any) => void,
    ) => {
      const itemId = item.id;

      if (e.shiftKey && lastSelectedIdRef.current) {
        const lastIdx = items.findIndex((item) => item.id === lastSelectedIdRef.current);
        const currentIdx = items.findIndex((item) => item.id === itemId);
        if (lastIdx !== -1 && currentIdx !== -1) {
          const [start, end] = lastIdx < currentIdx ? [lastIdx, currentIdx] : [currentIdx, lastIdx];
          const newSelection = { ...selectedItems };
          for (let i = start; i <= end; i++) {
            newSelection[items[i].id] = true;
          }
          onSelectionChange(newSelection);
        }
      } else if (e.ctrlKey || e.metaKey) {
        const newSelection = { ...selectedItems };
        if (newSelection[itemId]) {
          delete newSelection[itemId];
        } else {
          newSelection[itemId] = true;
        }
        onSelectionChange(newSelection);
        lastSelectedIdRef.current = itemId;
      } else {
        // Keep item selected on repeated clicks to avoid interfering with activation
        if (!selectedItems[itemId] || Object.keys(selectedItems).length !== 1) {
          onSelectionChange({ [itemId]: true });
        }
        lastSelectedIdRef.current = itemId;
      }

      // Fallback for environments where native onDoubleClick is inconsistent
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey && e.detail === 2) {
        activateItem(item, onNavigate, onPreview);
      }
    },
    [items, selectedItems, onSelectionChange, activateItem],
  );

  return { handleItemClick };
}
