
import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// Vite import moved inside startServer for better production compatibility


// Load environment variables
dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT: number = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

  // Generic Data Sync Endpoints
  app.get('/api/data/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];
    
    if (typeof type !== 'string' || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      const [rows] = await pool.execute(`SELECT content FROM ${type}`);
      const data = (rows as any[]).map(row => JSON.parse(row.content));
      
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
            const chunkSize = 100; // Process 100 items at a time
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
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // In production, server.js is inside 'dist', so static files are in the same directory
    const staticPath = process.env.NODE_ENV === 'production' ? __dirname : path.join(__dirname, 'dist');
    app.use(express.static(staticPath));
    
    // Handle SPA routing: serve index.html for all non-API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  // Start the server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
