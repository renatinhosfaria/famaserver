"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { Copy, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

export function ShareDialog({
  isOpen,
  onClose,
  fileId,
  fileName,
}: ShareDialogProps) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const generateLink = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/files/share/${fileId}`);
      // Assuming frontend runs on same host/port logic or strict domain
      // In dev: http://localhost:3000/share/TOKEN
      const link = `${window.location.origin}/share/${response.data.token}`;
      setShareLink(link);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar arquivo</DialogTitle>
          <DialogDescription>
            Gere um link público para:{" "}
            <span className="font-semibold text-foreground">{fileName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={shareLink || "Clique em gerar..."}
              readOnly
              className={shareLink ? "" : "text-muted-foreground"}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="px-3"
            onClick={copyToClipboard}
            disabled={!shareLink}
          >
            <span className="sr-only">Copiar</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          {!shareLink ? (
            <Button
              type="button"
              variant="default"
              onClick={generateLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <LinkIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              Gerar Link Público
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground w-full text-center mt-2">
              Este link expira em 7 dias.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
