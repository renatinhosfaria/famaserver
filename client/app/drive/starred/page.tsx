"use client";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { FilePreview } from "@/components/file-preview";
import { FileExplorer } from "@/components/file-explorer";
import { ShareDialog } from "@/components/share-dialog";
import api from "@/lib/api";
import { FileItem } from "@/types/file";
import { RowSelectionState } from "@tanstack/react-table";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function StarredPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedFiles = useMemo(
    () => files.filter((f) => rowSelection[f.id]),
    [files, rowSelection],
  );

  const fetchStarredFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get("/files/starred");
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching starred files:", error);
      toast.error("Erro ao carregar favoritos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarredFiles();
  }, []);

  const handleToggleStar = async (id: string) => {
    try {
      await api.post(`/files/starred/${id}`);
      // Remove da lista após toggle (já que estamos na página de favoritos)
      setFiles(files.filter((f) => f.id !== id));
      toast.success("Removido dos favoritos");
    } catch (error) {
      toast.error("Erro ao atualizar favorito");
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const response = await api.get(`/files/download/${id}`);
      const { url } = response.data;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleBulkDownload = async () => {
    const downloadable = selectedFiles.filter((f) => f.type === "file");
    if (downloadable.length === 0) return;
    const toastId = toast.loading(`Baixando ${downloadable.length} arquivo${downloadable.length > 1 ? "s" : ""}...`);
    const results = await Promise.allSettled(
      downloadable.map((f) => handleDownload(f.id, f.name)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed === 0) toast.success("Downloads concluídos!", { id: toastId });
    else toast.error(`${failed} download${failed > 1 ? "s" : ""} falhou`, { id: toastId });
    setRowSelection({});
  };

  const handleBulkDelete = async () => {
    const count = selectedFiles.length;
    if (count === 0) return;
    const toastId = toast.loading(`Removendo ${count} favorito${count > 1 ? "s" : ""}...`);
    const results = await Promise.allSettled(
      selectedFiles.map((f) => handleToggleStar(f.id)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed === 0) toast.success(`${count} favorito${count > 1 ? "s" : ""} removido${count > 1 ? "s" : ""}!`, { id: toastId });
    else toast.error(`${failed} remoção falhou`, { id: toastId });
    setRowSelection({});
  };

  const handleBulkShare = () => {
    if (selectedFiles.length === 1) setShareFile(selectedFiles[0]);
    else if (selectedFiles.length > 1) toast.info("Selecione apenas 1 item para compartilhar");
  };

  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);

  const onPreview = (item: FileItem) => {
    setPreviewFile({ id: item.id, name: item.name, mimeType: item.mimeType });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-semibold tracking-tight">Favoritos</h2>
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum arquivo favoritado ainda.</p>
          <p className="text-sm mt-2">
            Clique na estrela de um arquivo para adicioná-lo aos favoritos.
          </p>
        </div>
      ) : (
        <FileExplorer
          data={files}
          onDelete={handleToggleStar}
          onDownload={handleDownload}
          onNavigate={(id) => router.push(`/drive?folderId=${id}`)}
          onPreview={onPreview}
          onShare={setShareFile}
          selectedItems={rowSelection}
          onSelectionChange={setRowSelection}
        />
      )}

      {previewFile && (
        <FilePreview
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileId={previewFile.id}
          fileName={previewFile.name}
          mimeType={previewFile.mimeType}
        />
      )}

      {shareFile && (
        <ShareDialog
          isOpen={!!shareFile}
          onClose={() => setShareFile(null)}
          fileId={shareFile.id}
          fileName={shareFile.name}
        />
      )}

      <BulkActionBar
        selectedCount={selectedFiles.length}
        onBulkDownload={handleBulkDownload}
        onBulkShare={handleBulkShare}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setRowSelection({})}
      />
    </div>
  );
}
