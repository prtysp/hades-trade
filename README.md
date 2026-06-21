# Hades Star Market

A web application for trading in-game artifacts in the Hades Star universe. Players can create listings, express interest in trades, manage their inventory, and customize their trading experience.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Seeding Data](#seeding-data)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [User Guide](#user-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Features

- **Trade Listings** — Create listings offering artifacts for Free, Donation, or Trade
- **Artifact Management** — Manage your inventory of Combat, Transport, Mining, Drone, Weapon, and Shield artifacts
- **Trade Flow** — Express interest in listings, confirm trades, and track trade status
- **Notifications** — Real-time notifications for trade activity (interest expressed, trade confirmed, completed, etc.)
- **Trade Preferences** — Set per-category filters to be notified about artifacts matching your criteria
- **Share Format Customization** — Customize the message format used when sharing listings
- **Theme Customization** — Choose from 8 dark/light themes (Dracula, Tokyo Night, Gruvbox, Nord, Catppuccin, and their light variants)
- **Font Options** — Sans Serif, Monospace, or Serif
- **Privacy Controls** — Toggle visibility of inventory, listings, archived items, and trade preferences
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** JWT-based sessions stored in httpOnly cookies
- **UI Components:** Radix UI primitives + custom components
- **Deployment:** Vercel (or any Node.js host)

## Prerequisites

- **Node.js** 18+ (recommended: use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL** 16+ (local or managed)
- **npm**, **pnpm**, or **bun** package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and update it:

```bash
cp .env.example .env
```

Edit `.env` with your database connection string and a secure JWT secret:

```env
DATABASE_URL=postgresql://hades:hades_secret@localhost:5432/hades_star_market?schema=public
JWT_SECRET=your-long-random-secret-key-here
```

> **Note:** If using Docker Compose (see below), the default values already match.

### 4. Set Up the Database

**Option A: Docker Compose (recommended for local dev)**

```bash
docker-compose up -d
```

This starts a PostgreSQL 16 container with the configured database.

**Option B: Existing PostgreSQL instance**

Make sure your database is running and the connection string in `.env` is correct.

### 5. Initialize the Database Schema

```bash
npm run db:push
```

This creates all tables based on the Prisma schema.

### 6. (Optional) Seed Sample Data

```bash
npm run db:seed
```

This populates the database with sample players, artifacts, listings, and trade preferences. All seeded users have the password `password123`.

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/hades_star_market?schema=public` |
| `JWT_SECRET` | Secret key for signing session JWTs | Generate with `openssl rand -base64 32` |

## Database Setup

### Prisma Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema to database (creates tables) |
| `npx prisma generate` | Generate Prisma Client (runs automatically on install) |
| `npx prisma db studio` | Open Prisma Studio (visual database editor) |
| `npm run db:seed` | Seed database with sample data |

### Schema Overview

- **Player** — User accounts with theme, privacy, and share format preferences
- **Artifact** — In-game items with category, bonus %, and level
- **Listing** — Trade offers with status, price type, and expiration
- **ListingArtifact** — Joins artifacts to listings as OFFERING or WANTING
- **Interest** — Players expressing interest in a listing
- **Trade** — Confirmed trade between two players
- **Notification** — Alerts for trade activity
- **Preference** — Per-player trade matching criteria
- **Session** — Active authentication sessions

## Running the App

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Seeding Data

The seed script creates:

- **4 players**: StarBlazer, NebulaHunter, VoidWalker, CosmicTrader
- **~4–10 artifacts per player** across all 6 categories
- **1–2 listings per player** (mix of Free, Donation, and Trade types)
- **Trade preferences** per player with category-specific thresholds

All seeded accounts use the password: `password123`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── artifacts/          # Artifact CRUD
│   │   ├── auth/               # Login, logout, register, me
│   │   ├── interests/          # Express/manage trade interest
│   │   ├── listings/           # Listing CRUD
│   │   ├── notifications/      # Notification list & acknowledge
│   │   ├── players/            # Player profiles
│   │   ├── preferences/        # Trade preference settings
│   │   ├── settings/           # Theme, privacy, share format
│   │   └── trades/             # Trade management
│   ├── artifacts/              # Artifact inventory page
│   ├── listings/[id]/          # Listing detail page
│   ├── login/                  # Login page
│   ├── notifications/          # Notifications page
│   ├── players/[id]/           # Player profile & create listing
│   ├── register/               # Registration page
│   ├── settings/               # Settings page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (listing feed)
├── components/
│   ├── AuthProvider.tsx        # Client-side auth context
│   ├── ShareButton.tsx         # Copy shareable listing text
│   ├── ShareFormatEditor.tsx   # Customize share message template
│   ├── ListingCard.tsx         # Listing card component
│   ├── ListingFilters.tsx      # Feed filter controls
│   ├── ThemeSelector.tsx       # Theme picker
│   ├── OsNotificationToggle.tsx
│   ├── PrivacyToggle.tsx
│   └── ...
└── lib/
    ├── auth.ts                 # Authentication helpers
    ├── prisma.ts               # Prisma client singleton
    ├── themes.ts               # Theme definitions
    └── ...
prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Seed script
```

## API Routes

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in and create session |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Get current player profile |

### Artifacts

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/artifacts` | List player's artifacts |
| POST | `/api/artifacts` | Add a new artifact |
| PATCH | `/api/artifacts/[id]` | Update an artifact |
| DELETE | `/api/artifacts/[id]` | Delete/archive an artifact |

### Listings

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/listings` | List active listings (with filters) |
| POST | `/api/listings` | Create a new listing |
| GET | `/api/listings/[id]` | Get listing details |
| PATCH | `/api/listings/[id]` | Update a listing |
| DELETE | `/api/listings/[id]` | Cancel/delete a listing |

### Interests

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/interests` | Express interest in a listing |
| PATCH | `/api/interests/[id]` | Accept/reject interest |

### Trades

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/trades` | List player's trades |
| POST | `/api/trades` | Create a trade (from accepted interest) |
| PATCH | `/api/trades/[id]` | Confirm/cancel/complete a trade |

### Notifications

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notifications` | List player's notifications |
| POST | `/api/notifications/acknowledge` | Mark notification as read |

### Settings

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/settings/theme` | Update theme, font, privacy, share format |
| POST | `/api/settings/corporation` | Update corporation & Discord username |

### Players

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/players` | List all players |
| GET | `/api/players/[id]` | Get player profile |

## User Guide

### Registration & Login

1. Navigate to `/register` and create an account with a username, corporation, and password.
2. After registration, you'll be logged in automatically.
3. Use `/login` to return later. Sessions last 30 days.

### Managing Your Inventory

1. Go to `/players/your-player-id` to view your profile.
2. Click "Add Artifact" to add items to your inventory.
3. Each artifact has a **category** (Combat, Transport, Mining, Drone, Weapon, Shield), **bonus %**, and **level**.

### Creating a Listing

1. From your player profile, click "+ Create Listing".
2. Select artifacts from your inventory as **Offering** (what you're giving away).
3. Optionally add **Wanting** artifacts (what you'd like in return — Trade type only).
4. Set the price type: **Free**, **Donation**, or **Trade**.
5. Add an optional description.
6. Listings expire automatically based on the selected duration.

### Expressing Interest in a Trade

1. Browse listings on the home page.
2. Click on a listing to view details.
3. Click "Express Interest" and optionally include a message.
4. The listing owner can accept or reject your interest.

### Completing a Trade

1. When a listing owner accepts your interest, a trade is created.
2. Both parties must confirm the trade.
3. Once both confirm, artifacts are transferred and the trade is marked complete.

### Setting Trade Preferences

1. Go to `/settings` and scroll to the Preferences section.
2. Set minimum bonus % and level thresholds for each artifact category.
3. You'll receive notifications when new listings match your preferences.

### Customizing Your Share Format

1. Go to `/settings` → Share Format section.
2. Edit the template using available variables:
   - `{typeLine}` — Listing type (Free/Donation/Trade)
   - `{descriptionLine}` — Listing description
   - `{offeringLine}` — Artifacts being offered
   - `{wantingLine}` — Artifacts wanted
   - `{urlLine}` — Direct link to the listing
3. Preview shows how the message will look with sample data.
4. Click "Save Format" to apply.

### Customizing Themes

1. Go to `/settings` → Appearance section.
2. Select from 8 themes (4 dark, 4 light).
3. Choose a font family (Sans, Mono, Serif).
4. Changes apply immediately.

### Privacy Settings

1. Go to `/settings` → Privacy section.
2. Toggle visibility of your inventory, active listings, archived items, and trade preferences.

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com/new).
3. Set the environment variables (`DATABASE_URL`, `JWT_SECRET`) in the Vercel dashboard.
4. Deploy — the build command is configured in `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && prisma db push --accept-data-loss && next build",
  "installCommand": "npm install"
}
```

> **Note:** The build command includes `prisma db push --accept-data-loss` to auto-create tables. For production, consider using migrations instead.

### Deploy to a VPS / Self-Hosted

1. Ensure Node.js 18+ and PostgreSQL are installed on the server.
2. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url> /opt/hades-star-market
   cd /opt/hades-star-market
   npm install
   ```
3. Set up environment variables in a `.env` file.
4. Push the schema and build:
   ```bash
   npm run db:push
   npm run build
   ```
5. Start the production server:
   ```bash
   npm run start
   ```
6. Use a process manager like **pm2** to keep it running:
   ```bash
   pm2 start npm --name hades-star -- start
   ```
7. Set up a reverse proxy (nginx/caddy) for SSL termination.

### Docker

You can also containerize the app alongside the database using the included `docker-compose.yml`:

```bash
docker-compose up -d
```

To add an app service to the compose file, create a `Dockerfile` and add the service definition.

## Troubleshooting

### Database connection errors
- Ensure PostgreSQL is running and accessible.
- Verify `DATABASE_URL` in `.env` matches your database credentials.
- Check that the database `hades_star_market` exists.

### Prisma errors after schema changes
```bash
npx prisma generate
npm run db:push
```

### Share format not applying
- Make sure you're logged in (the share format is stored per-player).
- After saving a new format in settings, navigate to a listing and try sharing again.
- The format is fetched from the server on page load; refresh if needed.

### Themes not persisting
- Themes are saved to your player profile in the database.
- Ensure you're logged in when changing themes.
- Check that `DATABASE_URL` is correctly configured.

### Build fails on Vercel
- Ensure `DATABASE_URL` and `JWT_SECRET` are set in Vercel environment variables.
- The build runs `prisma generate` automatically via the `postinstall` hook.
