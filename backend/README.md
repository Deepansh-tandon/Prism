# Prism Backend

AI-powered crypto portfolio analysis & social trading intelligence platform.

## 🚀 Features

- **Portfolio Analysis**: Analyze wallet holdings using Zerion API
- **AI Personality Detection**: Rule-based personality classification (8 types)
- **Risk Scoring**: Calculate portfolio risk (1-10 scale)
- **Auto-Generated Bios**: Create trading stories from wallet history
- **Similarity Matching**: Find similar wallets using cosine similarity
- **Real-time Feed**: WebSocket-powered activity feed from similar wallets
- **Webhook Integration**: Zerion webhook processing for live updates

## 📁 Structure

```
backend/
├── config/
│   ├── env.js              # Environment configuration
│   └── database.js         # Prisma client
├── controller/
│   ├── portfolio.controller.js
│   ├── analysis.controller.js
│   ├── profile.controller.js
│   ├── feed.controller.js
│   ├── discover.controller.js
│   └── webhook.controller.js
├── routes/
│   ├── portfolio.routes.js
│   ├── analysis.routes.js
│   ├── profile.routes.js
│   ├── feed.routes.js
│   ├── discover.routes.js
│   └── webhook.routes.js
├── services/
│   ├── zerion/
│   │   └── client.js       # Zerion API wrapper
│   ├── analysis/
│   │   ├── analyzer.js     # Main analysis engine
│   │   ├── personality.js  # Personality classification
│   │   ├── risk.js         # Risk scoring
│   │   └── insights.js     # Strengths/weaknesses/recommendations
│   ├── profile/
│   │   └── bioGenerator.js # Auto-bio generation
│   ├── similarity/
│   │   └── matcher.js      # Similarity algorithm
│   └── feed/
│       └── processor.js    # Webhook event processing
├── middleware/
│   └── errorHandler.js
├── prisma/
│   └── schema.prisma       # Database schema
└── server.js               # Entry point
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

**Required variables:**
- `ZERION_API_KEY` - Get from https://zerion.io/api
- `DATABASE_URL` - PostgreSQL connection string
- `WEBHOOK_URL` - Your public webhook endpoint (use ngrok for local dev)

**Optional variables:**
- `ZERION_WEBHOOK_SECRET` - For webhook signature verification (production recommended)
- `GEMINI_API_KEY` - For AI-enhanced analysis
- `REDIS_URL` - Redis connection string (for caching)

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Setup Webhooks (for real-time features)

**Local Development:**
```bash
# Install ngrok
npm install -g ngrok

# Run ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add to .env as WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/zerion
```

**Production:**
```bash
# Set WEBHOOK_URL to your deployed API
WEBHOOK_URL=https://api.yourapp.com/api/webhooks/zerion
```

### 5. Start Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 📡 API Endpoints

### Portfolio

- `GET /api/portfolio/:address` - Get portfolio data
- `GET /api/portfolio/:address/history` - Get transaction history

### Analysis

- `GET /api/analysis/:address` - Get cached analysis
- `POST /api/analysis/:address` - Trigger new analysis

### Profile

- `GET /api/profile/:address` - Get user profile
- `POST /api/profile/onboard` - Onboard new user (full analysis + bio + similarity)

### Feed

- `GET /api/feed/:address` - Get personalized activity feed
- `GET /api/feed/:address/recent` - Get recent activity

### Discovery

- `GET /api/discover/similar/:address` - Get similar wallets
- `GET /api/discover?personality=X&minRiskScore=Y` - Browse wallets

### Webhooks

- `POST /api/webhooks/zerion` - Receive Zerion webhook events

### Subscriptions

- `GET /api/subscriptions` - List all active webhook subscriptions
- `DELETE /api/subscriptions/:id` - Delete a subscription

## 🔌 WebSocket Events

Connect to `ws://localhost:3000`

### Client → Server

```javascript
socket.emit('subscribe', walletAddress);
```

### Server → Client

```javascript
socket.on('activity', (data) => {
  // New activity from tracked wallet
  console.log(data);
});
```

## 🧠 Analysis Engine

### Personality Types

1. **Conservative DeFi Native** - Balanced bluechip + DeFi
2. **Degen Trader** - High frequency, low bluechip
3. **Blue-chip Hodler** - 70%+ ETH/BTC, low activity
4. **Multi-chain Explorer** - 4+ chains
5. **Yield Farmer** - 5+ DeFi protocols
6. **Stablecoin Parker** - 60%+ stablecoins
7. **NFT Collector** - NFT-focused
8. **Balanced Trader** - Default/mixed

### Risk Score Calculation

Factors:
- Stablecoin % (higher = lower risk)
- Blue-chip % (higher = lower risk)
- Concentration (higher = higher risk)
- Chain diversity (more = slightly higher risk)
- Protocol count (more = higher complexity)

Scale: 1 (very safe) → 10 (very risky)

## 🔄 Data Flow

### Onboarding Flow

```
1. POST /api/profile/onboard { address }
2. Fetch portfolio from Zerion
3. Fetch transaction history
4. Run analysis (personality, risk, insights)
5. Generate bio (timeline, badges, stats)
6. Find similar wallets (cosine similarity)
7. Subscribe to webhooks
8. Save to database
9. Return complete profile
```

### Real-time Updates

```
1. Zerion webhook fires (tracked wallet activity)
2. POST /api/webhooks/zerion
3. Parse event
4. Save to Activity table
5. Find users tracking this wallet
6. Broadcast via WebSocket to those users
7. Frontend receives and updates feed
```

## 🗄️ Database Models

### User
- Basic wallet info
- Portfolio snapshot (cached)
- Analysis results
- Bio/profile data

### SimilarityEdge
- Links users to similar wallets
- Stores similarity score (0-1)

### Activity
- Feed events from webhooks
- Transaction details
- Linked to user

### TrackedWallet
- Wallets being monitored
- Webhook subscription IDs
- Track count (how many users follow)

## 🧪 Testing

```bash
# Test portfolio endpoint
curl http://localhost:3000/api/portfolio/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Test onboarding
curl -X POST http://localhost:3000/api/profile/onboard \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

## 📝 TODO

- [ ] Add Redis caching layer
- [ ] Implement BullMQ job queue
- [ ] Add Gemini AI for enhanced summaries
- [ ] Webhook signature verification
- [ ] Rate limiting
- [ ] API authentication
- [ ] Database query optimization
- [ ] Error monitoring (Sentry)

## 🤝 Contributing

Keep code simple and clean [[memory:7408218]].

## 📄 License

ISC

