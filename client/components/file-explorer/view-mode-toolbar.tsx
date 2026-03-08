"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ViewMode } from "@/types/view-mode";
import { LayoutGrid, List, Table2, LayoutPanelTop } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewModeToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const viewModes: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "grid", icon: LayoutGrid, label: "Ícones" },
  { mode: "list", icon: List, label: "Lista" },
  { mode: "details", icon: Table2, label: "Detalhes" },
  { mode: "blocks", icon: LayoutPanelTop, label: "Blocos" },
];

export function ViewModeToolbar({ viewMode, onViewModeChange }: ViewModeToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 rounded-xl border bg-card/50 backdrop-blur-sm p-1">
        {viewModes.map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  viewMode === mode
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onViewModeChange(mode)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
