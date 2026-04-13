
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
// Vite import moved inside startServer for better production compatibility


// Load environment variables
dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT: number = Number(process.env.PORT) || 3000;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Ensure uploads directory exists - use absolute path from process.cwd() for consistency
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Multer Configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Middleware
  app.use(compression());
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  
  // Middleware to ensure files are restored from DB if missing on disk
  app.use('/uploads/:filename', async (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      try {
        const [rows] = await pool.execute('SELECT data FROM uploaded_files WHERE filename = ?', [filename]);
        const files = rows as any[];
        if (files.length > 0) {
          // Restore the file to disk
          fs.writeFileSync(filePath, files[0].data);
          console.log(`Restored file from DB: ${filename}`);
        }
      } catch (err) {
        console.error(`Failed to restore file ${filename} from DB:`, err);
      }
    }
    next();
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // MySQL Connection Pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 20, // Increased connection limit
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });

  // Initialize Database Tables with retry logic
  const initDB = async (retries = 5) => {
    let connection;
    while (retries > 0) {
      try {
        connection = await pool.getConnection();
        console.log('Successfully connected to MySQL server');
        
        const tables = [
          {
            name: 'messages',
            sql: `CREATE TABLE IF NOT EXISTS messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              question TEXT,
              answer TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'products',
            sql: `CREATE TABLE IF NOT EXISTS products (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'sales',
            sql: `CREATE TABLE IF NOT EXISTS sales (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'customers',
            sql: `CREATE TABLE IF NOT EXISTS customers (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'scraps',
            sql: `CREATE TABLE IF NOT EXISTS scraps (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'settings',
            sql: `CREATE TABLE IF NOT EXISTS settings (
              id VARCHAR(50) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'expenses',
            sql: `CREATE TABLE IF NOT EXISTS expenses (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'logs',
            sql: `CREATE TABLE IF NOT EXISTS logs (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (created_at)
            )`
          },
          {
            name: 'users',
            sql: `CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(50) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'uploaded_files',
            sql: `CREATE TABLE IF NOT EXISTS uploaded_files (
              id INT AUTO_INCREMENT PRIMARY KEY,
              filename VARCHAR(255) UNIQUE NOT NULL,
              mimetype VARCHAR(100),
              data LONGBLOB NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
          },
          {
            name: 'print_queue',
            sql: `CREATE TABLE IF NOT EXISTS print_queue (
              id INT AUTO_INCREMENT PRIMARY KEY,
              product_data LONGTEXT,
              status ENUM('pending', 'completed') DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
          }
        ];

        for (const table of tables) {
          await connection.execute(table.sql);
          console.log(`Table ${table.name} checked/created`);
        }

        // Check if admin user exists, if not create default
        const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        if ((users as any[]).length === 0) {
          const hashedPassword = await bcrypt.hash('123456', 10);
          await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
          console.log('Default admin user created');
        }
        
        console.log('All database tables initialized successfully');
        return; // Success, exit the loop
      } catch (err) {
        retries--;
        console.error(`Database initialization attempt failed (${5 - retries}/5):`, err);
        if (retries === 0) {
          console.error('Database initialization failed after all retries.');
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } finally {
        if (connection) connection.release();
      }
    }
  };
  await initDB();
  
  // Restore all files from DB on startup to ensure they exist on the ephemeral disk
  const restoreFiles = async () => {
    try {
      const [rows] = await pool.execute('SELECT filename, data FROM uploaded_files');
      const files = rows as any[];
      if (files.length > 0) {
        console.log(`Restoring ${files.length} files from database...`);
        for (const file of files) {
          const filePath = path.join(uploadDir, file.filename);
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, file.data);
          }
        }
        console.log('File restoration complete.');
      }
    } catch (err) {
      console.error('Failed to restore files from DB on startup:', err);
    }
  };
  await restoreFiles();

  // Initialize Gemini API
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const JWT_SECRET = process.env.JWT_SECRET || 'nekogold-secret-key-2024';

  // Auth Endpoints
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      const users = rows as any[];

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, username: user.username });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/auth/change-password', async (req: Request, res: Response) => {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      const users = rows as any[];

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE users SET password = ? WHERE username = ?', [hashedNewPassword, username]);

      res.json({ status: 'success', message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // API Endpoint: /api/chat
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: "Sən NEKO GOLD zərgərlik mağazasının süni intellekt köməkçisisən. Müştərilərə zərgərlik məmulatları, qızılın qiyməti, məhsul növləri (üzük, sırğa, boyunbağı və s.) haqqında məlumat verirsən. Cavabların qısa, peşəkar və mehriban olmalıdır. Azərbaycan dilində danışırsan."
        }
      });

      const aiResponse = response.text || 'Üzr istəyirik, hazırda cavab verə bilmirəm.';
      
      try {
        const sql = 'INSERT INTO messages (question, answer) VALUES (?, ?)';
        await pool.execute(sql, [message, aiResponse]);
      } catch (dbErr) {
        console.warn('Database logging failed, but AI responded:', dbErr);
      }

      res.json({
        question: message,
        answer: aiResponse,
        status: 'success'
      });

    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // --- PRODUCT MANAGEMENT ENDPOINTS ---
  app.post('/api/products/add', async (req: Request, res: Response) => {
    const { product } = req.body;
    if (!product || !product.id) {
      return res.status(400).json({ error: 'Product data is required' });
    }

    try {
      const content = JSON.stringify(product);
      await pool.execute(
        'INSERT INTO products (id, content) VALUES (?, ?)',
        [product.id, content]
      );
      res.json({ status: 'success', message: 'Product added successfully' });
    } catch (error: any) {
      console.error('Failed to add product:', error);
      res.status(500).json({ error: 'Failed to add product', details: error.message });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { product } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Product data is required' });
    }

    try {
      const content = JSON.stringify(product);
      await pool.execute(
        'UPDATE products SET content = ? WHERE id = ?',
        [content, id]
      );
      res.json({ status: 'success', message: 'Product updated successfully' });
    } catch (error: any) {
      console.error('Failed to update product:', error);
      res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
  });

  app.delete('/api/products/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await pool.execute('DELETE FROM products WHERE id = ?', [id]);
      res.json({ status: 'success', message: 'Product deleted successfully' });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
  });

  app.get('/api/products/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.execute('SELECT content FROM products WHERE id = ?', [id]);
      const rowArray = rows as any[];
      if (rowArray.length > 0) {
        res.json(JSON.parse(rowArray[0].content));
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      res.status(500).json({ error: 'Failed to fetch product', details: error.message });
    }
  });

  app.post('/api/products/bulk-update', async (req: Request, res: Response) => {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const product of products) {
        const content = JSON.stringify(product);
        await connection.execute(
          'UPDATE products SET content = ? WHERE id = ?',
          [content, product.id]
        );
      }
      await connection.commit();
      res.json({ status: 'success', message: `${products.length} products updated successfully` });
    } catch (error: any) {
      await connection.rollback();
      console.error('Failed to bulk update products:', error);
      res.status(500).json({ error: 'Failed to bulk update products', details: error.message });
    } finally {
      connection.release();
    }
  });

  // Print Queue Endpoints
  app.post('/api/print-queue/add', async (req: Request, res: Response) => {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: 'Product data is required' });

    try {
      await pool.execute(
        'INSERT INTO print_queue (product_data) VALUES (?)',
        [JSON.stringify(product)]
      );
      res.json({ status: 'success' });
    } catch (error: any) {
      console.error('Failed to add to print queue:', error);
      res.status(500).json({ error: 'Failed to add to print queue' });
    }
  });

  app.get('/api/print-queue/pending', async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, product_data FROM print_queue WHERE status = "pending" ORDER BY created_at ASC'
      );
      res.json(rows);
    } catch (error: any) {
      console.error('Failed to fetch pending print jobs:', error);
      res.status(500).json({ error: 'Failed to fetch pending print jobs' });
    }
  });

  app.post('/api/print-queue/complete/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await pool.execute(
        'UPDATE print_queue SET status = "completed" WHERE id = ?',
        [id]
      );
      res.json({ status: 'success' });
    } catch (error: any) {
      console.error('Failed to complete print job:', error);
      res.status(500).json({ error: 'Failed to complete print job' });
    }
  });

  // Generic Data Sync Endpoints
  app.get('/api/data/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];
    
    if (typeof type !== 'string' || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    let connection: mysql.PoolConnection | undefined;
    try {
      if (type === 'settings') {
        const [rows] = await pool.query(`SELECT content FROM ${type}`);
        const rowArray = rows as any[];
        if (rowArray.length > 0) {
          res.json(JSON.parse(rowArray[0].content));
        } else {
          res.json(null);
        }
        return;
      }

      const isLight = req.query.light === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : null;

      // Optimization: Stream the response directly from MySQL to avoid loading everything into memory
      connection = await pool.getConnection();
      
      let query = `SELECT content FROM ${type}`;
      if (type === 'logs' && limit) {
        query += ` ORDER BY created_at DESC LIMIT ${limit}`;
      }
      
      // Optimization: For light products, remove heavy fields at the SQL level if possible
      if (isLight && type === 'products') {
        query = `SELECT JSON_REMOVE(content, '$.imageUrl', '$.logs') as content FROM products`;
      }
      
      // Use the underlying connection for streaming (mysql2/promise doesn't support streaming directly)
      const stream = (connection as any).connection.query(query).stream();
      
      // Handle client disconnect
      let isReleased = false;
      let hasError = false;
      const releaseConnection = () => {
        if (!isReleased && connection) {
          connection.release();
          isReleased = true;
        }
      };

      res.on('close', () => {
        hasError = true;
        stream.destroy();
        releaseConnection();
      });
      
      res.setHeader('Content-Type', 'application/json');
      res.write('[');
      
      let first = true;

      stream.on('data', (row: any) => {
        if (hasError) return;
        
        let content = row.content;
        if (!content) return;

        // If it's a light fetch but not optimized by SQL (e.g. logs), do it here
        if (isLight && type === 'logs') {
          try {
            const item = JSON.parse(content);
            // Logs don't have specific heavy fields to remove yet, but we could add some
            content = JSON.stringify(item);
          } catch (e) {
            console.warn(`Failed to parse content for ${type}:`, e);
          }
        }

        const chunk = (first ? '' : ',') + content;
        first = false;
        try {
          if (!res.write(chunk)) {
            stream.pause();
          }
        } catch (err) {
          hasError = true;
          console.error(`Write error for ${type}:`, err);
          stream.destroy();
          releaseConnection();
        }
      });
      
      res.on('drain', () => {
        stream.resume();
      });
      
      stream.on('end', () => {
        if (hasError) return;
        res.write(']');
        res.end();
        releaseConnection();
      });
      
      stream.on('error', (error: any) => {
        hasError = true;
        console.error(`Stream error for ${type}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to fetch data', 
            details: error instanceof Error ? error.message : String(error)
          });
        } else {
          res.end();
        }
        releaseConnection();
      });
    } catch (error) {
      if (connection) connection.release();
      console.error(`Failed to fetch ${type}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to fetch data', 
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Add a single sale
  app.post('/api/sales/add', async (req: Request, res: Response) => {
    const { sale } = req.body;
    if (!sale || !sale.id) return res.status(400).json({ error: 'Sale data required' });

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute(
        'INSERT INTO sales (id, content) VALUES (?, ?)',
        [sale.id, JSON.stringify(sale)]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error adding sale:', error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  // Update a single customer
  app.put('/api/customers/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { customer } = req.body;
    if (!customer) return res.status(400).json({ error: 'Customer data required' });

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute(
        'UPDATE customers SET content = ? WHERE id = ?',
        [JSON.stringify(customer), id]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  // Add a single log
  app.post('/api/logs/add', async (req: Request, res: Response) => {
    const { log } = req.body;
    if (!log) return res.status(400).json({ error: 'Log data required' });

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute(
        'INSERT INTO logs (id, content) VALUES (?, ?)',
        [log.id, JSON.stringify(log)]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error adding log:', error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  // Generic add single record
  app.post('/api/data/:type/add', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const { item } = req.body;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];
    
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
    if (!item || !item.id) return res.status(400).json({ error: 'Item data required' });

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute(
        `INSERT INTO ${type} (id, content) VALUES (?, ?)`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error adding to ${type}:`, error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  // Generic update/delete single record
  app.put('/api/data/:type/:id', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const id = req.params.id as string;
    const { item } = req.body;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];
    
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
    if (!item) return res.status(400).json({ error: 'Item data required' });

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute(
        `UPDATE ${type} SET content = ? WHERE id = ?`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error updating ${type}:`, error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  app.delete('/api/data/:type/:id', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const id = req.params.id as string;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];
    
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.execute(`DELETE FROM ${type} WHERE id = ?`, [id]);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting from ${type}:`, error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  app.post('/api/data/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const { data } = req.body;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];

    if (typeof type !== 'string' || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      if (type === 'settings') {
        const content = JSON.stringify(data);
        await pool.execute(
          `INSERT INTO settings (id, content) VALUES ('current', ?) ON DUPLICATE KEY UPDATE content = ?`,
          [content, content]
        );
      } else if (Array.isArray(data)) {
        // Optimization: Use a transaction and bulk insert with chunking
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          
          // Clear existing
          await connection.execute(`DELETE FROM ${type}`);
          
          if (data.length > 0) {
            // Prepare bulk insert in chunks to avoid max_allowed_packet issues
            const chunkSize = 1; // Set to 1 for maximum safety with large base64 images
            for (let i = 0; i < data.length; i += chunkSize) {
              const chunk = data.slice(i, i + chunkSize);
              const values = chunk.map(item => {
                const content = JSON.stringify(item);
                const id = item.id || Math.random().toString(36).substr(2, 9);
                return [id, content];
              });
              
              const sql = `INSERT INTO ${type} (id, content) VALUES ?`;
              await connection.query(sql, [values]);
            }
          }
          
          await connection.commit();
          console.log(`Successfully synced ${data.length} items to ${type}`);
        } catch (err) {
          await connection.rollback();
          console.error(`Transaction failed for ${type}:`, err);
          throw err;
        } finally {
          connection.release();
        }
      }
      
      res.json({ status: 'success' });
    } catch (error) {
      console.error(`Failed to save ${type} data:`, error);
      res.status(500).json({ 
        error: 'Failed to save data', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    let connection: mysql.PoolConnection | undefined;
    try {
      connection = await pool.getConnection();
      await connection.ping();
      res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(500).json({ status: 'error', database: 'disconnected', error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (connection) connection.release();
    }
  });

  // --- NEW ROUTES REQUESTED BY USER ---

  /**
   * @route GET /api/admin/full-system-backup
   * @desc Backup all database data and uploads folder into one ZIP
   */
  app.get('/api/admin/full-system-backup', async (req: Request, res: Response) => {
    try {
      const zip = new AdmZip();
      
      // 1. Fetch all database data
      const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];
      const allData: any = {};
      
      for (const type of allowedTypes) {
        const [rows] = await pool.execute(`SELECT content FROM ${type}`);
        allData[type] = (rows as any[]).map(row => JSON.parse(row.content));
        if (type === 'settings') allData[type] = allData[type][0] || null;
      }
      
      const backupMetadata = {
        data: allData,
        version: '1.0',
        timestamp: new Date().toISOString(),
        type: 'full_system_backup'
      };
      
      zip.addFile('backup_data.json', Buffer.from(JSON.stringify(backupMetadata, null, 2)));
      
      // 2. Add uploads folder
      if (fs.existsSync(uploadDir)) {
        zip.addLocalFolder(uploadDir, 'uploads');
      }
      
      const zipBuffer = zip.toBuffer();
      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', `attachment; filename=nekogold_full_backup_${Date.now()}.zip`);
      res.send(zipBuffer);
    } catch (error) {
      console.error('Full backup failed:', error);
      res.status(500).json({ error: 'Full backup failed' });
    }
  });

  /**
   * @route POST /api/admin/full-system-restore
   * @desc Restore all database data and uploads folder from a ZIP
   */
  app.post('/api/admin/full-system-restore', upload.single('backup'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const connection = await pool.getConnection();
    try {
      const zip = new AdmZip(req.file.path);
      const zipEntries = zip.getEntries();
      
      // 1. Restore Database Data
      const dataEntry = zipEntries.find((e: any) => e.entryName === 'backup_data.json');
      if (dataEntry) {
        const backupMetadata = JSON.parse(dataEntry.getData().toString('utf8'));
        const allData = backupMetadata.data;
        
        await connection.beginTransaction();
        
        const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings', 'expenses', 'logs'];
        for (const type of allowedTypes) {
          const data = allData[type];
          if (!data) continue;
          
          await connection.execute(`DELETE FROM ${type}`);
          
          if (type === 'settings') {
            const content = JSON.stringify(data);
            await connection.execute(
              `INSERT INTO settings (id, content) VALUES ('current', ?)`,
              [content]
            );
          } else if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
              const content = JSON.stringify(item);
              const id = item.id || Math.random().toString(36).substr(2, 9);
              await connection.execute(`INSERT INTO ${type} (id, content) VALUES (?, ?)`, [id, content]);
            }
          }
        }
        await connection.commit();
      }
      
      // 2. Restore Uploads Folder
      // We look for entries starting with 'uploads/'
      zipEntries.forEach((entry: any) => {
        if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
          const relativePath = entry.entryName.replace('uploads/', '');
          const targetPath = path.join(uploadDir, relativePath);
          const targetDirPath = path.dirname(targetPath);
          
          if (!fs.existsSync(targetDirPath)) {
            fs.mkdirSync(targetDirPath, { recursive: true });
          }
          
          fs.writeFileSync(targetPath, entry.getData());
        }
      });
      
      // Clean up the temporary backup file
      fs.unlinkSync(req.file.path);

      res.json({ message: 'Full system restore successful' });
    } catch (error) {
      await connection.rollback();
      console.error('Full restore failed:', error);
      res.status(500).json({ error: 'Full restore failed', details: String(error) });
    } finally {
      connection.release();
    }
  });

  /**
   * @route GET /api/admin/backup-uploads
   * @desc Backup the entire uploads directory as a ZIP file
   */
  app.get('/api/admin/backup-uploads', (req: Request, res: Response) => {
    try {
      const zip = new AdmZip();
      if (fs.existsSync(uploadDir)) {
        zip.addLocalFolder(uploadDir);
        const zipBuffer = zip.toBuffer();
        
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=uploads_backup_${Date.now()}.zip`);
        res.send(zipBuffer);
      } else {
        res.status(404).json({ error: 'Uploads directory not found' });
      }
    } catch (error) {
      console.error('Backup failed:', error);
      res.status(500).json({ error: 'Backup failed' });
    }
  });

  /**
   * @route POST /api/admin/restore-uploads
   * @desc Restore the uploads directory from a ZIP file
   */
  app.post('/api/admin/restore-uploads', upload.single('backup'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    try {
      const zip = new AdmZip(req.file.path);
      
      // Ensure uploadDir exists and is empty or we overwrite
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      zip.extractAllTo(uploadDir, true);
      
      // Clean up the temporary backup file
      fs.unlinkSync(req.file.path);

      res.json({ message: 'Uploads restored successfully' });
    } catch (error) {
      console.error('Restore failed:', error);
      res.status(500).json({ error: 'Restore failed' });
    }
  });

  /**
   * @route POST /api/upload-image
   * @desc Upload a single image using Multer and save to DB for persistence
   */
  app.post('/api/upload-image', upload.single('image'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Fayl yüklənmədi' });
    }

    try {
      // Save to database for persistence across restarts/redeployments
      const fileContent = fs.readFileSync(req.file.path);
      await pool.execute(
        'INSERT INTO uploaded_files (filename, mimetype, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = ?, mimetype = ?',
        [req.file.filename, req.file.mimetype, fileContent, fileContent, req.file.mimetype]
      );

      // Return the file path or URL
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        message: 'Şəkil uğurla yükləndi',
        imageUrl: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload to DB failed:', error);
      // Even if DB save fails, we still have it on disk for the current session
      const fileUrl = `/uploads/${req.file!.filename}`;
      res.json({
        message: 'Şəkil yükləndi (lakin verilənlər bazasına yazıla bilmədi)',
        imageUrl: fileUrl,
        filename: req.file!.filename
      });
    }
  });

  /**
   * @route POST /api/product
   * @desc Receive product data in JSON format
   */
  app.post('/api/product', (req: Request, res: Response) => {
    const { name, price, description, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Ad və qiymət tələb olunur' });
    }

    // Here you would typically save to database
    console.log('Received product data:', { name, price, description, imageUrl });

    res.json({
      message: 'Məhsul məlumatı qəbul edildi',
      product: { name, price, description, imageUrl }
    });
  });

  // --- END OF NEW ROUTES ---

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the dist directory in production
    const path = await import('path');
    
    // In production, server.js is inside 'dist', so static files are in the same directory
    const staticPath = process.env.NODE_ENV === 'production' ? __dirname : path.join(__dirname, 'dist');
    app.use(express.static(staticPath));
    
    // Handle SPA routing: serve index.html for all non-API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (req.path.startsWith('/uploads')) return next();
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  // Start the server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
