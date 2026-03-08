"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import { FileItem } from "@/types/file";
import {
  File,
  Folder,
  Loader2,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TrashPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const response = await api.get("/files/trash");
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching trash:", error);
      toast.error("Erro ao carregar lixeira");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      await api.post(`/files/trash/${id}/restore`);
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
      toast.success("Arquivo restaurado");
    } catch (error) {
      toast.error("Erro ao restaurar arquivo");
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir permanentemente "${name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/files/trash/${id}`);
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
      toast.success("Arquivo excluído permanentemente");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
    }
  };

  const handleEmptyTrash = async () => {
    if (files.length === 0) return;

    if (
      !confirm(
        "Tem certeza que deseja esvaziar a lixeira? Todos os arquivos serão excluídos permanentemente e esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      await api.delete("/files/trash");
      setFiles([]);
      toast.success("Lixeira esvaziada com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao esvaziar lixeira");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trash2 className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-semibold tracking-tight">Lixeira</h2>
        </div>
        {files.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleEmptyTrash}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Esvaziar Lixeira
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>A lixeira está vazia.</p>
          <p className="text-sm mt-2">
            Arquivos excluídos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Nome</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Excluído em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {file.type === "folder" ? (
                        <Folder className="h-5 w-5 text-blue-500" />
                      ) : (
                        <File className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="truncate max-w-[300px]">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatSize(file.size)}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {file.deletedAt ? formatDate(file.deletedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(file.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restaurar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePermanentDelete(file.id, file.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
