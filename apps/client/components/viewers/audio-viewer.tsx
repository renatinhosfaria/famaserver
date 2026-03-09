"use client";

import { Music } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AudioViewerProps {
  url: string;
  fileName: string;
  mimeType: string;
}

export function AudioViewer({ url, fileName, mimeType }: AudioViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedData = () => {
        setIsLoaded(true);
        setDuration(audio.duration);
      };
      audio.addEventListener("loadeddata", handleLoadedData);
      return () => audio.removeEventListener("loadeddata", handleLoadedData);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-12 mb-8 shadow-2xl">
        <Music className="h-24 w-24 text-white" />
      </div>

      <h3 className="text-white text-xl font-semibold mb-2">{fileName}</h3>
      {isLoaded && duration > 0 && (
        <p className="text-white/70 text-sm mb-6">
          Duração: {formatTime(duration)}
        </p>
      )}

      {!isLoaded && (
        <div className="text-white mb-4 text-sm">Carregando áudio...</div>
      )}

      <audio
        ref={audioRef}
        src={url}
        controls
        controlsList="nodownload"
        className="w-full max-w-md shadow-lg"
        style={{ display: isLoaded ? "block" : "none" }}
      >
        <source src={url} type={mimeType} />
        Seu navegador não suporta a reprodução de áudio.
      </audio>

      {isLoaded && (
        <div className="mt-6 text-white/60 text-sm text-center max-w-md">
          Use os controles do player para reproduzir, pausar e ajustar o volume
        </div>
      )}
    </div>
  );
}
