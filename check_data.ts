
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function checkData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
  try {
    const [rows] = await pool.execute('SELECT id, LENGTH(content) as size FROM products');
    console.log('Products in DB:', (rows as any[]).length);
    const avgSize = (rows as any[]).reduce((acc, row) => acc + row.size, 0) / (rows as any[]).length;
    console.log('Average Product Size (bytes):', avgSize);
    const maxSize = (rows as any[]).reduce((acc, row) => Math.max(acc, row.size), 0);
    console.log('Max Product Size (bytes):', maxSize);
    const [sales] = await pool.execute('SELECT id FROM sales') as any[];
    console.log('Sales in DB:', sales.length);
    const [logs] = await pool.execute('SELECT id FROM logs') as any[];
    console.log('Logs in DB:', logs.length);
    const [settings] = await pool.execute('SELECT id FROM settings');
    console.log('Settings in DB:', (settings as any[]).length);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkData();
