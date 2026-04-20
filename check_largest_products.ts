
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
  try {
    const [rows] = await pool.execute('SELECT id, LENGTH(content) as len FROM products ORDER BY len DESC LIMIT 10') as any[];
    console.log('Top 10 largest products:');
    rows.forEach(row => {
        console.log(`- ID: ${row.id}, Length: ${row.len}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
