
import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, code, name, carat, type, weight, supplier, supplierPrice, price, stockCount, purchaseDate, imageUrl, brilliant } = req.body;
    await pool.query(
      'INSERT INTO products (id, code, name, carat, type, weight, supplier, supplierPrice, price, stockCount, purchaseDate, imageUrl, brilliant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, code, name, carat, type, weight, supplier, supplierPrice, price, stockCount, purchaseDate, imageUrl, brilliant]
    );
    res.status(201).json({ message: 'Product created' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { id, fullName, phone, cashDebt, goldDebt, address, title } = req.body;
    await pool.query(
      'INSERT INTO customers (id, fullName, phone, cashDebt, goldDebt, address, title) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, fullName, phone, cashDebt, goldDebt, address, title]
    );
    res.status(201).json({ message: 'Customer created' });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Sales API
app.get('/api/sales', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sales ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const sales = req.body; // Expecting an array of sales
    for (const sale of sales) {
      const { id, productId, productName, productCode, type, customerName, price, discount, total, date, status, weight, carat, supplier, brilliant, imageUrl } = sale;
      await pool.query(
        'INSERT INTO sales (id, productId, productName, productCode, type, customerName, price, discount, total, date, status, weight, carat, supplier, brilliant, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, productId, productName, productCode, type, customerName, price, discount, total, date, status, weight, carat, supplier, brilliant, imageUrl]
      );
      // Update stock
      await pool.query('UPDATE products SET stockCount = 0 WHERE id = ?', [productId]);
    }
    res.status(201).json({ message: 'Sales recorded' });
  } catch (error) {
    console.error('Error recording sales:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT data FROM settings WHERE id = 1');
    if (rows.length > 0) {
      res.json(rows[0].data);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const data = req.body;
    await pool.query(
      'INSERT INTO settings (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = ?',
      [JSON.stringify(data), JSON.stringify(data)]
    );
    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Vite middleware for development
async function setupVite() {
  // Test database connection
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
