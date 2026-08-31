# Kudostack

A social fic tracker — log the fanfiction you read, rate it, and see what friends are reading and recommending. Think Letterboxd, but for fic.

## Stack

- **Client**: React + TypeScript (Vite), React Router, Tailwind CSS v4
- **Server**: Node + Express + TypeScript, Prisma ORM over SQLite
- **Auth**: username/password with bcrypt + JWT in an httpOnly cookie

## Project layout

```
server/   Express API + Prisma schema/migrations
client/   React app (Vite)
```

## Getting started

### 1. Server

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # creates dev.db and applies migrations
npm run seed             # seeds common trope/warning/spice tags
npm run dev              # http://localhost:4000
```

### 2. Client

```bash
cd client
npm install
npm run dev               # http://localhost:5173, proxies /api to the server
```

Open http://localhost:5173, create an account, and start logging fics.

## Data model

- **Fic** — title, fandom, author, status, total chapters, word count, tags, AO3 link (stored, not scraped)
- **Tag** — name + category (trope / warning / spice / other) so stats aggregate cleanly
- **ReadEvent** — one user's read of one fic: type (first read / reread), status (reading / finished / want to read / DNF), half-star rating, review, chapter progress, dates. A fic can have many ReadEvents per user to support rereads.
- **User** — username, bio, one-way follows (like Twitter/Letterboxd, no approval needed)
- **Recommendation** — a direct fic rec from one user to another, separate from a public rating

## Design constraints (deliberate, not oversights)

- No comment threads on reviews, no @-mentions — prevents pile-ons and discourse wars
- Friends-only activity feed — never a global or algorithmic feed
- Content warning and spice-level tags are private by default; each read event has its own visibility flags so a user opts in per-log, not globally
- Scope is a tracker with a social layer, not a forum

## Out of scope for v1

AO3 scraping/auto-import, automatic "fic updated" detection, native mobile apps, payments.
