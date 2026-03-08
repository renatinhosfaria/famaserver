export interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string; // 'application/folder' if folder
  type: "file" | "folder";
  s3Key?: string;
  thumbnailS3Key?: string | null;
  userId: number;
  isPublic?: boolean;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
