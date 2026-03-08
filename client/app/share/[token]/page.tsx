"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import { Download, DownloadCloud } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import api from "@/lib/api";

// ...

// Custom axios removed
// import axios from "axios";

export default function SharedPage() {
  const { token } = useParams();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          const res = await api.get(`/public/share/${token}`);
          setFile(res.data);
        } catch (err: unknown) {
// ...
          console.error(err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Card className="max-w-md w-full border-red-900 bg-red-950/20 text-center">
          <CardHeader>
            <CardTitle className="text-red-500">Erro</CardTitle>
            <CardDescription className="text-gray-400">Link inválido ou expirado.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Reuse login background */}
      <div className="absolute inset-0 z-0 opacity-50">
        <Image src="/bg.png" alt="bg" fill className="object-cover" />
      </div>

      <Card className="w-full max-w-md z-10 bg-black/40 backdrop-blur-xl border-white/10 text-white">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-500/20 p-4 rounded-full w-fit mb-4">
            <DownloadCloud className="h-10 w-10 text-blue-400" />
          </div>
          <CardTitle className="text-2xl">{file.file.name}</CardTitle>
          <CardDescription className="text-gray-300">
            {formatBytes(file.file.size)} • {file.file.mimeType}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {/* Preview thumbnail could go here */}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => (window.location.href = file.url)}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Arquivo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
