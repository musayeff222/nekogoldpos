import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = 3000;

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nekogold',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initDb() {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        carat INT NOT NULL,
        type VARCHAR(255) NOT NULL,
        supplier VARCHAR(255) NOT NULL,
        brilliant TEXT,
        weight DOUBLE NOT NULL,
        supplierPrice DOUBLE NOT NULL,
        price DOUBLE NOT NULL,
        stockCount INT NOT NULL,
        imageUrl LONGTEXT,
        purchaseDate VARCHAR(255) NOT NULL,
        logs JSON
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        address TEXT,
        cashDebt DOUBLE DEFAULT 0,
        goldDebt DOUBLE DEFAULT 0
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(255) PRIMARY KEY,
        productId VARCHAR(255),
        productName VARCHAR(255),
        productCode VARCHAR(255),
        type VARCHAR(255),
        customerName VARCHAR(255),
        price DOUBLE,
        discount DOUBLE,
        total DOUBLE,
        date VARCHAR(255),
        status VARCHAR(50),
        returnNote TEXT,
        weight DOUBLE,
        carat INT,
        supplier VARCHAR(255),
        brilliant TEXT,
        imageUrl LONGTEXT
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS scraps (
        id VARCHAR(255) PRIMARY KEY,
        customerName VARCHAR(255),
        idCardFin VARCHAR(255),
        phones JSON,
        items JSON,
        pricePerGram DOUBLE,
        totalPrice DOUBLE,
        personImage LONGTEXT,
        idCardImage LONGTEXT,
        isMelted BOOLEAN,
        date VARCHAR(255)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        config JSON NOT NULL
      )
    `);

    connection.release();
    console.log("Database initialized");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

// API Routes
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY purchaseDate DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const p = req.body;
    await pool.query(
      "INSERT INTO products (id, code, name, carat, type, supplier, brilliant, weight, supplierPrice, price, stockCount, imageUrl, purchaseDate, logs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [p.id, p.code, p.name, p.carat, p.type, p.supplier, p.brilliant, p.weight, p.supplierPrice, p.price, p.stockCount, p.imageUrl, p.purchaseDate, JSON.stringify(p.logs)]
    );
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const p = req.body;
    await pool.query(
      "UPDATE products SET code=?, name=?, carat=?, type=?, supplier=?, brilliant=?, weight=?, supplierPrice=?, price=?, stockCount=?, imageUrl=?, purchaseDate=?, logs=? WHERE id=?",
      [p.code, p.name, p.carat, p.type, p.supplier, p.brilliant, p.weight, p.supplierPrice, p.price, p.stockCount, p.imageUrl, p.purchaseDate, JSON.stringify(p.logs), req.params.id]
    );
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Sales
app.get("/api/sales", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM sales ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/sales", async (req, res) => {
  try {
    const s = req.body;
    await pool.query(
      "INSERT INTO sales (id, productId, productName, productCode, type, customerName, price, discount, total, date, status, returnNote, weight, carat, supplier, brilliant, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [s.id, s.productId, s.productName, s.productCode, s.type, s.customerName, s.price, s.discount, s.total, s.date, s.status, s.returnNote, s.weight, s.carat, s.supplier, s.brilliant, s.imageUrl]
    );
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/sales/:id", async (req, res) => {
  try {
    const s = req.body;
    await pool.query(
      "UPDATE sales SET status=?, returnNote=? WHERE id=?",
      [s.status, s.returnNote, req.params.id]
    );
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Customers
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM customers");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const c = req.body;
    await pool.query(
      "INSERT INTO customers (id, fullName, phone, title, address, cashDebt, goldDebt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [c.id, c.fullName, c.phone, c.title, c.address, c.cashDebt, c.goldDebt]
    );
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const c = req.body;
    await pool.query(
      "UPDATE customers SET fullName=?, phone=?, title=?, address=?, cashDebt=?, goldDebt=? WHERE id=?",
      [c.fullName, c.phone, c.title, c.address, c.cashDebt, c.goldDebt, req.params.id]
    );
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Scraps
app.get("/api/scraps", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM scraps ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/scraps", async (req, res) => {
  try {
    const s = req.body;
    await pool.query(
      "INSERT INTO scraps (id, customerName, idCardFin, phones, items, pricePerGram, totalPrice, personImage, idCardImage, isMelted, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [s.id, s.customerName, s.idCardFin, JSON.stringify(s.phones), JSON.stringify(s.items), s.pricePerGram, s.totalPrice, s.personImage, s.idCardImage, s.isMelted, s.date]
    );
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Settings
app.get("/api/settings", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT config FROM settings WHERE id = 1");
    if (rows.length > 0) {
      res.json(rows[0].config);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const config = req.body;
    await pool.query(
      "INSERT INTO settings (id, config) VALUES (1, ?) ON DUPLICATE KEY UPDATE config = ?",
      [JSON.stringify(config), JSON.stringify(config)]
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Vite middleware for development
async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
