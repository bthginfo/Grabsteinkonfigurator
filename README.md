# Grabstein Konfigurator

Online-Konfigurator für Grabmäler (DACH) — eigene App ohne externes CMS.

**Architektur & Roadmap:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)  
**Credits für 3D/Assets:** [ATTRIBUTIONS.md](ATTRIBUTIONS.md)

## Voraussetzungen

- Node.js 20+
- npm
- Optional: Docker (für PostgreSQL lokal)

## Einrichtung

```bash
cd "Grabstein Konfigurator"
copy .env.example .env
```

PostgreSQL starten (empfohlen):

```bash
docker compose up -d
```

Schema anwenden (nach `docker compose up -d` oder wenn `DATABASE_URL` gesetzt ist):

```bash
npx prisma migrate deploy
```

Für lokale Entwicklung mit Schema-Iteration alternativ:

```bash
npx prisma migrate dev
```

Ohne Docker: `DATABASE_URL` in `.env` setzen (z. B. verwaltete Postgres-Instanz), dann dieselben Prisma-Befehle.

## Entwicklung

```bash
npm run dev
```

- Startseite: [http://localhost:3000](http://localhost:3000)  
- Konfigurator: [http://localhost:3000/konfigurator](http://localhost:3000/konfigurator)  
- Admin (Platzhalter): [http://localhost:3000/admin](http://localhost:3000/admin)

## Nützliche Befehle

| Befehl | Zweck |
|--------|--------|
| `npm run build` | Produktions-Build (inkl. `prisma generate`) |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:push` | Schema auf DB pushen (ohne Migrationsdatei) |

## Phase 0 (erledigt)

- Next.js 16 (App Router), TypeScript, Tailwind, ESLint
- Prisma + PostgreSQL (`Order`-Modell), Docker Compose
- Routen-Gruppen: Marketing `/`, Konfigurator `/konfigurator`, Admin `/admin`
- `ATTRIBUTIONS.md`, `config/catalog/placeholder.json`, `public/models/`

## Paketname

Das npm-Paket heißt `grabstein-konfigurator` (der Ordnername mit Leerzeichen ist für npm ungültig — das ist unkritisch für den lokalen Pfad).
