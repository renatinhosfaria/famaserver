/**
 * Memory-efficient thumbnail generator.
 * Streams files directly through sharp pipeline without buffering.
 * Processes one file at a time with explicit cleanup.
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const sharp = require('sharp');
const { Readable } = require('stream');

const THUMB_SIZE = 256;
const THUMB_QUALITY = 75;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://famauser:famapassword@postgres:5432/famaserver',
  max: 1,
});

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'minio'}:${process.env.MINIO_PORT || '9000'}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
});

const BUCKET = process.env.MINIO_BUCKET || 'famaserver-files';

async function generateThumbnail(file) {
  // Stream from S3 directly into sharp - no full buffer in memory
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: file.s3_key });
  const response = await s3.send(command);

  const thumbBuffer = await new Promise((resolve, reject) => {
    const transformer = sharp({ sequentialRead: true, limitInputPixels: 100000000 })
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY });

    const chunks = [];
    transformer.on('data', (chunk) => chunks.push(chunk));
    transformer.on('end', () => resolve(Buffer.concat(chunks)));
    transformer.on('error', reject);

    // Pipe S3 stream into sharp
    const readable = response.Body;
    if (readable.pipe) {
      readable.pipe(transformer);
    } else {
      // Fallback if Body is a web ReadableStream
      Readable.fromWeb(readable).pipe(transformer);
    }
  });

  // Upload thumbnail
  const thumbKey = `thumbnails/${file.user_id}/${file.id}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: 'image/jpeg',
  }));

  // Update DB
  await pool.query('UPDATE files SET thumbnail_s3_key = $1 WHERE id = $2', [thumbKey, file.id]);

  // Clear sharp cache
  sharp.cache(false);
  sharp.cache(true);
}

async function main() {
  // Limit sharp concurrency and cache
  sharp.concurrency(1);
  sharp.cache({ memory: 50, files: 5, items: 10 });

  console.log('Fetching remaining images without thumbnails...');

  const { rows } = await pool.query(
    `SELECT id, name, s3_key, user_id
     FROM files
     WHERE type = 'file'
       AND mime_type LIKE 'image/%'
       AND s3_key IS NOT NULL
       AND thumbnail_s3_key IS NULL
     ORDER BY created_at DESC`
  );

  console.log(`Found ${rows.length} images remaining.`);

  let processed = 0;
  let errors = 0;

  for (const file of rows) {
    try {
      await generateThumbnail(file);
    } catch (err) {
      errors++;
      if (processed < 10 || errors % 20 === 0) {
        console.error(`  [ERR] ${file.name}: ${err.message}`);
      }
    }

    processed++;
    if (processed % 100 === 0 || processed === rows.length) {
      const pct = ((processed / rows.length) * 100).toFixed(1);
      const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
      console.log(`  ${processed}/${rows.length} (${pct}%) | ${errors} errs | ${mem}MB RSS`);
    }
  }

  console.log(`\nDone! Processed: ${processed}, Errors: ${errors}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  pool.end();
  process.exit(1);
});
