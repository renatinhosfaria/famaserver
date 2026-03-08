import { FileItem } from "@/types/file";

export interface FileViewProps {
  data: FileItem[];
  onDelete: (id: string) => void;
  onDownload: (id: string, name: string) => void;
  onNavigate: (id: string) => void;
  onPreview?: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  selectedItems: Record<string, boolean>;
  onSelectionChange: (selection: Record<string, boolean>) => void;
  thumbnailUrls?: Record<string, string>;
}
