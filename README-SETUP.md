# NFL Pick'em App - Setup Guide

## 🏈 Quick Start for Testing

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your settings:
DATABASE_URL="postgresql://username:password@localhost:5432/nfl_pickem"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed NFL teams
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000 to start testing!

## 🎯 Testing Features

### Core Functionality to Test:

1. **Authentication**
   - Sign up new user at `/signup`
   - Sign in at `/signin`
   - Profile management at `/profile`

2. **NFL Data**
   - Sync games: `npm run sync:nfl` (requires dev server running)
   - View games at `/games`
   - Check database: `npm run db:studio`

3. **Picks System**
   - Make picks at `/picks`
   - View dashboard at `/dashboard`
   - Check leaderboard at `/leaderboard`

4. **Admin Features** (if user has isAdmin=true)
   - Admin panel at `/admin`
   - Sync games via UI
   - Recalculate scores

### Sample Test Flow:
1. Start app: `npm run dev`
2. Create account at http://localhost:3000/signup
3. Sync NFL data: `npm run sync:nfl`
4. Make picks at http://localhost:3000/picks
5. View leaderboard at http://localhost:3000/leaderboard

## 🔧 Database Management

```bash
# View/edit data
npm run db:studio

# Reset database
npm run db:push --force-reset
npm run db:seed

# Sync latest NFL games
npm run sync:nfl
```

## 📱 Key Features Implemented

✅ **User System**: Registration, login, profile management  
✅ **NFL Data**: Live games, scores, team info from ESPN API  
✅ **Picks**: Interactive game selection with deadlines  
✅ **Scoring**: Automatic validation and point calculation  
✅ **Leaderboards**: Weekly and season rankings  
✅ **Admin Tools**: Data sync and score management  
✅ **Responsive UI**: Mobile-friendly design  

## 🚀 Production Deployment

For production deployment:
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npm run db:migrate`
4. Deploy to Cloudflare Pages + Workers

## 🐛 Common Issues

**Database Connection**: Ensure PostgreSQL is running and credentials are correct  
**NFL Data**: Games sync from ESPN API - may be limited during off-season  
**Picks**: Users can only pick before game start times  
**Admin**: Set `isAdmin: true` in database for admin features  

Happy testing! 🏈