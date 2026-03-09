"use client";

import { useEffect, useState } from "react";

interface TextViewerProps {
  url: string;
  fileName: string;
  mimeType: string;
}

export function TextViewer({ url, fileName, mimeType }: TextViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadText = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao carregar arquivo");

        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error("Erro ao carregar arquivo de texto:", err);
        setError("Não foi possível carregar o arquivo.");
      } finally {
        setLoading(false);
      }
    };

    loadText();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-white">Carregando arquivo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-red-400 text-center">
          <div className="mb-2">{error}</div>
          <div className="text-sm">Tente fazer o download do arquivo.</div>
        </div>
      </div>
    );
  }

  const isJson = mimeType === "application/json" || fileName.endsWith(".json");
  const isCode =
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    fileName.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|css|html|xml)$/);

  let displayContent = content;
  if (isJson) {
    try {
      displayContent = JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      // Se não for JSON válido, mantém o conteúdo original
    }
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">{fileName}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isJson
              ? "Arquivo JSON"
              : isCode
                ? "Código-fonte"
                : "Arquivo de Texto"}{" "}
            - Modo de Visualização
          </p>
        </div>

        {/* Conteúdo */}
        <pre className="bg-gray-800 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed shadow-lg">
          {displayContent}
        </pre>

        {/* Footer */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          {content.split("\n").length} linhas · {content.length} caracteres
        </div>
      </div>
    </div>
  );
}
