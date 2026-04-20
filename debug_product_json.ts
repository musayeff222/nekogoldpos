
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
    const [rows] = await pool.execute('SELECT content FROM products LIMIT 5') as any[];
    rows.forEach((row, i) => {
        const product = JSON.parse(row.content);
        console.log(`Product ${i} keys:`, Object.keys(product));
        Object.keys(product).forEach(k => {
            if (typeof product[k] === 'string' && product[k].length > 100) {
                console.log(`  - ${k}: string, length ${product[k].length}`);
            } else if (Array.isArray(product[k])) {
                console.log(`  - ${k}: array, length ${product[k].length}`);
            }
        });
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
