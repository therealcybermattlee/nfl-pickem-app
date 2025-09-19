# NFL Pick'em Web Application

A modern web application for managing NFL pick'em pools where users can make weekly game predictions and compete against friends and family.

## Features

- **User Authentication**: Secure login and registration system
- **Live NFL Data**: Real-time game schedules and scores from official APIs
- **Weekly Picks**: Make predictions before game time with automatic lockout
- **Live Scoring**: Automatic point calculation as games complete
- **Leaderboards**: Track standings by week and season
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Admin Panel**: Manage pools, users, and override results if needed

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Cloudflare Pages + Workers
- **External APIs**: ESPN/NFL Data API

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nfl-pickem-app.git
cd nfl-pickem-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database connection in `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/nfl_pickem"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Project Structure

```
nfl-pickem-app/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # User dashboard
│   └── admin/            # Admin panel
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run prisma:studio` - Open Prisma Studio

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NFL data provided by ESPN API
- UI components from shadcn/ui
- Inspired by traditional office pick'em pools