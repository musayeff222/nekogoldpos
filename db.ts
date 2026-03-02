import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';

// Load .env from current directory
dotenv.config({ override: true });

let host = process.env.DB_HOST || '127.0.0.1';

// If host looks like the database name (common mistake or auto-config issue), 
// default to 127.0.0.1 which is standard for Hostinger
if (host === process.env.DB_NAME && host !== 'localhost' && host !== '127.0.0.1') {
  console.warn(`Warning: DB_HOST matches DB_NAME (${host}). Forcing 127.0.0.1 for local connection.`);
  host = '127.0.0.1';
}

const dbConfig = {
  host: host,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nekogold_db',
  port: Number(process.env.DB_PORT) || 3306,
};

console.log('--- Environment Check ---');
console.log('CWD:', process.cwd());
console.log('DB_HOST from env:', process.env.DB_HOST);
console.log('DB_NAME from env:', process.env.DB_NAME);
console.log('Final Config Host:', dbConfig.host);
console.log('-------------------------');

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
