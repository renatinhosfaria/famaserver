"use client";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { FilePreview } from "@/components/file-preview";
import { FileExplorer } from "@/components/file-explorer";
import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { downloadFilesAsZip } from "@/lib/bulk-download";
import { FileItem } from "@/types/file";
import { RowSelectionState } from "@tanstack/react-table";
import { FolderPlus, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Suspense } from "react";

function DriveContent() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId") || undefined;
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/files", { params: { folderId } });
      setFiles(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Clear selection when navigating to a different folder
  useEffect(() => {
    setRowSelection({});
  }, [folderId]);

  const selectedFiles = useMemo(
    () => files.filter((f) => rowSelection[f.id]),
    [files, rowSelection],
  );

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const filesToUpload = Array.from(event.target.files);
    event.target.value = "";

    const toastId = toast.loading(
      filesToUpload.length === 1
        ? `Enviando ${filesToUpload[0].name}...`
        : `Enviando ${filesToUpload.length} arquivos...`
    );

    try {
      const results = await Promise.allSettled(
        filesToUpload.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          if (folderId) formData.append("parentId", folderId);

          return api.post("/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        })
      );

      const failedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedCount === 0) {
        toast.success("Upload concluído!", { id: toastId });
      } else if (failedCount === filesToUpload.length) {
        toast.error("Erro no upload", { id: toastId });
      } else {
        toast.error(
          `Upload concluído com ${failedCount} falha${
            failedCount > 1 ? "s" : ""
          }.`,
          { id: toastId }
        );
      }

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Erro no upload do arquivo ${filesToUpload[index].name}:`,
            result.reason
          );
        }
      });

      fetchFiles();
    } catch (error) {
      console.error(error);
      toast.error("Erro no upload", { id: toastId });
    }
  };

  const handleCreateFolder = async () => {
    try {
      await api.post("/files/folder", {
        name: newFolderName,
        parentId: folderId,
      });
      setIsNewFolderOpen(false);
      setNewFolderName("");
      fetchFiles();
      toast.success("Pasta criada!");
    } catch (error) {
      toast.error("Erro ao criar pasta");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/files/${id}`);
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
      toast.success("Item excluído");
    } catch (error) {
      toast.error("Erro ao excluir item");
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const response = await api.get(`/files/download/${id}`);
      const url = response.data.url;
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleBulkDownload = async () => {
    const downloadable = selectedFiles.filter((f) => f.type === "file");
    if (downloadable.length === 0) {
      toast.info("Nenhum arquivo selecionado para baixar");
      return;
    }
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
      `drive-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`,
    );

    if (downloaded === 0) {
      toast.error("Falha ao preparar downloads", { id: toastId });
    } else if (failed.length === 0) {
      toast.success(`ZIP gerado com ${downloaded} arquivo(s)`, { id: toastId });
    } else {
      toast.error(`${failed.length} arquivo(s) falharam no ZIP`, { id: toastId });
    }
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
    if (failed === 0) {
      toast.success(`${count} item${count > 1 ? "s" : ""} excluído${count > 1 ? "s" : ""}!`, { id: toastId });
    } else {
      toast.error(`${failed} exclusão falhou`, { id: toastId });
    }
    setRowSelection({});
    fetchFiles();
  };

  const handleBulkShare = () => {
    if (selectedFiles.length === 1) {
      setShareFile(selectedFiles[0]);
    } else if (selectedFiles.length > 1) {
      toast.info("Selecione apenas 1 item para compartilhar");
    }
  };

  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);

  const handleNavigate = (id: string) => {
    router.push(`/drive?folderId=${id}`);
  };

  const onPreview = (item: FileItem) => {
    setPreviewFile({ id: item.id, name: item.name, mimeType: item.mimeType });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meu Drive</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsNewFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Nova Pasta
          </Button>
          <div className="relative">
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleUpload}
            />
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Carregando...</div>
      ) : (
        <FileExplorer
          data={files}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onNavigate={handleNavigate}
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

      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        {/* ... existing dialog content ... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Informe o nome da nova pasta para criar no diretório atual.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsNewFolderOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DrivePage() {
  return (
    <Suspense fallback={<div>Carregando Drive...</div>}>
      <DriveContent />
    </Suspense>
  );
}
