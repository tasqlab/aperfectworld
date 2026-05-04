# Realm of Legends — 2D RPG MMO

## Overview
A full browser-based 2D RPG MMO built with React + Vite + Phaser 3 (frontend) and Express + Socket.io + PostgreSQL (backend).

## Architecture

### Monorepo Structure
```
artifacts/
  rpg-game/         — React+Vite frontend (port 20192, path /)
  api-server/       — Express+Socket.io backend (port 8080, path /api, /socket.io)
lib/
  db/               — Drizzle ORM schema + pg pool (composite, must build before typechecking api-server)
  api-spec/         — OpenAPI spec + Orval codegen
  api-zod/          — Generated Zod schemas
  api-client-react/ — Generated React Query hooks + custom-fetch
```

### Key Technologies
- **Frontend**: React 18, Vite, Phaser 3, Zustand, TailwindCSS, socket.io-client, Wouter (routing)
- **Backend**: Express, Socket.io, Drizzle ORM, bcrypt, jsonwebtoken (JWT), pino logging
- **Database**: PostgreSQL via `DATABASE_URL` env var, Drizzle migrations

## Game Features
- **Auth**: Register/login with JWT stored in localStorage; `setAuthTokenGetter` wires token to all API calls
- **Characters**: 4 classes (warrior/mage/archer/rogue), XP/leveling with stat scaling, kill/death tracking
- **World**: 3200×2400 Phaser 3 tilemap world with camera follow; enemies spawn and AI-move server-side
- **Combat**: Click or SPACE to attack nearest enemy; floating damage numbers; loot drops on kill
- **Multiplayer**: Socket.io syncs player positions, enemy positions, combat results, chat in real-time
- **HUD**: Portrait (HP/MP/XP bars), ActionBar (SPACE=attack, I=inventory, C=character, L=leaderboard), Chat, Minimap
- **Panels**: Inventory grid (40 slots, rarity colors, drop items), Stats panel, Leaderboard (top 20)
- **Death/Respawn**: Death overlay with respawn button; character respawns at sanctuary

## Socket.io Events
| Client → Server | Description |
|---|---|
| `join` | Authenticate with JWT token |
| `move` | Send new x/y position |
| `attack` | Attack enemy or player by targetId/targetType |
| `chat` | Send chat message |
| `respawn_request` | Request respawn after death |

| Server → Client | Description |
|---|---|
| `world_state` | Initial players + enemies snapshot |
| `player_joined/left` | Multiplayer presence |
| `player_moved` | Other player moved |
| `enemy_moved/died/spawned` | Enemy state updates |
| `combat_result` | Attack damage result |
| `xp_gained` | XP and level-up notification |
| `respawn` | New position + HP after respawn |
| `chat_message` | Broadcast chat |

## Database Tables
- `users` — id, username, password_hash
- `characters` — full character stats, position, equipment
- `inventory` — items with rarity, stat bonuses, equipped flag

## API Routes
- `POST /api/auth/register` — register + create character
- `POST /api/auth/login` — login, returns JWT
- `GET /api/auth/me` — get current user + character
- `GET /api/characters/:id` — get character
- `GET /api/characters/:id/inventory` — get inventory
- `DELETE /api/characters/:id/inventory/:itemId` — drop item
- `GET /api/world/leaderboard?limit=N` — top players by kills
- `GET /api/world/online` — online player count + positions

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (provisioned by Replit)
- `SESSION_SECRET` — JWT signing secret (in Replit secrets)
- `PORT` — assigned by Replit per service

## Important Notes
- After running codegen (`pnpm --filter @workspace/api-spec run codegen`), manually fix `lib/api-zod/src/index.ts` to only export `./generated/api`
- Run `pnpm run typecheck:libs` before typechecking `api-server` (lib/db is composite and must be built first)
- Socket.io path `/socket.io` is in the API server's `artifact.toml` paths array alongside `/api`
- Dark fantasy theme: deep navy (#0a0a12 background) + gold primary (HSL 45 90% 55%)

## Keyboard Shortcuts (in-game)
- `WASD` / Arrow keys — move
- `SPACE` — attack nearest enemy
- `I` — toggle inventory
- `C` — toggle character stats
- `L` — toggle leaderboard
- `Click` enemy — attack that enemy
