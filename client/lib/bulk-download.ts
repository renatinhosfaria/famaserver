import JSZip from "jszip";

type DownloadableFile = {
  id: string;
  name: string;
};

type BulkZipResult = {
  downloaded: number;
  failed: string[];
};

function sanitizeFileName(name: string): string {
  const sanitized = name.replace(/[\\/]/g, "_").trim();
  return sanitized || "arquivo";
}

function makeUniqueName(name: string, usage: Map<string, number>): string {
  const safeName = sanitizeFileName(name);
  const count = usage.get(safeName) ?? 0;
  usage.set(safeName, count + 1);

  if (count === 0) return safeName;

  const dotIndex = safeName.lastIndexOf(".");
  if (dotIndex <= 0) return `${safeName} (${count})`;
  const base = safeName.slice(0, dotIndex);
  const ext = safeName.slice(dotIndex);
  return `${base} (${count})${ext}`;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadFilesAsZip(
  files: DownloadableFile[],
  getDownloadUrl: (id: string) => Promise<string>,
  zipFilename: string,
): Promise<BulkZipResult> {
  const zip = new JSZip();
  const nameUsage = new Map<string, number>();
  const failed: string[] = [];

  for (const file of files) {
    try {
      const downloadUrl = await getDownloadUrl(file.id);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const uniqueName = makeUniqueName(file.name, nameUsage);
      zip.file(uniqueName, blob);
    } catch (error) {
      console.error(`Erro ao baixar arquivo ${file.name}:`, error);
      failed.push(file.name);
    }
  }

  const downloaded = files.length - failed.length;
  if (downloaded > 0) {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerBrowserDownload(zipBlob, zipFilename);
  }

  return { downloaded, failed };
}
