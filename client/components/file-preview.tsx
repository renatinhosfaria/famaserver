"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AudioViewer } from "@/components/viewers/audio-viewer";
import { ExcelViewer } from "@/components/viewers/excel-viewer";
import { ImageViewer } from "@/components/viewers/image-viewer";
import { TextViewer } from "@/components/viewers/text-viewer";
import { VideoViewer } from "@/components/viewers/video-viewer";
import { WordViewer } from "@/components/viewers/word-viewer";
import api from "@/lib/api";
import { Download, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Importação dinâmica do PdfViewer para evitar problemas com SSR
const PdfViewer = dynamic(
  () => import("@/components/viewers/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="text-white text-center">Carregando visualizador PDF...</div>
    ),
  }
);

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string | null;
  fileName: string;
  mimeType: string;
  isPublic?: boolean;
}

export function FilePreview({
  isOpen,
  onClose,
  fileId,
  fileName,
  mimeType,
  isPublic = false,
}: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && fileId) {
      setLoading(true);
      const endpoint = isPublic
        ? `/files/shared/download/${fileId}`
        : `/files/download/${fileId}`;
      api
        .get(endpoint)
        .then((res) => setUrl(res.data.url))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setUrl(null);
    }
  }, [isOpen, fileId, isPublic]);

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const renderContent = () => {
    if (loading)
      return (
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-white text-center flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div>
            <div className="mb-2 text-xl font-semibold">Carregando visualização...</div>
            <div className="text-sm text-white/60">Preparando arquivo seguro</div>
          </div>
        </motion.div>
      );

    if (!url)
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-center"
        >
          <div className="mb-3 text-2xl font-semibold">Não foi possível carregar o arquivo.</div>
          <div className="text-white/60">
            Tente novamente ou faça o download
          </div>
        </motion.div>
      );

    const extension = getFileExtension(fileName);

    if (mimeType.startsWith("image/")) return <ImageViewer url={url} fileName={fileName} />;
    if (mimeType.startsWith("video/")) return <VideoViewer url={url} fileName={fileName} mimeType={mimeType} />;
    if (mimeType.startsWith("audio/")) return <AudioViewer url={url} fileName={fileName} mimeType={mimeType} />;
    if (mimeType === "application/pdf" || extension === "pdf") return <PdfViewer url={url} fileName={fileName} />;

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      extension === "docx" || extension === "doc"
    ) return <WordViewer url={url} fileName={fileName} />;

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      extension === "xlsx" || extension === "xls" || extension === "csv"
    ) return <ExcelViewer url={url} fileName={fileName} />;

    if (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      ["txt", "json", "xml", "html", "css", "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "md", "yaml", "yml"].includes(extension)
    ) return <TextViewer url={url} fileName={fileName} mimeType={mimeType} />;

    return (
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl"
      >
        <div className="text-7xl mb-2 drop-shadow-2xl">📄</div>
        <div>
           <p className="text-white text-2xl font-semibold">
             Pré-visualização indisponível
           </p>
           <p className="text-white/50 text-sm mt-2">
             Tipo: {mimeType || "Desconhecido"}
           </p>
        </div>
        <Button
          onClick={() => window.open(url, "_blank")}
          className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-xl px-8 h-12 text-base"
        >
          <Download className="mr-3 h-5 w-5" />
          Fazer Download
        </Button>
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !block !w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] !h-[95vh] !p-0 !gap-0 bg-black/80 border-none backdrop-blur-3xl overflow-hidden shadow-2xl rounded-2xl"
      >
        <DialogTitle className="sr-only">Visualização: {fileName}</DialogTitle>
        <DialogDescription className="sr-only">
          Pré-visualização do arquivo {fileName}. Use os controles para baixar ou fechar.
        </DialogDescription>
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="absolute top-6 right-6 z-50 flex gap-3"
        >
          {url && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-md rounded-xl w-12 h-12 transition-all hover:scale-105 active:scale-95 shadow-lg"
              onClick={() => window.open(url, "_blank")}
              title="Baixar arquivo"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-md rounded-xl w-12 h-12 transition-all hover:scale-105 active:scale-95 shadow-lg"
            onClick={onClose}
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={url ? "loaded" : "loading"}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {!loading && url && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-6 left-6 text-white font-medium bg-black/50 border border-white/10 px-6 py-3 rounded-2xl text-[15px] backdrop-blur-xl shadow-2xl max-w-md truncate flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {fileName}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
