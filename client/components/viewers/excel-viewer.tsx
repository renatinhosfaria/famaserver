"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

interface ExcelViewerProps {
  url: string;
  fileName: string;
}

interface SheetData {
  name: string;
  data: any[][];
}

export function ExcelViewer({ url, fileName }: ExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Baixar o arquivo
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao carregar planilha");

        const arrayBuffer = await response.arrayBuffer();

        // Ler o arquivo Excel
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Converter cada sheet para array
        const sheetsData: SheetData[] = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          }) as any[][];

          return { name, data };
        });

        setSheets(sheetsData);
      } catch (err) {
        console.error("Erro ao carregar Excel:", err);
        setError("Não foi possível carregar a planilha.");
      } finally {
        setLoading(false);
      }
    };

    loadExcel();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-white text-center">
          <div className="mb-4">Carregando planilha Excel...</div>
          <div className="text-sm text-white/60">Processando dados</div>
        </div>
      </div>
    );
  }

  if (error || sheets.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-red-400 text-center">
          <div className="mb-2">{error || "Planilha vazia"}</div>
          <div className="text-sm">Tente fazer o download do arquivo.</div>
        </div>
      </div>
    );
  }

  const currentSheet = sheets[currentSheetIndex];
  const maxColWidth = 200;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{fileName}</h1>
          <p className="text-sm text-gray-500">
            Planilha Excel - Modo de Visualização
          </p>
        </div>

        {/* Navegação entre sheets */}
        {sheets.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentSheetIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentSheetIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium text-gray-700 min-w-[150px] text-center">
              {currentSheet.name} ({currentSheetIndex + 1} de {sheets.length})
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentSheetIndex((prev) =>
                  Math.min(sheets.length - 1, prev + 1)
                )
              }
              disabled={currentSheetIndex === sheets.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs das sheets */}
      {sheets.length > 1 && (
        <div className="flex gap-1 p-2 bg-gray-100 border-b border-gray-300 overflow-x-auto">
          {sheets.map((sheet, index) => (
            <button
              key={index}
              onClick={() => setCurrentSheetIndex(index)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                index === currentSheetIndex
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div className="flex-1 overflow-auto p-4">
        {currentSheet.data.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Esta planilha está vazia
          </div>
        ) : (
          <div className="inline-block min-w-full">
            <table className="border-collapse border border-gray-300 bg-white shadow-sm">
              <thead>
                <tr className="bg-gray-100">
                  {/* Coluna de índice */}
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-600 bg-gray-200 sticky left-0 z-10 min-w-[50px]">
                    #
                  </th>
                  {/* Colunas de dados */}
                  {currentSheet.data[0] &&
                    currentSheet.data[0].map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 min-w-[100px]"
                        style={{ maxWidth: `${maxColWidth}px` }}
                      >
                        {String.fromCharCode(65 + colIndex)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {currentSheet.data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {/* Índice da linha */}
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 bg-gray-100 sticky left-0 z-10">
                      {rowIndex + 1}
                    </td>
                    {/* Células */}
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-gray-300 px-3 py-2 text-gray-800 whitespace-pre-wrap"
                        style={{ maxWidth: `${maxColWidth}px` }}
                      >
                        {cell !== undefined && cell !== null && cell !== ""
                          ? String(cell)
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer com info */}
      <div className="p-3 border-t border-gray-300 bg-gray-50 text-sm text-gray-600 text-center">
        {currentSheet.data.length} linhas ×{" "}
        {currentSheet.data[0]?.length || 0} colunas
      </div>
    </div>
  );
}
