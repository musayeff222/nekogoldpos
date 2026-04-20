import express, { Request, Response } from 'express';
import compression from 'compression';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

// Load environment variables
dotenv.config({ override: true });

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('Critical Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT: number = Number(process.env.PORT) || 3000;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Ensure public_html and uploads directories exist
  let publicHtmlDir = path.resolve(process.cwd(), 'public_html');
  let uploadDir = path.resolve(process.cwd(), 'uploads');

  const checkPaths = [
    { p: path.resolve(process.cwd(), '..', 'public_html'), u: path.resolve(process.cwd(), '..', 'uploads') },
    { p: path.resolve(process.cwd(), '..', '..', 'public_html'), u: path.resolve(process.cwd(), '..', '..', 'uploads') }
  ];

  for (const paths of checkPaths) {
    if (fs.existsSync(paths.p) || fs.existsSync(paths.u)) {
      publicHtmlDir = paths.p;
      uploadDir = paths.u;
      break;
    }
  }
  
  if (!fs.existsSync(publicHtmlDir)) {
    try { fs.mkdirSync(publicHtmlDir, { recursive: true }); } catch (e) {}
  }
  if (!fs.existsSync(uploadDir)) {
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
  });

  app.use(compression());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    const forbiddenPaths = ['/wordpress', '/wp-admin', '/wp-login', '/xmlrpc.php', '/.env', '/config.php'];
    if (forbiddenPaths.some(path => req.path.toLowerCase().includes(path))) {
      return res.status(403).send('Forbidden');
    }
    next();
  });

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 50, // Increased for more concurrent users
    connectTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: process.env.DB_SSL === 'true' ? {} : undefined
  });

  const initDB = async (retries = 10) => {
    let connection;
    while (retries > 0) {
      try {
        console.log(`Database initialization attempt (${11 - retries}/10)...`);
        connection = await pool.getConnection();
        await connection.ping();
        
        const tables = [
          { name: 'messages', sql: 'CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, question TEXT, answer TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)' },
          { name: 'products', sql: 'CREATE TABLE IF NOT EXISTS products (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX (updated_at))' },
          { name: 'sales', sql: 'CREATE TABLE IF NOT EXISTS sales (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX (updated_at))' },
          { name: 'customers', sql: 'CREATE TABLE IF NOT EXISTS customers (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX (updated_at))' },
          { name: 'scraps', sql: 'CREATE TABLE IF NOT EXISTS scraps (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX (updated_at))' },
          { name: 'settings', sql: 'CREATE TABLE IF NOT EXISTS settings (id VARCHAR(50) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3))' },
          { name: 'expenses', sql: 'CREATE TABLE IF NOT EXISTS expenses (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX (updated_at))' },
          { name: 'logs', sql: 'CREATE TABLE IF NOT EXISTS logs (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), INDEX (updated_at), INDEX (created_at))' },
          { name: 'users', sql: 'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)' },
          { name: 'print_queue', sql: 'CREATE TABLE IF NOT EXISTS print_queue (id INT AUTO_INCREMENT PRIMARY KEY, product_data LONGTEXT, status ENUM(\'pending\', \'completed\') DEFAULT \'pending\', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX (status, created_at))' }
        ];

        for (const table of tables) {
          await connection.query(table.sql);
        }

        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if ((users as any[]).length === 0) {
          const hashedPassword = await bcrypt.hash('123456', 10);
          await connection.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
        }

        const indices = [
          { table: 'products', col: 'updated_at' },
          { table: 'sales', col: 'updated_at' },
          { table: 'customers', col: 'updated_at' },
          { table: 'expenses', col: 'updated_at' }
        ];

        for (const idx of indices) {
          try { await connection.query(`CREATE INDEX idx_${idx.table}_${idx.col} ON ${idx.table} (${idx.col})`); } catch (e) {}
        }

        // Safer migrations for older MySQL versions (Hostinger compatibility)
        const checkAndAddColumn = async (conn: any, table: string, column: string, definition: string) => {
          try {
            const [columns] = await conn.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
            if ((columns as any[]).length === 0) {
              console.log(`Adding missing column ${column} to ${table}...`);
              await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            } else if (definition.includes('TIMESTAMP(3)')) {
              // Ensure precision is correct
              await conn.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`);
            }
          } catch (e) {
            console.warn(`Migration failed for ${table}.${column}:`, e);
          }
        };

        await checkAndAddColumn(connection, 'products', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        await checkAndAddColumn(connection, 'sales', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        await checkAndAddColumn(connection, 'customers', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        await checkAndAddColumn(connection, 'scraps', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        await checkAndAddColumn(connection, 'settings', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        await checkAndAddColumn(connection, 'expenses', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        await checkAndAddColumn(connection, 'logs', 'updated_at', 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
        
        console.log('All database tables initialized successfully');
        return;
      } catch (err) {
        retries--;
        console.error(`Database initialization attempt failed (${10 - retries}/10):`, err);
        if (retries === 0) {
          console.error('Database initialization failed after all retries.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } finally {
        if (connection) connection.release();
      }
    }
  };

  const JWT_SECRET = process.env.JWT_SECRET || 'nekogold-secret-key-2024';
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // State to track if database is ready
  let isDbReady = false;
  let dbError: string | null = null;

  initDB().then(() => {
    isDbReady = true;
    console.log('Database initialization background task completed');
  }).catch(err => {
    dbError = err.message;
    console.error('Database initialization failed critical path:', err);
  });

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: isDbReady ? 'ready' : 'initializing',
      error: dbError
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      const users = rows as any[];
      if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, username: user.username });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/init-data', async (req: Request, res: Response) => {
    if (!isDbReady) {
      return res.status(503).json({ error: 'Database is still initializing. Please try again in a few seconds.' });
    }
    let connection;
    try {
      connection = await pool.getConnection();
      const results: any = {};
      const tasks = [
        { key: 'settings', sql: 'SELECT content FROM settings LIMIT 1' },
        { key: 'logs', sql: 'SELECT content FROM logs ORDER BY created_at DESC LIMIT 50' },
        { key: 'products', sql: 'SELECT content FROM products' },
        { key: 'sales', sql: 'SELECT content FROM sales ORDER BY updated_at DESC LIMIT 100' },
        { key: 'customers', sql: 'SELECT content FROM customers LIMIT 500' },
        { key: 'scraps', sql: 'SELECT content FROM scraps ORDER BY updated_at DESC LIMIT 50' },
        { key: 'expenses', sql: 'SELECT content FROM expenses ORDER BY updated_at DESC LIMIT 50' }
      ];

      await Promise.all(tasks.map(async (task) => {
        try {
          const [rows] = await connection!.query(task.sql);
          const rowArray = rows as any[];
          if (task.key === 'settings') {
            results[task.key] = rowArray.length > 0 ? JSON.parse(rowArray[0].content) : null;
          } else if (task.key === 'products') {
            results[task.key] = rowArray.map(r => {
              const parsed = JSON.parse(r.content);
              if (parsed.logs) delete parsed.logs;
              return parsed;
            });
          } else {
            results[task.key] = rowArray.map(r => JSON.parse(r.content));
          }
        } catch (e) {
          results[task.key] = [];
        }
      }));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch initial data' });
    } finally {
      if (connection) connection.release();
    }
  });

  app.get('/api/data/:type', async (req: Request, res: Response) => {
    if (!isDbReady) return res.status(503).json({ error: 'System is initializing. Please wait.' });
    const type = req.params.type as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
    
    // Validate table name to prevent SQL injection (even though it's internal)
    const allowedTables = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs', 'users', 'print_queue', 'messages'];
    if (!allowedTables.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      // Use standard query for flexibility with columns
      let sql = `SELECT content FROM ${type} ORDER BY updated_at DESC LIMIT ${limit}`;
      if (type === 'messages') sql = `SELECT * FROM messages ORDER BY created_at DESC LIMIT ${limit}`;
      
      const [rows] = await pool.query(sql);
      res.json((rows as any[]).map(row => JSON.parse(row.content || JSON.stringify(row))));
    } catch (error: any) {
      console.error(`Error fetching data for ${type}:`, error.message);
      // Fallback to order by ID if updated_at fails (e.g. migration hasn't run yet)
      try {
        const [rows] = await pool.query(`SELECT content FROM ${type} LIMIT ${limit}`);
        res.json((rows as any[]).map(row => JSON.parse(row.content)));
      } catch (innerError) {
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
      }
    }
  });

  app.post('/api/data/:type', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ error: 'Array expected' });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`DELETE FROM ${type}`);
      for (const item of data) {
        await connection.execute(`INSERT INTO ${type} (id, content) VALUES (?, ?)`, [item.id || 'default', JSON.stringify(item)]);
      }
      await connection.commit();
      res.json({ status: 'success' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ error: 'Failed to sync data' });
    } finally {
      connection.release();
    }
  });

  app.post('/api/data/:type/add', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const { item } = req.body;
    try {
      await pool.execute(`INSERT INTO ${type} (id, content) VALUES (?, ?)`, [item.id || Date.now().toString(), JSON.stringify(item)]);
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item' });
    }
  });

  app.delete('/api/data/:type/:id', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const id = req.params.id as string;
    try {
      await pool.execute(`DELETE FROM ${type} WHERE id = ?`, [id]);
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  app.post('/api/sales/add', async (req: Request, res: Response) => {
    const { sale } = req.body;
    try {
      await pool.execute('INSERT INTO sales (id, content) VALUES (?, ?)', [sale.id, JSON.stringify(sale)]);
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/logs/add', async (req: Request, res: Response) => {
    const { log } = req.body;
    try {
      await pool.execute('INSERT INTO logs (id, content) VALUES (?, ?)', [log.id, JSON.stringify(log)]);
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { product } = req.body;
    try {
      await pool.execute('UPDATE products SET content = ? WHERE id = ?', [JSON.stringify(product), id]);
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.put('/api/customers/:id', async (req: Request, res: Response) => {
     const { id } = req.params;
     const { customer } = req.body;
     try {
       await pool.execute('UPDATE customers SET content = ? WHERE id = ?', [JSON.stringify(customer), id]);
       res.json({ status: 'success' });
     } catch (error) {
       res.status(500).json({ error: 'Failed' });
     }
  });

  app.get('/api/pulse', async (req: Request, res: Response) => {
    try {
      const lastSync = req.query.lastSync as string || '0';
      const isPrintStation = req.query.printStation === 'true';
      
      const serverTime = new Date();
      const results: any = { 
        timestamp: serverTime.toISOString(), 
        products: [], 
        sales: [],
        customers: [],
        expenses: [],
        scraps: [],
        printQueue: []
      };

      if (lastSync !== '0') {
        // Use full ISO string with milliseconds for TIMESTAMP(3) compatibility
        const mysqlTimestamp = new Date(lastSync).toISOString().slice(0, 23).replace('T', ' ');
        
        // Parallel fetch for speed
        const [pRows, sRows, cRows, eRows, scRows] = await Promise.all([
          pool.query('SELECT content FROM products WHERE updated_at >= ?', [mysqlTimestamp]),
          pool.query('SELECT content FROM sales WHERE updated_at >= ?', [mysqlTimestamp]),
          pool.query('SELECT content FROM customers WHERE updated_at >= ?', [mysqlTimestamp]),
          pool.query('SELECT content FROM expenses WHERE updated_at >= ?', [mysqlTimestamp]),
          pool.query('SELECT content FROM scraps WHERE updated_at >= ?', [mysqlTimestamp])
        ]);

        results.products = (pRows[0] as any[]).map(r => JSON.parse(r.content));
        results.sales = (sRows[0] as any[]).map(r => JSON.parse(r.content));
        results.customers = (cRows[0] as any[]).map(r => JSON.parse(r.content));
        results.expenses = (eRows[0] as any[]).map(r => JSON.parse(r.content));
        results.scraps = (scRows[0] as any[]).map(r => JSON.parse(r.content));
      }

      if (isPrintStation) {
        const [queueRows] = await pool.execute('SELECT * FROM print_queue WHERE status = "pending" ORDER BY created_at ASC');
        results.printQueue = queueRows;
      }

      res.json(results);
    } catch (error) {
      console.error('Pulse error:', error);
      res.status(500).json({ error: 'Pulse failed' });
    }
  });

  app.use('/uploads', express.static(uploadDir));

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const staticPath = path.join(process.cwd(), 'dist');
    app.use(express.static(staticPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
