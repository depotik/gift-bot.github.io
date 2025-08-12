require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

const app = express();
const PORT = process.env.PORT || 3000;

// Генерация криптостойкого секрета для сессий
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
const BOT_TOKEN = process.env.BOT_TOKEN || "8244598423:AAEOFyBM3ljSJO2S6mSIBFpuDAuv5LN4Bfk";

// Конфигурация Redis
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Настройка middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['POST', 'GET'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '1kb' }));

// Конфигурация сессий с Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Функция проверки подписи Telegram с защитой от timing attacks
function verifyTelegramAuth(data, botToken) {
  const checkHash = data.hash;
  delete data.hash;
  
  const authDate = parseInt(data.auth_date, 10);
  if (Date.now() / 1000 - authDate > 86400) {
    return false;
  }

  const params = [];
  for (const [key, value] of Object.entries(data)) {
    params.push(`${key}=${value}`);
  }
  params.sort();
  
  const dataCheckString = params.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Сравнение с защитой от атак по времени
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash, 'utf8'),
    Buffer.from(checkHash, 'utf8')
  );
}

// Эндпоинт для проверки авторизации Telegram
app.post('/telegram_web_auth', (req, res) => {
  try {
    const initData = req.body.initData || '';
    if (!initData) {
      return res.status(400).json({ ok: false, error: "No initData provided" });
    }

    const authData = Object.fromEntries(
      new URLSearchParams(initData).entries()
    );

    if (!verifyTelegramAuth({ ...authData }, BOT_TOKEN)) {
      return res.status(401).json({ ok: false, error: "Invalid authentication" });
    }

    res.json({ 
      ok: true, 
      user: {
        id: authData.user?.id,
        first_name: authData.user?.first_name,
        last_name: authData.user?.last_name,
        username: authData.user?.username
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Эндпоинт для сохранения сессии
app.post('/telegram_auth', (req, res) => {
  const userId = req.body.user_id;
  if (!userId || !/^\d+$/.test(userId)) {
    return res.status(400).json({ ok: false, error: "Invalid user ID" });
  }

  req.session.userId = userId;
  res.json({ ok: true, message: "User authenticated" });
});

// Эндпоинт для проверки аутентификации
app.get('/check_auth', (req, res) => {
  res.json({ authenticated: !!req.session.userId, userId: req.session.userId });
});

// Эндпоинт для выхода
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ ok: false, error: "Logout failed" });
    }
    res.clearCookie('connect.sid');
    res.json({ ok: true, message: "Logged out" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: Using auto-generated session secret. Set SESSION_SECRET in production!');
  }
});
