import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  zerion: {
    apiKey: process.env.ZERION_API_KEY,
    baseUrl: process.env.ZERION_BASE_URL || 'https://api.zerion.io',
    webhookSecret: process.env.ZERION_WEBHOOK_SECRET,
    webhookUrl: process.env.WEBHOOK_URL,
  },
  
  ai: {
    geminiKey: process.env.GEMINI_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
  },
};

// Validate required env vars
const required = ['ZERION_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`⚠️  Warning: ${key} is not set in environment variables`);
  }
}

