"use client";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { FilePreview } from "@/components/file-preview";
import { FileExplorer } from "@/components/file-explorer";
import { ShareDialog } from "@/components/share-dialog";
import api from "@/lib/api";
import { downloadFilesAsZip } from "@/lib/bulk-download";
import { FileItem } from "@/types/file";
import { RowSelectionState } from "@tanstack/react-table";
import axios from "axios";
import { Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function RecentPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedFiles = useMemo(
    () => files.filter((f) => rowSelection[f.id]),
    [files, rowSelection],
  );

  const fetchRecentFiles = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("user");
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/files/recent");
      setFiles(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }
      console.error("Error fetching recent files:", error);
      toast.error("Erro ao carregar arquivos recentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/files/${id}`);
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
      toast.success("Arquivo movido para lixeira");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
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
    const toastId = toast.loading(
      `Preparando ${downloadable.length} arquivo${
        downloadable.length > 1 ? "s" : ""
      }...`,
    );
    const { downloaded, failed } = await downloadFilesAsZip(
      downloadable,
      async (id) => {
        const response = await api.get(`/files/download/${id}`);
        return response.data.url as string;
      },
      `recentes-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`,
    );
    if (downloaded === 0) toast.error("Falha ao preparar downloads", { id: toastId });
    else if (failed.length === 0) toast.success(`ZIP gerado com ${downloaded} arquivo(s)`, { id: toastId });
    else toast.error(`${failed.length} arquivo(s) falharam no ZIP`, { id: toastId });
    setRowSelection({});
  };

  const handleBulkDelete = async () => {
    const count = selectedFiles.length;
    if (count === 0) return;
    const toastId = toast.loading(`Excluindo ${count} item${count > 1 ? "s" : ""}...`);
    const results = await Promise.allSettled(
      selectedFiles.map((f) => api.delete(`/files/${f.id}`)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed === 0) toast.success(`${count} item${count > 1 ? "s" : ""} excluído${count > 1 ? "s" : ""}!`, { id: toastId });
    else toast.error(`${failed} exclusão falhou`, { id: toastId });
    setRowSelection({});
    fetchRecentFiles();
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
        <Clock className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-semibold tracking-tight">Recentes</h2>
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum arquivo recente nos últimos 30 dias.</p>
          <p className="text-sm mt-2">
            Arquivos enviados ou modificados recentemente aparecerão aqui.
          </p>
        </div>
      ) : (
        <FileExplorer
          data={files}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onNavigate={() => {}}
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
