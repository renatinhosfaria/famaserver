// User — based on apps/server/src/database/schema.ts (users table)
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string | null;
}

// FileItem — based on apps/client/types/file.ts + apps/server/src/database/schema.ts (files table)
export interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  type: 'file' | 'folder';
  s3Key?: string;
  thumbnailS3Key?: string | null;
  userId: number;
  parentId?: string | null;
  isPublic?: boolean;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// ShareLink — based on apps/server/src/database/schema.ts (shares table)
export interface ShareLink {
  id: string;
  fileId: string;
  token: string;
  expiresAt: string | null;
  createdAt: string | null;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}
