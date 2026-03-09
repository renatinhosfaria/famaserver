const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://famauser:famapassword@localhost:5432/famaserver',
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, email FROM users LIMIT 10');
    console.log('Users found:', res.rows);
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

run();
