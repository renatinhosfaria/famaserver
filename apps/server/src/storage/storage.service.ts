import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3: S3Client;
  private s3Public: S3Client;
  private bucket: string;
  private publicEndpoint: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('MINIO_BUCKET')!;

    const publicHost = this.configService.get('PUBLIC_HOST');
    const publicPort = this.configService.get('MINIO_PUBLIC_PORT') || '9100';
    this.publicEndpoint = `http://${publicHost}:${publicPort}`;

    // Internal S3 client for uploads, deletes, and bucket operations
    this.s3 = new S3Client({
      region: 'us-east-1', // MinIO doesn't strictly need this, but SDK does
      endpoint: `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
      },
    });

    // Public S3 client for generating presigned URLs with the correct public endpoint
    // This ensures the signature is valid when accessed from the browser
    this.s3Public = new S3Client({
      region: 'us-east-1',
      endpoint: this.publicEndpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      console.log(
        `Bucket ${this.bucket} not found or error, attempting to create...`,
      );
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`Bucket ${this.bucket} created.`);
      } catch (createError) {
        console.error('Error creating bucket:', createError);
      }
    }
  }

  async uploadFile(key: string, body: Buffer, mimeType: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
    return key;
  }

  async getDownloadUrl(key: string, _requestHost?: string) {
    // Use relative URL through nginx proxy (/storage/) so the browser
    // doesn't need direct access to MinIO on port 9100.
    // The bucket has a public download policy, so no presigning is needed.
    return `/storage/${encodeURIComponent(this.bucket)}/${this.encodeKeyForPath(key)}`;
  }

  getPublicUrl(key: string) {
    // Generate a simple public URL through nginx proxy
    return `/storage/${encodeURIComponent(this.bucket)}/${this.encodeKeyForPath(key)}`;
  }

  private encodeKeyForPath(key: string): string {
    // Keep "/" separators, but encode each segment to avoid broken URLs
    // for names containing spaces, accents, "%", "#" and other reserved chars.
    return key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.s3.send(command);
    // Convert the readable stream to Buffer
    const stream = response.Body as import('stream').Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteFile(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
