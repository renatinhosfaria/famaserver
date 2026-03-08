
import { ListObjectsV2Command, ListObjectsV2CommandOutput, S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as path from 'path';
import { Client } from 'pg';

// Config
const TARGET_USER_ID = 4; // renato@famanegociosimobiliarios.com.br
const BUCKET_NAME = process.env.MINIO_BUCKET || 'famaserver-files';

// DB Connection
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
});

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: 'us-east-1', // MinIO default
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const db = drizzle(dbClient);

interface FileNode {
  name: string;
  path: string;
  size: number;
  isFolder: boolean;
  s3Key?: string;
}

async function main() {
  console.log('Iniciando sincronização de metadados...');
  await dbClient.connect();

  try {
    // 1. List all objects from S3
    const allObjects = await listAllObjects();
    console.log(`Encontrados ${allObjects.length} objetos no MinIO.`);

    // 2. Insert into DB (maintaining hierarchy)
    // Ordenar por path length para garantir que pais sejam criados antes (embora a logica recursiva cuide disso)
    // Mas criar pastas explicitamente é safer.
    
    for (const obj of allObjects) {
       await processObject(obj);
    }

    console.log('Sincronização concluída com sucesso!');
  } catch (e) {
    console.error('Erro fatal:', e);
  } finally {
    await dbClient.end();
  }
}

async function listAllObjects(): Promise<FileNode[]> {
  let objects: FileNode[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    });
    const response: ListObjectsV2CommandOutput = await s3Client.send(command);
    
    if (response.Contents) {
      for (const item of response.Contents) {
        if (!item.Key) continue;
        // Ignorar "pastas" do S3 se terminarem com / e tiverem size 0, ou tratá-las como folders?
        // Rclone cria objetos? Normalmente rclone cria objetos diretos.
        // Vamos tratar cada objeto como FILE.
        // E inferir as pastas pelo caminho.
        objects.push({
          name: path.basename(item.Key),
          path: item.Key,
          size: item.Size || 0,
          isFolder: false,
          s3Key: item.Key
        });
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

// Cache de pastas criadas para evitar selects excessivos
const folderCache = new Map<string, string>(); // Path -> UUID

async function getOrCreateFolder(folderPath: string): Promise<string | null> {
  if (!folderPath || folderPath === '.' || folderPath === '/') return null;
  if (folderCache.has(folderPath)) return folderCache.get(folderPath)!;

  // Verificar se existe no DB
  // Assumindo unicidade por path? Não, schema nao tem path. Tem parent_id + name.
  // Preciso navegar recursivamente.
  
  const parentPath = path.dirname(folderPath);
  const folderName = path.basename(folderPath);
  
  const parentId = parentPath === '.' || parentPath === '/' ? null : await getOrCreateFolder(parentPath);
  
  // Check DB
  const existing = await dbClient.query(
    'SELECT id FROM files WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2 AND type = $3 AND user_id = $4 AND deleted_at IS NULL',
    [folderName, parentId, 'folder', TARGET_USER_ID]
  );

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    folderCache.set(folderPath, id);
    return id;
  }

  // Create
  const insertRes = await dbClient.query(
    `INSERT INTO files (user_id, parent_id, name, size, mime_type, type, is_public) 
     VALUES ($1, $2, $3, 0, 'application/x-directory', 'folder', true) RETURNING id`,
    [TARGET_USER_ID, parentId, folderName]
  );
  
  const newId = insertRes.rows[0].id;
  folderCache.set(folderPath, newId);
  console.log(`Pasta criada: ${folderPath} -> ${newId}`);
  return newId;
}

async function processObject(node: FileNode) {
  const dir = path.dirname(node.path);
  const parentId = dir === '.' || dir === '/' ? null : await getOrCreateFolder(dir);

  // Check valid mime type
  const mimeType = getMimeType(node.name);

  // Check if file exists to avoid dups (idempotency)
  const existing = await dbClient.query(
    'SELECT id FROM files WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2 AND type = $3 AND user_id = $4 AND deleted_at IS NULL',
    [node.name, parentId, 'file', TARGET_USER_ID]
  );

  if (existing.rows.length > 0) {
    // Update size/s3key if needed? Or skip.
    // console.log(`Arquivo já existe: ${node.path}`);
    return;
  }

  await dbClient.query(
    `INSERT INTO files (user_id, parent_id, name, size, mime_type, type, s3_key, is_public)
     VALUES ($1, $2, $3, $4, $5, 'file', $6, true)`,
    [TARGET_USER_ID, parentId, node.name, node.size, mimeType, node.s3Key]
  );
  
  if (Math.random() > 0.99) process.stdout.write('.'); // Progress indicator
}

function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const types: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.mp4': 'video/mp4',
        '.zip': 'application/zip'
    };
    return types[ext] || 'application/octet-stream';
}

main();
