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

**Datenbank (Standard lokal):** SQLite (`DATABASE_URL=file:../dev.db` → Datei `dev.db` im Projektroot). Nach `copy .env.example .env` einmal:

```bash
npx prisma db push
```

**Optional PostgreSQL:** `docker compose up -d`, in `.env` die Postgres-`DATABASE_URL` setzen und in `prisma/schema.prisma` wieder `postgresql` verwenden — Details: [docs/VERCEL-POSTGRES.md](docs/VERCEL-POSTGRES.md).

Mit Postgres statt SQLite:

```bash
npx prisma migrate dev
```

## Entwicklung

```bash
npm run dev
```

- Startseite: [http://localhost:3000](http://localhost:3000)  
- Konfigurator (neuer Entwurf): [http://localhost:3000/konfigurator](http://localhost:3000/konfigurator)  
- Entwurf fortsetzen: URL aus der Adresszeile nach „Neuen Entwurf starten“ (`/konfigurator/d/…`)
- PDF-Download (nach Wizard Zusammenfassung): `GET /api/orders/<orderId>/pdf?variant=customer-de` bzw. `variant=supplier-en`
- Admin (Platzhalter): [http://localhost:3000/admin](http://localhost:3000/admin)

## Nützliche Befehle

| Befehl | Zweck |
|--------|--------|
| `npm run build` | Produktions-Build (inkl. `prisma generate`) |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:push` | Schema auf DB pushen (ohne Migrationsdatei) |
| `npm run test` | Vitest (Preis-Golden-Test) |

## Vercel (Deployment)

- **Build:** `npm run build` führt `prisma generate` aus; für den Build allein ist **keine** laufende DB nötig.
- **Runtime:** Auf Vercel **PostgreSQL** verwenden (SQLite dort nicht sinnvoll). Schritte zum Umstellen des Prisma-Schemas und `binaryTargets`: [docs/VERCEL-POSTGRES.md](docs/VERCEL-POSTGRES.md).
- **Hinweis:** Entwurfs-URLs (`/konfigurator/d/…`) sind ohne Auth öffentlich — für Produktion Zugriffsschutz oder Token ergänzen.

## Phase 0–3 (Stand)

- Wizard, Preis, SQLite lokal, PDF/Mail (Phase 0–2).
- **3D:** Schritt 11 — `MonumentPreview` (R3F + drei), `lib/preview/stone-appearance.ts`, PNG-Screenshot.

## Paketname

Das npm-Paket heißt `grabstein-konfigurator` (der Ordnername mit Leerzeichen ist für npm ungültig — das ist unkritisch für den lokalen Pfad).
