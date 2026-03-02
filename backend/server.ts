import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = Number(process.env.PORT) || 3000;

// This will hold the Vite middleware once it's ready
let viteMiddleware: any = null;
let isViteReady = false;
let initError: any = null;

// Request logging
app.use((req, res, next) => {
  const isRoot = req.url === '/';
  const isAsset = req.url.startsWith('/@vite') || req.url.startsWith('/src') || req.url.includes('node_modules') || req.url.endsWith('.ts') || req.url.endsWith('.tsx');
  
  if (isRoot) {
    console.log(`[${new Date().toISOString()}] Root request received. isViteReady: ${isViteReady}`);
  }
  
  if (!isAsset) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Start listening immediately to satisfy the platform's health check
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});

// Health check (Must be before loading middleware)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: isViteReady ? "ok" : "loading", 
    isReady: isViteReady,
    env: process.env.NODE_ENV, 
    time: new Date().toISOString() 
  });
});

// API Routes
// ... (keep existing API routes) ...

// API Routes (Must be before loading middleware)
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

// API Catch-all (to prevent falling through to SPA fallback)
app.all("/api/:any(.*)", (req, res) => {
  console.log(`404 API: ${req.method} ${req.url}`);
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Vite / Static Files Middleware Wrapper
app.use(async (req, res, next) => {
  // Skip API routes
  if (req.url.startsWith('/api')) {
    return next();
  }

  // If we have an error, show it
  if (initError) {
    return res.status(500).send(`
      <html>
        <head><title>Server Error</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #d32f2f;">Server Başlatıla Bilmədi</h1>
          <pre style="background: #eee; padding: 10px; border-radius: 4px;">${initError.stack || initError.message || initError}</pre>
          <button onclick="window.location.reload()">Yenidən Yoxla</button>
        </body>
      </html>
    `);
  }

  // If Vite/Static is ready, use it
  if (isViteReady && viteMiddleware) {
    return viteMiddleware(req, res, next);
  }

  // Otherwise, show loading screen
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <html>
      <head>
        <title>NekoGold - Yüklənir</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5; color: #1c1e21; }
          .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; }
          .spinner { border: 4px solid rgba(0,0,0,0.1); width: 40px; height: 40px; border-radius: 50%; border-left-color: #1877f2; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { color: #65676b; margin-bottom: 20px; }
        </style>
        <script>
          setInterval(async () => {
            try {
              const res = await fetch('/api/health');
              const data = await res.json();
              if (data.isReady) window.location.reload();
            } catch (e) {}
          }, 2000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>NekoGold Hazırlanır</h1>
          <p>Sistem işə düşür, zəhmət olmasa gözləyin...</p>
        </div>
      </body>
    </html>
  `);
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nekogold',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

// Initialize database tables
async function initDb() {
  try {
    console.log("Attempting to connect to database...");
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
    console.log("CONNECTED");
    console.log("Database initialized successfully on host:", process.env.DB_HOST || 'localhost');
  } catch (err) {
    console.error("!!! DATABASE CONNECTION ERROR !!!");
    console.error("Check if your DB_HOST, DB_USER, DB_PASSWORD and DB_NAME are correct.");
    console.error("Error Details:", (err as Error).message);
  }
}

// Vite middleware for development
async function startServer() {
  try {
    console.log("Checking environment and build files...");
    const isProductionEnv = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "istehsal";
    const prodPublicPath = path.join(__dirname, "..", "dist", "public");
    const hasBuildFiles = fs.existsSync(path.join(prodPublicPath, "index.html"));
    
    console.log(`isProductionEnv: ${isProductionEnv}, hasBuildFiles: ${hasBuildFiles}`);

    if (isProductionEnv && hasBuildFiles) {
      console.log("Production mode: Serving static files from:", prodPublicPath);
      viteMiddleware = express.static(prodPublicPath);
      
      // Handle SPA fallback for production
      app.get("*", (req, res, next) => {
        if (!req.path.startsWith('/api') && isViteReady) {
          return res.sendFile(path.join(prodPublicPath, "index.html"));
        }
        next();
      });
    } else {
      console.log("Starting Vite in development mode...");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false
        },
        appType: "spa",
        root: path.resolve(__dirname, "../frontend")
      });
      
      viteMiddleware = vite.middlewares;
      console.log("✅ Vite middleware initialized.");
    }

    isViteReady = true;
    console.log("✨ Application setup complete. isViteReady = true");

    // Initialize DB in background
    initDb().catch(err => {
      console.error("Critical error during DB init:", err);
    });
  } catch (err) {
    console.error("❌ FAILED TO CONFIGURE SERVER:", err);
    initError = err;
  }
}

startServer();
