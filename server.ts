
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
  // We check both current directory and parent directory to support various hosting setups (like Hostinger/cPanel)
  let publicHtmlDir = path.resolve(process.cwd(), 'public_html');
  let uploadDir = path.resolve(process.cwd(), 'uploads');

  // Check if we are running inside a subfolder (like 'nodejs' or 'dist') and the target folders are in the parent
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
    try {
      fs.mkdirSync(publicHtmlDir, { recursive: true });
    } catch (e) {}
  }
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {}
  }

  console.log('Public HTML directory:', publicHtmlDir);
  console.log('Uploads directory:', uploadDir);

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
  
  // Security middleware to block common bot scans and reduce load
  app.use((req, res, next) => {
    const forbiddenPaths = [
      '/wordpress', '/wp-admin', '/wp-login', '/xmlrpc.php', 
      '/.env', '/config.php', '/setup-config.php', '/phpmyadmin'
    ];
    if (forbiddenPaths.some(path => req.path.toLowerCase().includes(path))) {
      return res.status(403).end();
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // MySQL Connection Pool - Optimized for shared hosting (Hostinger)
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 15, // Slightly increased to handle more concurrent light requests
    queueLimit: 0,
    connectTimeout: 20000, // 20s initial connection timeout
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
              updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
              INDEX (updated_at)
            )`
          },
          {
            name: 'sales',
            sql: `CREATE TABLE IF NOT EXISTS sales (
              id VARCHAR(100) PRIMARY KEY,
              content LONGTEXT,
              updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
              INDEX (updated_at)
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
            name: 'print_queue',
            sql: `CREATE TABLE IF NOT EXISTS print_queue (
              id INT AUTO_INCREMENT PRIMARY KEY,
              product_data LONGTEXT,
              status ENUM('pending', 'completed') DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (status, created_at)
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
        
        // Ensure index exists for print_queue
        try {
          await connection.execute('CREATE INDEX IF NOT EXISTS idx_status_created ON print_queue (status, created_at)');
        } catch (e) {
          // Ignore if index already exists or syntax not supported
        }
        
        // Ensure indices exist for performance
        const indices = [
          { table: 'products', col: 'updated_at' },
          { table: 'sales', col: 'updated_at' },
          { table: 'customers', col: 'updated_at' },
          { table: 'expenses', col: 'updated_at' }
        ];

        for (const idx of indices) {
          try {
            await connection.execute(`CREATE INDEX IF NOT EXISTS idx_${idx.table}_${idx.col} ON ${idx.table} (${idx.col})`);
          } catch (e) {
            // Silently ignore if already exists or not supported
          }
        }

        // Migration: Upgrade to millisecond precision for reliable sync
        try {
          await connection.execute('ALTER TABLE products MODIFY updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
          await connection.execute('ALTER TABLE sales MODIFY updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
          console.log('Timestamp precision upgraded to ms');
        } catch (e) {
          // Silently ignore if already set or error
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

  app.post('/api/notify/telegram', async (req: Request, res: Response) => {
    const { message, chatIds } = req.body;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN) {
      console.warn('Telegram Bot Token is missing');
      return res.status(200).json({ status: 'skipped', reason: 'token_not_configured' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Determine target chat IDs
    let targets: string[] = [];
    if (Array.isArray(chatIds) && chatIds.length > 0) {
      targets = chatIds;
    } else if (DEFAULT_CHAT_ID) {
      targets = [DEFAULT_CHAT_ID];
    }

    if (targets.length === 0) {
      return res.status(200).json({ status: 'skipped', reason: 'no_chat_ids_provided' });
    }

    try {
      const results = await Promise.all(targets.map(async (id) => {
        try {
          if (req.body.imageUrl) {
            // Use sendPhoto
            const photoUrl = req.body.imageUrl.startsWith('http') 
              ? req.body.imageUrl 
              : `${req.protocol}://${req.get('host')}${req.body.imageUrl.startsWith('/') ? '' : '/'}${req.body.imageUrl}`;

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: id,
                photo: photoUrl,
                caption: message,
                parse_mode: 'HTML'
              })
            });
            const data = await response.json();
            
            // If sendPhoto fails (e.g. image too big or invalid), fallback to sendMessage
            if (!data.ok) {
              console.warn(`Telegram sendPhoto failed for ${id}, falling back to sendMessage:`, data);
              const fallbackResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: id,
                  text: message,
                  parse_mode: 'HTML'
                })
              });
              return await fallbackResponse.json();
            }
            return data;
          } else {
            // Use sendMessage
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: id,
                text: message,
                parse_mode: 'HTML'
              })
            });
            return await response.json();
          }
        } catch (e) {
          console.error(`Failed to send to ${id}:`, e);
          return { error: true, id };
        }
      }));

      res.json({ status: 'success', results });
    } catch (error) {
      console.error('Telegram notification error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // --- TELEGRAM BOT STATE MANAGEMENT ---
  const botStates: { [chatId: string]: { 
    step: string; 
    data: Partial<any>; 
    lastMessageId?: number;
  } } = {};

  const calculatePrice = (weight: number, carat: string, brilliant: string, settings: any) => {
    if (!weight || isNaN(weight)) return 0;
    
    let gramPrice = settings.pricePerGram || 0;
    if (carat === '750' || carat === '18') {
      gramPrice = settings.pricePerGram750 || 0;
    }
    
    let total = weight * gramPrice;
    
    if (brilliant) {
      const match = brilliant.match(/(\d+(\.\d+)?)/);
      if (match) {
        const ct = parseFloat(match[1]);
        total += ct * (settings.pricePerBrilliant || 1000);
      }
    }
    
    return Math.round(total / 10) * 10;
  };

  const getNextCode = async (prefix: string) => {
    try {
      const [rows] = await pool.query('SELECT content FROM products');
      const products = (rows as any[]).map(r => JSON.parse(r.content));
      
      const filtered = products.filter(p => p.code.startsWith(prefix));
      if (filtered.length === 0) return `${prefix}101`;

      const codes = filtered.map(p => {
        const numPart = p.code.replace(prefix, '');
        const num = parseInt(numPart);
        return isNaN(num) ? 0 : num;
      });

      const maxCode = Math.max(...codes);
      return `${prefix}${maxCode + 1}`;
    } catch (e) {
      return `${prefix}${Date.now().toString().slice(-3)}`;
    }
  };

  // --- TELEGRAM BOT WEBHOOK ---
  app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
    // Respond to Telegram immediately
    res.sendStatus(200);

    const { message, callback_query } = req.body;
    const photo = message?.photo;
    
    const chatId = message?.chat?.id?.toString() || callback_query?.message?.chat?.id?.toString();
    if (!chatId) return;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) return;

    const sendResponse = async (txt: string, keyboard?: any) => {
      try {
        const body: any = { chat_id: chatId, text: txt, parse_mode: 'HTML' };
        if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
        
        const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return await resp.json();
      } catch (e) {
        console.error('Failed to send telegram message response:', e);
      }
    };

    const answerCallback = async (callbackId: string, txt?: string) => {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackId, text: txt })
        });
      } catch (e) {}
    };

    // 1. Fetch settings to check authorization
    let settings: any = null;
    try {
      const [rows] = await pool.query('SELECT content FROM settings WHERE id = "current"');
      if ((rows as any[]).length > 0) {
        settings = JSON.parse((rows as any[])[0].content);
      }
    } catch (e) {}

    const authorizedIds = settings?.telegramChatIds || [];
    if (authorizedIds.length > 0 && !authorizedIds.includes(chatId)) {
       const text = message?.text || '';
       if (text.startsWith('/')) {
         await sendResponse(`❌ Sizin Chat ID (<code>${chatId}</code>) səlahiyyətli deyil. Zəhmət olmasa Ayarlar bölməsindən bu ID-ni əlavə edin.`);
       }
       return;
    }

    // 2. Handle Callback Queries (Buttons)
    if (callback_query) {
      await answerCallback(callback_query.id);
      const data = callback_query.data;
      const state = botStates[chatId];

      if (!state) return;

      if (state.step === 'CHOOSING_CATEGORY') {
        const group = settings.productGroups.find((g: any) => g.name === data);
        if (group) {
          state.data.type = group.name;
          state.data.prefix = group.prefix;
          state.step = 'ENTERING_NAME';
          await sendResponse(`✅ Kateqoriya seçildi: <b>${group.name}</b>\n\n📝 Məhsulun ADINI daxil edin:`);
        }
      } else if (state.step === 'CHOOSING_CARAT') {
        state.data.carat = data;
        state.step = 'ENTERING_WEIGHT';
        await sendResponse(`✅ Əyar seçildi: <b>${data}</b>\n\n⚖️ Məhsulun ÇƏKİSİNİ daxil edin (məs: 3.45):`);
      } else if (state.step === 'CONFIRMING') {
        if (data === 'confirm_yes') {
          const product = state.data;
          product.id = Math.random().toString(36).substr(2, 9);
          product.purchaseDate = new Date().toISOString();
          product.stockCount = 1;
          product.logs = [{ 
            date: new Date().toISOString(), 
            action: 'Telegram Bot vasitəsilə əlavə edildi',
            details: `ChatID: ${chatId}`
          }];

          try {
            await pool.execute('INSERT INTO products (id, content) VALUES (?, ?)', [product.id, JSON.stringify(product)]);
            await pool.execute('INSERT INTO print_queue (product_data) VALUES (?)', [JSON.stringify(product)]);
            
            const systemLog = {
              id: Math.random().toString(36).substr(2, 9),
              date: new Date().toISOString(),
              user: `Bot (${chatId})`,
              action: 'Məhsul Əlavə Edildi',
              details: `${product.name} (${product.code}) - ${product.weight}gr`,
              category: 'PRODUCT'
            };
            await pool.execute('INSERT INTO logs (id, content) VALUES (?, ?)', [systemLog.id, JSON.stringify(systemLog)]);

            await sendResponse(`🎊 <b>Məhsul uğurla stoka əlavə edildi!</b>\n\n🆔 Kod: ${product.code}`);
          } catch (err: any) {
            await sendResponse(`❌ Xəta baş verdi: ${err.message}`);
          }
          delete botStates[chatId];
        } else {
          await sendResponse(`❌ Əməliyyat ləğv edildi.`);
          delete botStates[chatId];
        }
      }
      return;
    }

    // 3. Handle Text Messages
    const text = message?.text || message?.caption || '';
    
    if (text === '/cancel') {
      delete botStates[chatId];
      await sendResponse('❌ Əməliyyat ləğv edildi.');
      return;
    }

    if (text === '/start' || text === '/help') {
      await sendResponse(`👋 <b>NEKO GOLD Botuna xoş gəlmisiniz!</b>\n\n🛍️ Məhsul əlavə etmək üçün /mesul komandasını yazın.`);
      return;
    }

    if (text === '/mesul') {
      botStates[chatId] = { step: 'CHOOSING_CATEGORY', data: {} };
      const categories = (settings.productGroups || []).map((g: any) => ([{ text: g.name, callback_data: g.name }]));
      await sendResponse('📂 Zəhmət olmasa <b>KATEQORİYA</b> seçin:', categories);
      return;
    }

    const state = botStates[chatId];
    if (state) {
      if (state.step === 'ENTERING_NAME') {
        state.data.name = text;
        state.step = 'CHOOSING_CARAT';
        const carats = (settings.carats || ['585', '750']).map((c: string) => ([{ text: c, callback_data: c }]));
        await sendResponse(`🏷️ Ad: <b>${text}</b>\n\n💎 <b>ƏYAR (Eyar)</b> seçin:`, carats);
      } else if (state.step === 'ENTERING_WEIGHT') {
        const weight = parseFloat(text.replace(',', '.'));
        if (isNaN(weight)) {
          await sendResponse('⚠️ Zəhmət olmasa rəqəm daxil edin (məs: 5.20):');
          return;
        }
        state.data.weight = weight;
        state.step = 'ENTERING_BRILLIANT';
        await sendResponse(`⚖️ Çəki: <b>${weight} gr</b>\n\n💎 <b>Brilliant/Daş</b> məlumatı varsa daxil edin (yoxdursa "/" və ya "yox" yazın):`);
      } else if (state.step === 'ENTERING_BRILLIANT') {
        state.data.brilliant = (text === '/' || text.toLowerCase() === 'yox') ? '' : text;
        
        // Final calculations
        const code = await getNextCode(state.data.prefix);
        state.data.code = code;
        state.data.price = calculatePrice(state.data.weight, state.data.carat, state.data.brilliant, settings);
        state.data.supplierPrice = Math.round(state.data.price * 0.8 / 10) * 10; // Default 20% margin for supplier price if not known
        state.data.supplier = settings.suppliers?.[0] || 'Təyin edilməyib';

        const summary = `📝 <b>Məhsul Xülasəsi:</b>\n\n` +
                        `🆔 Kod: <b>${state.data.code}</b>\n` +
                        `📦 Ad: <b>${state.data.name}</b>\n` +
                        `💎 Əyar: <b>${state.data.carat}</b>\n` +
                        `⚖️ Çəki: <b>${state.data.weight} gr</b>\n` +
                        `✨ Daş: <b>${state.data.brilliant || 'Yox'}</b>\n` +
                        `💰 Satış Qiyməti: <b>${state.data.price} AZN</b>\n\n` +
                        `Təsdiq edirsiniz?`;
        
        state.step = 'CONFIRMING';
        await sendResponse(summary, [
          [{ text: '✅ Hə (Əlavə et)', callback_data: 'confirm_yes' }],
          [{ text: '❌ Yox (Ləğv et)', callback_data: 'confirm_no' }]
        ]);
      }
      return;
    }

    // Keep the old /yeni command for users who prefer it (backward compatibility)
    if (text.startsWith('/yeni')) {
        // ... (rest of the /yeni logic remains largely same or I could just remove it and keep the new one)
      const parts = text.split(/\s+/).slice(1);
      if (parts.length < 8) {
        await sendResponse(`⚠️ <b>Səhv format!</b> Bütün məlumatları qeyd edin:\n<code>/yeni Kod Ad Əyar Çəki Alış Satış Tədarükçü Kateqoriya</code>`);
        return;
      }

      // Handle cases where name or supplier might have spaces - actually splitting by space won't work perfectly for spaced names
      // But let's assume simple space separated for now or ask user to use underscores
      // Improved: take first part as code, last parts as specific fields, and everything in between as name
      const code = parts[0];
      const type = parts[parts.length - 1];
      const supplier = parts[parts.length - 2];
      const sellPriceStr = parts[parts.length - 3];
      const buyPriceStr = parts[parts.length - 4];
      const weightStr = parts[parts.length - 5];
      const carat = parts[parts.length - 6];
      
      // Name is everything in between
      const name = parts.slice(1, parts.length - 6).join(' ');

      const weight = parseFloat(weightStr.replace(',', '.'));
      const buyPrice = parseFloat(buyPriceStr);
      const sellPrice = parseFloat(sellPriceStr);

      if (!name || isNaN(weight) || isNaN(buyPrice) || isNaN(sellPrice)) {
        await sendResponse(`⚠️ <b>Məlumat xətası!</b> Ad, çəki və qiymətləri düzgün daxil edin.`);
        return;
      }

      let imageUrl = null;
      if (photo && photo.length > 0) {
        try {
          const fileId = photo[photo.length - 1].file_id;
          const fileInfoResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
          const fileInfo = await fileInfoResp.json();
          
          if (fileInfo.ok) {
            const filePath = fileInfo.result.file_path;
            const fileDownloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
            
            const imgResp = await fetch(fileDownloadUrl);
            const buffer = await imgResp.arrayBuffer();
            
            const fileName = `tg-${Date.now()}-${path.basename(filePath)}`;
            const localPath = path.join(uploadDir, fileName);
            fs.writeFileSync(localPath, Buffer.from(buffer));
            imageUrl = `/uploads/${fileName}`;
          }
        } catch (imgErr) {
          console.error('Failed to handle telegram photo:', imgErr);
        }
      }

      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        code,
        name,
        carat,
        weight,
        supplierPrice: buyPrice,
        price: sellPrice,
        supplier,
        type,
        stockCount: 1,
        purchaseDate: new Date().toISOString(),
        imageUrl,
        logs: [{ 
          date: new Date().toISOString(), 
          action: 'Telegram vasitəsilə əlavə edildi',
          details: `ChatID: ${chatId}`
        }]
      };

      try {
        await pool.execute(
          'INSERT INTO products (id, content) VALUES (?, ?)',
          [newProduct.id, JSON.stringify(newProduct)]
        );
        await pool.execute(
          'INSERT INTO print_queue (product_data) VALUES (?)',
          [JSON.stringify(newProduct)]
        );
        
        const systemLog = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          user: `Telegram (${chatId})`,
          action: 'Məhsul Əlavə Edildi',
          details: `${newProduct.name} (${newProduct.code}) - ${newProduct.weight}gr`,
          category: 'PRODUCT'
        };
        await pool.execute('INSERT INTO logs (id, content) VALUES (?, ?)', [systemLog.id, JSON.stringify(systemLog)]);

        await sendResponse(`✅ <b>Məhsul əlavə edildi!</b>\n\n🆔 <b>Kod:</b> ${code}\n📦 <b>Ad:</b> ${name}\n💎 <b>Əyar:</b> ${carat}\n⚖️ <b>Çəki:</b> ${weight} gr\n💰 <b>Satış:</b> ${sellPrice} AZN\n🏢 <b>Tədarükçü:</b> ${supplier}\n📁 <b>Kateqoriya:</b> ${type}`);
      } catch (err: any) {
        console.error('Failed to add product via telegram:', err);
        await sendResponse(`❌ <b>Xəta baş verdi:</b> ${err.message}`);
      }
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
      
      const getTimestampCol = (type: string) => (type === 'logs' || type === 'print_queue' || type === 'messages') ? 'created_at' : 'updated_at';
      
      let query = `SELECT content FROM ${type}`;
      if (limit) {
        query = `SELECT content FROM ${type} ORDER BY ${getTimestampCol(type)} DESC LIMIT ${limit}`;
      } else if (type === 'products') {
        query = `SELECT content FROM products`;
      }
      
      // Optimization: For light products, keep the URL if it's a short path, but remove deep logs
      if (isLight && type === 'products') {
        // Handled below in the stream logic more generically or we can just leave the query as is
        query = `SELECT content FROM products`;
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

        // If it's a light fetch, cleanup the content JSON
        if (isLight) {
          try {
            const item = JSON.parse(content);
            if (type === 'products') {
              delete item.logs;
              delete item.imageUrl;
              delete item.image;
            }
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
            const chunkSize = 50; // Increased chunk size for better performance
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

  // Consolidated Init Data Endpoint to reduce network requests
  app.get('/api/init-data', async (req: Request, res: Response) => {
    try {
      const results: any = {};
      
      // Define queries for initial load (Minimal data for fast first paint)
      const tasks = [
        { key: 'settings', sql: `SELECT content FROM settings LIMIT 1` },
        { key: 'logs', sql: `SELECT content FROM logs ORDER BY created_at DESC LIMIT 50` },
        { key: 'products', sql: `SELECT content FROM products` },
        { key: 'sales', sql: `SELECT content FROM sales ORDER BY updated_at DESC LIMIT 100` },
        { key: 'customers', sql: `SELECT content FROM customers LIMIT 500` },
        { key: 'scraps', sql: `SELECT content FROM scraps ORDER BY updated_at DESC LIMIT 50` },
        { key: 'expenses', sql: `SELECT content FROM expenses ORDER BY updated_at DESC LIMIT 50` }
      ];

      // Run queries in parallel for efficiency
      await Promise.all(tasks.map(async (task) => {
        try {
          const [rows] = await pool.query(task.sql);
          const rowArray = rows as any[];
          
          if (task.key === 'settings') {
            results[task.key] = rowArray.length > 0 ? JSON.parse(rowArray[0].content) : null;
          } else {
            results[task.key] = rowArray.map(r => {
              try {
                const item = JSON.parse(r.content);
                if (task.key === 'products') {
                  delete item.logs;
                  delete item.imageUrl;
                  delete item.image; // Just in case
                }
                return item;
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
          }
        } catch (e) {
          console.error(`Init query failed for ${task.key}:`, e);
          results[task.key] = [];
        }
      }));
      
      res.json(results);
    } catch (error) {
      console.error('Failed to fetch init data:', error);
      res.status(500).json({ error: 'Failed to fetch initial data', details: String(error) });
    }
  });

  // Pulse/Heartbeat endpoint for efficient synchronization
  app.get('/api/pulse', async (req: Request, res: Response) => {
    try {
      const lastSync = req.query.lastSync as string || '0';
      const isPrintStation = req.query.printStation === 'true';

      const results: any = {
        timestamp: new Date().toISOString(),
        products: [],
        sales: [],
        printQueue: []
      };

      // 1. Get products updated since last sync (approximate using updated_at)
      if (lastSync !== '0') {
        let lastSyncDate: Date;
        try {
          lastSyncDate = new Date(lastSync);
          if (isNaN(lastSyncDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (e) {
          // If date is invalid, just use a very old date to get everything or return empty
          lastSyncDate = new Date(0);
        }

        // Optimization: For products updated since last sync, we use >= to avoid missing items 
        // that happened in the same millisecond, client handles deduplication by ID.
        const mysqlTimestamp = lastSyncDate.toISOString().slice(0, 23).replace('T', ' ');

        try {
          const [pRows] = await pool.execute(
            'SELECT content FROM products WHERE updated_at >= ?',
            [mysqlTimestamp]
          );
          results.products = (pRows as any[]).map(r => {
            try {
              const item = JSON.parse(r.content);
              delete item.logs;
              delete item.imageUrl;
              delete item.image;
              return item;
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
        } catch (e) {
          console.error('Pulse products check failed:', e);
        }

        try {
          const [sRows] = await pool.execute(
            'SELECT content FROM sales WHERE updated_at >= ?',
            [mysqlTimestamp]
          );
          results.sales = (sRows as any[]).map(r => JSON.parse(r.content));
        } catch (e) {
          console.error('Pulse sales check failed:', e);
        }
      }

      // 2. Get print queue if this is a station
      if (isPrintStation) {
        try {
          const [qRows] = await pool.execute(
            'SELECT id, product_data FROM print_queue WHERE status = "pending" ORDER BY created_at ASC'
          );
          results.printQueue = qRows;
        } catch (e) {
          console.error('Pulse print queue check failed:', e);
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Pulse overall failure:', error);
      res.status(500).json({ error: 'Pulse failed', details: error instanceof Error ? error.message : String(error) });
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
