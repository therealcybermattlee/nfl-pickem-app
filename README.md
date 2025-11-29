# NFL Pick'em Web Application

A modern, production-ready web application for managing NFL pick'em pools where users can make weekly game predictions and compete against friends and family.

**Live Production:** [https://pickem.cyberlees.dev](https://pickem.cyberlees.dev)

## Features

### Core Functionality
- **User Authentication**: JWT-based secure login and registration
- **Live NFL Data**: Real-time game schedules and scores from ESPN API
- **Time-Lock Picks**: Automatic lockout when games start - no late submissions
- **Auto-Pick System**: Random picks generated for users who miss deadlines
- **Live Scoring**: Automatic point calculation with cron jobs every 15 minutes
- **Leaderboards**: Track standings by week and season with live updates
- **Pick History**: View all past picks with win/loss tracking

### User Experience
- **PWA Support**: Install as mobile app with offline capabilities
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Mode**: Full dark theme support
- **Real-Time Updates**: Live countdown timers and score updates
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Tech Stack

- **Frontend**: Vite 5.0+, React 18.2+, TypeScript 5.2+
- **Styling**: Tailwind CSS 3.3+
- **Backend**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Authentication**: Custom JWT with bcryptjs
- **Deployment**: Cloudflare Pages (frontend) + Workers (API)
- **External APIs**: ESPN NFL API
- **PWA**: Workbox with service workers

## Quick Start

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager
- Cloudflare account (for deployment)
- Wrangler CLI (for Workers deployment)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/nfl-pickem-app.git
cd nfl-pickem-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .dev.vars for local development
echo "JWT_SECRET=your-secret-key-here" > .dev.vars
```

4. **Start development servers:**
```bash
# Terminal 1: Frontend dev server (http://localhost:5173)
npm run dev

# Terminal 2: Workers dev server (http://localhost:8787)
npm run workers:dev
```

5. **Test the application:**
- Open http://localhost:5173
- Sign in with test account:
  - Email: `test@example.com`
  - Password: `password123`

## Development

### Project Structure

```
nfl-pickem-app/
├── src/
│   ├── components/        # React components
│   │   ├── mobile/        # Mobile-specific components
│   │   └── ...            # Shared components
│   ├── pages/             # Page components
│   │   ├── GamesPage.tsx  # Main picks interface
│   │   ├── LeaderboardPage.tsx
│   │   └── ...
│   ├── contexts/          # React contexts (Auth, Notifications)
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── worker.ts          # Cloudflare Worker API
│   └── main.tsx           # Vite entry point
├── lib/                   # Database and business logic
│   └── db-workers.ts      # D1 database operations
├── public/                # Static assets
├── tests/                 # E2E and unit tests
│   └── e2e/              # Playwright tests
├── docs/                  # Documentation
│   ├── API.md            # API documentation
│   └── DEPLOYMENT.md     # Deployment guide
└── wrangler-workers.toml  # Workers configuration
```

### Available Scripts

**Development:**
- `npm run dev` - Start Vite dev server (frontend)
- `npm run workers:dev` - Start Workers dev server (API)
- `npm run build` - Build frontend for production
- `npm run type-check` - Run TypeScript type checking

**Deployment:**
- `npm run workers:deploy` - Deploy Workers to production
- `npm run workers:deploy-prod` - Deploy with production config

**Testing:**
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run lint` - Run ESLint

**Database:**
- `wrangler d1 execute nfl-pickem-db --remote --command="SELECT * FROM games LIMIT 5;"`
- `wrangler d1 execute nfl-pickem-db --remote --command="PRAGMA table_info(games);"`

### Configuration Files

- **vite.config.ts** - Vite configuration
- **wrangler-workers.toml** - Cloudflare Workers config
- **tailwind.config.ts** - Tailwind CSS config
- **tsconfig.json** - TypeScript config
- **playwright.config.ts** - E2E test config

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deployment:**

1. **Deploy Workers API:**
```bash
npm run workers:deploy-prod
```

2. **Deploy Frontend:**
```bash
npm run build
npx wrangler pages deploy dist
```

3. **Configure Environment Variables:**
- Set `JWT_SECRET` in Cloudflare Workers settings
- Set `VITE_API_BASE_URL` for production API

## API Documentation

See [API.md](docs/API.md) for complete API documentation including all endpoints, request/response schemas, and authentication details.

**Base URL:** `https://nfl-pickem-app-production.m-de6.workers.dev`

**Key Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/games` - Get NFL games
- `POST /api/picks` - Submit pick
- `GET /api/leaderboard` - Get standings

## Testing

### Test Credentials
- **Email:** test@example.com
- **Password:** password123

### Running Tests

```bash
# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## Production Features

### Automated Systems
- **Cron Jobs**: Run every 15 minutes for score updates
- **Auto-Pick Generation**: Automatic picks for missed deadlines
- **Game Locking**: Automatic lock at game start time
- **Real-Time Updates**: SSE with polling fallback

### Performance
- **React.memo**: Optimized component rendering
- **Lazy Loading**: Images and routes
- **Code Splitting**: Automatic chunk splitting
- **PWA Caching**: Workbox service worker

### Security
- **Input Sanitization**: XSS prevention
- **JWT Expiration**: 24-hour token lifecycle
- **API Retry Logic**: Exponential backoff
- **CORS Protection**: Proper origin validation

## Architecture Decisions

### Why Cloudflare?
- **Global CDN**: Low latency worldwide
- **Serverless**: No server management
- **D1 Database**: SQLite with edge replication
- **Cost Effective**: Free tier covers most use cases

### Why Vite + React?
- **Fast Builds**: Sub-second HMR
- **Modern Stack**: Latest React features
- **TypeScript**: Full type safety
- **PWA Support**: Built-in service workers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:e2e`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- **NFL Data**: Provided by ESPN API
- **Hosting**: Cloudflare Pages and Workers
- **Icons**: Heroicons
- **Design**: Tailwind CSS
- **Testing**: Playwright

## Support

For questions or issues, please:
1. Check the [API Documentation](docs/API.md)
2. Review the [Deployment Guide](docs/DEPLOYMENT.md)
3. Open an issue on GitHub
