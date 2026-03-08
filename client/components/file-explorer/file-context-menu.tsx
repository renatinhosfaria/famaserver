"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileItem } from "@/types/file";
import { Download, MoreVertical, Share2, Trash } from "lucide-react";

interface FileContextMenuProps {
  item: FileItem;
  onDelete: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  onShare: (item: FileItem) => void;
}

export function FileContextMenu({ item, onDelete, onDownload, onShare }: FileContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 p-0 rounded-xl hover:bg-muted/50 data-[state=open]:bg-muted/80"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] p-2 rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20"
      >
        {item.type === "file" && (
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDownload(item.id, item.name); }}
            className="rounded-lg cursor-pointer py-2.5"
          >
            <Download className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Baixar</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onShare(item); }}
          className="rounded-lg cursor-pointer py-2.5"
        >
          <Share2 className="mr-2.5 h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Compartilhar</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5 mt-1"
        >
          <Trash className="mr-2.5 h-4 w-4" />
          <span className="font-medium">Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
