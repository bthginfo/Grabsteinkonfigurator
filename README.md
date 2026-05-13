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
- Konfigurator (neuer Entwurf): [http://localhost:3000/konfigurator](http://localhost:3000/konfigurator)  
- Entwurf fortsetzen: URL aus der Adresszeile nach „Neuen Entwurf starten“ (`/konfigurator/d/…`)
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

- **Build:** `npm run build` führt `prisma generate` aus; **keine** DB-Verbindung nötig nur für den Build.
- **Umgebung:** In Vercel `DATABASE_URL` auf verwaltetes Postgres setzen (z. B. [Neon](https://neon.tech)), danach `npx prisma migrate deploy` einmalig (lokal oder CI) gegen dieselbe DB ausführen.
- **Prisma:** Im Schema ist `binaryTargets = ["native", "rhel-openssl-3.0.x"]` gesetzt — passend für Linux-Serverless auf Vercel.
- **Hinweis:** Entwurfs-URLs (`/konfigurator/d/…`) sind ohne Auth öffentlich — für Produktion Zugriffsschutz oder Token ergänzen.

## Phase 0–1 (Stand)

- **Phase 0:** Next.js, Prisma, Docker-Compose-Beispiel, Routen-Gruppen.
- **Phase 1:** 11-Schritt-Wizard (Zustand), `config/catalog/sample.json`, `lib/pricing/calculate`, Vitest, Server Actions `createDraft` / `saveDraft`, dynamische Route `konfigurator/d/[orderId]`.

## Paketname

Das npm-Paket heißt `grabstein-konfigurator` (der Ordnername mit Leerzeichen ist für npm ungültig — das ist unkritisch für den lokalen Pfad).
