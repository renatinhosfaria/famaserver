"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface ImageViewerProps {
  url: string;
  fileName: string;
}

export function ImageViewer({ url, fileName }: ImageViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 5.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.2));
  const rotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const resetView = () => {
    setScale(1.0);
    setRotation(0);
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Controles */}
      <div className="flex items-center gap-4 p-4 bg-black/50 backdrop-blur rounded-lg mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          disabled={scale <= 0.2}
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
          disabled={scale >= 5.0}
          className="text-white hover:bg-white/10"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>

        <div className="w-px h-6 bg-white/20" />

        <Button
          variant="ghost"
          size="icon"
          onClick={rotateLeft}
          className="text-white hover:bg-white/10"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={rotateRight}
          className="text-white hover:bg-white/10"
        >
          <RotateCw className="h-5 w-5" />
        </Button>

        <div className="w-px h-6 bg-white/20" />

        <Button
          variant="ghost"
          size="sm"
          onClick={resetView}
          className="text-white hover:bg-white/10"
        >
          Resetar
        </Button>
      </div>

      {/* Imagem */}
      <div className="flex-1 overflow-auto w-full flex justify-center items-center">
        <img
          src={url}
          alt={fileName}
          className="max-w-none transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}
