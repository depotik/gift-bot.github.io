export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const config = {
    status: true,
    botUsername: process.env.BOT_USERNAME || "gifterint_official_bot",
    domain: process.env.DOMAIN || "depotik.github.io/gift-bot.github.io",
    environment: process.env.NODE_ENV || 'production'
  };

  res.status(200).json(config);
}
