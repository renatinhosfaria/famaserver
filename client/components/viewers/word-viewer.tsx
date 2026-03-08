"use client";

import { useEffect, useState } from "react";
import mammoth from "mammoth";

interface WordViewerProps {
  url: string;
  fileName: string;
}

export function WordViewer({ url, fileName }: WordViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Baixar o arquivo como ArrayBuffer
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao carregar documento");

        const arrayBuffer = await response.arrayBuffer();

        // Converter para HTML usando mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);

        if (result.messages.length > 0) {
          console.warn("Avisos na conversão:", result.messages);
        }
      } catch (err) {
        console.error("Erro ao carregar documento Word:", err);
        setError("Não foi possível carregar o documento Word.");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-white text-center">
          <div className="mb-4">Carregando documento Word...</div>
          <div className="text-sm text-white/60">
            Convertendo para visualização
          </div>
        </div>
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

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-gray-800">{fileName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Documento Word - Modo de Visualização
          </p>
        </div>

        {/* Conteúdo convertido */}
        <div
          className="prose prose-lg max-w-none word-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            fontFamily: "Calibri, Arial, sans-serif",
            lineHeight: "1.6",
            color: "#333",
          }}
        />
      </div>

      {/* Estilos para o conteúdo Word */}
      <style jsx global>{`
        .word-content {
          font-size: 16px;
        }
        .word-content p {
          margin-bottom: 1em;
        }
        .word-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        .word-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        .word-content h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .word-content ul,
        .word-content ol {
          margin-left: 2em;
          margin-bottom: 1em;
        }
        .word-content li {
          margin-bottom: 0.5em;
        }
        .word-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .word-content table td,
        .word-content table th {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .word-content table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .word-content strong {
          font-weight: bold;
        }
        .word-content em {
          font-style: italic;
        }
        .word-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
