"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configurar worker do PDF.js usando unpkg que tem todas as versões
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  fileName: string;
}

export function PdfViewer({ url, fileName }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div className="flex flex-col items-center w-full h-full bg-gray-900">
      {/* Controles */}
      <div className="flex items-center gap-4 p-4 bg-black/50 backdrop-blur rounded-lg mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <span className="text-white font-medium min-w-[120px] text-center">
          Página {pageNumber} de {numPages || "..."}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
          className="text-white hover:bg-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="w-px h-6 bg-white/20" />

        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="text-white hover:bg-white/10"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>

        <span className="text-white font-medium min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          disabled={scale >= 3.0}
          className="text-white hover:bg-white/10"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      </div>

      {/* Documento PDF */}
      <div className="flex-1 overflow-auto w-full flex justify-center items-start p-4">
        {loading && (
          <div className="text-white text-center py-10">
            Carregando PDF...
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error("Erro ao carregar PDF:", error)}
          loading={<div className="text-white">Carregando documento...</div>}
          error={
            <div className="text-red-400">
              Erro ao carregar PDF. Tente fazer o download.
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl"
          />
        </Document>
      </div>
    </div>
  );
}
