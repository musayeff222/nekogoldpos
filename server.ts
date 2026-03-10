
import express, { Request, Response } from 'express';
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
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  
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
            name: 'users',
            sql: `CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(50) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

  // Generic Data Sync Endpoints
  app.get('/api/data/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];
    
    if (typeof type !== 'string' || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      const [rows] = await pool.execute(`SELECT content FROM ${type}`);
      const rawData = (rows as any[]).map(row => JSON.parse(row.content));
      
      // Migration: Convert old /uploads/ paths to base64 if they exist
      const data = await Promise.all(rawData.map(async (item: any) => {
        if (item && item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('/uploads/')) {
          try {
            const filePath = path.join(process.cwd(), item.imageUrl);
            if (fs.existsSync(filePath)) {
              const fileData = fs.readFileSync(filePath);
              const ext = path.extname(filePath).slice(1) || 'jpeg';
              item.imageUrl = `data:image/${ext};base64,${fileData.toString('base64')}`;
            }
          } catch (err) {
            console.warn(`Failed to migrate image ${item.imageUrl}:`, err);
          }
        }
        return item;
      }));
      
      // Settings is a special case, it's usually just one object
      if (type === 'settings') {
        res.json(data[0] || null);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch data', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/data/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const { data } = req.body;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];

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
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(500).json({ status: 'error', database: 'disconnected', error: err instanceof Error ? err.message : String(err) });
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
      const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];
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
        
        const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];
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
   * @desc Upload a single image using Multer
   */
  app.post('/api/upload-image', upload.single('image'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Fayl yüklənmədi' });
    }

    // Return the file path or URL
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'Şəkil uğurla yükləndi',
      imageUrl: fileUrl,
      filename: req.file.filename
    });
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
