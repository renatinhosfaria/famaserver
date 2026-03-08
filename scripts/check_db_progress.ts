
import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  try {
    const resCount = await client.query('SELECT type, COUNT(*) FROM files WHERE user_id = 4 GROUP BY type');
    console.log('--- Contagem por Tipo ---');
    console.table(resCount.rows);

    const resSample = await client.query('SELECT id, name, type, s3_key, is_public, user_id FROM files WHERE type = \'file\' AND user_id = 4 LIMIT 1');
    console.log('\n--- Exemplo de Arquivo ---');
    console.table(resSample.rows);
    
    const resSampleFolder = await client.query('SELECT id, name, type, is_public, user_id FROM files WHERE type = \'folder\' AND user_id = 4 LIMIT 1');
    console.log('\n--- Exemplo de Pasta ---');
    console.table(resSampleFolder.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
