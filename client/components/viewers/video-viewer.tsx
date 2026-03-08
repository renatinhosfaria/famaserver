"use client";

import { useEffect, useRef, useState } from "react";

interface VideoViewerProps {
  url: string;
  fileName: string;
  mimeType: string;
}

export function VideoViewer({ url, fileName, mimeType }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => setIsLoaded(true);
      video.addEventListener("loadeddata", handleLoadedData);
      return () => video.removeEventListener("loadeddata", handleLoadedData);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {!isLoaded && (
        <div className="text-white mb-4">Carregando vídeo...</div>
      )}
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nodownload"
        className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
        style={{ display: isLoaded ? "block" : "none" }}
      >
        <source src={url} type={mimeType} />
        Seu navegador não suporta a reprodução de vídeo.
      </video>

      {isLoaded && (
        <div className="mt-4 text-white/70 text-sm">
          Use os controles do player para reproduzir, pausar e ajustar o volume
        </div>
      )}
    </div>
  );
}
