
import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  try {
    console.log('Iniciando transferência de propriedade...');
    
    // Contar antes
    const resCount = await client.query('SELECT COUNT(*) FROM files WHERE user_id = 4 AND is_public = true');
    console.log(`Arquivos afetados (User 4 + Public): ${resCount.rows[0].count}`);

    // Update
    const resUpdate = await client.query('UPDATE files SET user_id = 1 WHERE user_id = 4 AND is_public = true');
    console.log(`Sucesso: ${resUpdate.rowCount} arquivos transferidos para o Usuário 1 (Admin/Sistema).`);

  } catch (err) {
    console.error('Erro ao atualizar:', err);
  } finally {
    await client.end();
  }
}

main();
